import * as S from './sim.js';
import { guideHTML, installHTML } from './guide.js';
// Install help: which device is this, are we already installed, and can the browser offer a one-tap install?
const UA = navigator.userAgent;
const device = /SamsungBrowser/i.test(UA) ? 'samsung' : /iPhone|iPad|iPod/i.test(UA) || (/Macintosh/i.test(UA) && navigator.maxTouchPoints > 1) ? 'ios' : /Android/i.test(UA) ? (/Firefox/i.test(UA) ? 'firefox' : 'android') : 'desktop';
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let deferredInstall = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (menuTab === 'install') renderMenu(); });
addEventListener('appinstalled', () => { deferredInstall = null; if (menuTab === 'install') renderMenu(); });
const { R, CELL, GN, DAY } = S;

const $ = id => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');
const SAVE = 'motes.save.v1', SAVED_AT = 'motes.savedAt';
let w, selId = 0, follow = false, tool = 'look', brush = 40, view = 0, speed = 1, paused = false, menuTab = 'species';
const cam = { x: 0, y: 0, z: 0.6 };
let W = 0, H = 0, dpr = 1;
let catching = null;

// ---------- boot ----------
let firstRun = false;
function load() {
  try { const s = localStorage.getItem(SAVE); if (s) return S.deserialize(s); } catch (e) { console.warn('load failed', e); }
  firstRun = true;
  return S.createWorld((Date.now() & 0x7fffffff) || 7);
}
w = load();
// First visit: offer the pre-evolved dish (simulated for years on the dev machine before shipping).
async function loadStarter(intro, name = 'dish') {
  try {
    const r = await fetch('starter/' + name + '.json'); if (!r.ok) throw new Error('no starter');
    w = S.deserialize(await r.text()); selId = 0; localStorage.setItem(SAVED_AT, String(Date.now())); save();
    if (intro) {
      const o = $('over'); o.style.display = 'flex';
      const yrs = (w.t / S.YEAR).toFixed(1);
      o.innerHTML = `<div style="font-size:18px">This dish is already ${yrs} years old</div><div class="dim" style="max-width:330px">Before it reached you it was fast-forwarded for ${yrs} dish-years while the motes evolved. Read the Diary (☰) to see what happened, tap ? for the Guide, or start again from the first six founders.</div><button id="stWatch">Watch it</button><button id="stFresh">Start a fresh dish instead</button>${isStandalone() ? '' : '<button id="stInstall">📲 Install it as an app</button>'}`;
      $('stWatch').onclick = () => { o.style.display = 'none'; };
      if ($('stInstall')) $('stInstall').onclick = () => { o.style.display = 'none'; menuTab = 'install'; openMenu(); };
      $('stFresh').onclick = () => { w = S.createWorld((Date.now() & 0x7fffffff) || 7); selId = 0; save(); o.style.display = 'none'; };
    }
    return true;
  } catch (e) { return false; }
}
// backup storage: if the browser's small localStorage is full (a big evolved dish), the save goes to IndexedDB instead
const idb = (mode, fn) => new Promise((res, rej) => { const r = indexedDB.open('motes', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('kv', mode), st = tx.objectStore('kv'), q = fn(st); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); }; });
const idbPut = (s) => idb('readwrite', st => st.put({ s, at: Date.now() }, 'save'));
const idbGet = () => idb('readonly', st => st.get('save'));
if (firstRun) {
  idbGet().then(rec => {
    if (rec && rec.s) { w = S.deserialize(rec.s); firstRun = false; selId = 0; if (matchMedia('(pointer:coarse)').matches && w.maxPop > 450) w.maxPop = 450; maybeCatchUp((Date.now() - rec.at) / 1000); }
    else loadStarter(true);
  }).catch(() => loadStarter(true));
}
if (matchMedia('(pointer:coarse)').matches) { if (w.maxPop > 450) w.maxPop = 450; }
let fitted = false;
function resize() {
  dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = Math.max(1, W * dpr); cv.height = Math.max(1, H * dpr);
  if (!fitted && W > 50 && H > 50) { cam.z = Math.min(W, H) / (2 * R) * 1.05; fitted = true; }
}
addEventListener('resize', resize); resize();

function save() {
  try { localStorage.setItem(SAVE, S.serialize(w)); localStorage.setItem(SAVED_AT, String(Date.now())); }
  catch (e) {
    console.warn('save failed, using backup storage', e);
    idbPut(S.serialize(w)).then(() => { if (!save.told) { save.told = true; showHint('x', 'Your dish is big, so it is saving to backup storage. That is fine.'); } }).catch(e2 => console.warn('backup save failed', e2));
  }
}
setInterval(save, 15000);
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); save(); }
  else if (hiddenAt) { const away = (Date.now() - hiddenAt) / 1000; hiddenAt = 0; maybeCatchUp(away); }
});
addEventListener('pagehide', save);
{ const sa = +localStorage.getItem(SAVED_AT); if (sa) maybeCatchUp((Date.now() - sa) / 1000); }

function fmtDur(s) { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}h ${m}m` : m ? `${m}m ${s % 60}s` : `${s}s`; }
function maybeCatchUp(awaySec) {
  if (awaySec < 30 || catching || !w.motes.length) return;
  const cu = S.beginCatchUp(w, awaySec); cu.away = awaySec;
  if (cu.ticks < 4) return;
  catching = cu;
  const o = $('over'); o.style.display = 'flex';
  o.innerHTML = `<div style="font-size:18px">Welcome back</div><div class="dim">You were away ${fmtDur(awaySec)}.<br>Your motes lived about ${fmtDur(cu.simSec)} of dish time.</div><div id="prog"><b></b></div><button id="skip">Skip ahead</button>`;
  $('skip').onclick = () => { cu.ticks = cu.done; };
}
function catchStep() {
  const cu = catching, fin = S.runCatchUp(cu, 12);
  const b = document.querySelector('#prog b'); if (b) b.style.width = Math.min(100, (cu.done / Math.max(1, cu.ticks)) * 100) + '%';
  if (fin) {
    catching = null;
    const r = S.catchUpReport(cu), o = $('over');
    o.innerHTML = `<div style="font-size:18px">While you were away</div><div style="text-align:left;line-height:1.7">Population: ${r.popBefore} → <b>${r.popAfter}</b><br>Born: ${r.births} · Died: ${r.deaths} · Caught: ${r.kills}<br>New species: ${r.newSp} · Extinct: ${r.extinct}<br>Structures built: ${r.built}</div><div class="dim">The last few motes are protected while you're away.<br>Details are in the Diary.</div><button id="ok">Look at the dish</button>`;
    $('ok').onclick = () => { o.style.display = 'none'; save(); };
    if (!w.motes.length) o.innerHTML += '<div>The dish is empty. Use ✨ Spark to seed life.</div>';
  }
}

// ---------- tools ----------
const TOOLS = [
  ['look', '👆 Look'], ['food', '🍃 Food'], ['wall', '🧱 Wall'], ['farm', '🌱 Farm'], ['nest', '🪺 Nest'], ['granary', '🏺 Granary'],
  ['heat', '🔥 Heat'], ['cold', '❄️ Cold'], ['toxin', '☠️ Toxin'], ['chemA', '🔴 Scent A'], ['chemB', '🟢 Scent B'], ['chemC', '🔵 Scent C'],
  ['plague', '🦠 Plague'], ['smite', '⚡ Smite'], ['meteor', '☄️ Meteor'], ['spark', '✨ Spark'], ['erase', '🧹 Erase'],
];
const bot = $('bot');
for (const [id, label] of TOOLS) { const b = document.createElement('button'); b.textContent = label; b.dataset.t = id; bot.appendChild(b); }
const bBrush = document.createElement('button'); bBrush.textContent = '◯ M'; bot.appendChild(bBrush);
function syncTools() { for (const b of bot.children) b.classList.toggle('on', b.dataset.t === tool); }
const HINTS = {
  look: 'Look: tap a mote to inspect it, drag to pan, pinch to zoom.',
  food: 'Food: hold and drag to sprinkle plants. Hungry motes smell it from far away.',
  wall: 'Wall: paint barriers. Motes steer around them.', farm: 'Farm: paint ground that keeps growing food.', nest: 'Nest: paint a place that heals motes and helps newborns.', granary: 'Granary: paint a store where motes can hoard energy.',
  heat: 'Heat: paint warmth (orange). Each kind has a favourite temperature: some seek it, others flee, and too hot drains energy.',
  cold: 'Cold: paint chill (blue). Each kind has a favourite temperature: some seek it, others flee, and too cold drains energy.',
  toxin: 'Toxin: paint poison (purple). Everything flees it and anything standing in it loses energy fast. It fades slowly.',
  chemA: 'Scent A (red): motes smell it. Some kinds are drawn to it and some run from it. Watch them react.',
  chemB: 'Scent B (green): motes smell it. Some kinds are drawn to it and some run from it. Watch them react.',
  chemC: 'Scent C (blue): motes smell it. Some kinds are drawn to it and some run from it. Watch them react.',
  plague: 'Plague: infect the motes under your finger.', smite: 'Smite: kill the motes under your finger.', spark: 'Spark: tap to drop in a brand-new founder: a new species with its own look.', meteor: 'Meteor: tap to drop one. It wipes out everything in the crater and burns the ground bare, then plants spring up around the rim.', erase: 'Erase: clears structures, food, scents, heat and toxin.',
};
const hintEl = document.createElement('div');
hintEl.style.cssText = 'position:fixed;left:50%;top:54px;transform:translateX(-50%);max-width:90vw;background:#000c;color:#fff;border:1px solid #fff3;border-radius:10px;padding:6px 12px;font-size:13px;line-height:1.3;z-index:20;pointer-events:none;transition:opacity .4s;opacity:0;text-align:center';
document.body.appendChild(hintEl);
let hintT = 0;
function showHint(t, text) { hintEl.textContent = text || HINTS[t] || ''; hintEl.style.opacity = 1; clearTimeout(hintT); hintT = setTimeout(() => { hintEl.style.opacity = 0; }, 5000); }
bot.onclick = e => { const t = e.target.dataset && e.target.dataset.t; if (t) { tool = t; syncTools(); showHint(t); } };
bBrush.onclick = () => { brush = brush === 20 ? 40 : brush === 40 ? 80 : 20; bBrush.textContent = '◯ ' + (brush === 20 ? 'S' : brush === 40 ? 'M' : 'L'); };
syncTools();
$('bPause').onclick = () => { paused = !paused; $('bPause').textContent = paused ? '▶' : '⏸'; };
$('bSpeed').onclick = () => { speed = speed === 1 ? 3 : speed === 3 ? 8 : speed === 8 ? 0.4 : 1; $('bSpeed').textContent = speed + '×'; };
const VIEWS = ['View', 'Scent A', 'Scent B', 'Scent C', 'Heat', 'Toxin'];
$('bView').onclick = () => { view = (view + 1) % VIEWS.length; $('bView').textContent = VIEWS[view]; };
$('bMenu').onclick = () => { openMenu(); };
$('bHelp').onclick = () => { menuTab = 'guide'; openMenu(); };
if (!localStorage.getItem('motes.seenGuide') && !firstRun) { localStorage.setItem('motes.seenGuide', '1'); setTimeout(() => { menuTab = 'guide'; openMenu(); }, 400); }
addEventListener('keydown', e => { if (e.code === 'Space') { $('bPause').click(); e.preventDefault(); } });

// ---------- camera / input ----------
const s2w = (sx, sy) => [(sx - W / 2) / cam.z + cam.x, (sy - H / 2) / cam.z + cam.y];
const ptrs = new Map();
let pinch = null, downAt = null, painting = null, panning = null;
cv.addEventListener('pointerdown', e => {
  try { cv.setPointerCapture(e.pointerId); } catch (_) { /* synthetic or already-released pointer */ }
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cx: cam.x, cy: cam.y }; painting = null; downAt = null; panning = null; return; }
  downAt = { x: e.clientX, y: e.clientY, moved: false };
  if (e.button === 1 || e.button === 2 || tool === 'look') { panning = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }; return; }
  const [wx, wy] = s2w(e.clientX, e.clientY);
  painting = { x: wx, y: wy };
  if (tool === 'smite') { sfx('zap'); buzz(25); } else if (tool === 'plague') { sfx('sick'); buzz(25); }
  if (tool === 'spark') { S.spark(w, wx, wy); painting = null; sfx('spark'); buzz(15); }
  if (tool === 'meteor') { S.meteor(w, wx, wy, 100); painting = null; shake = 1; sfx('boom'); buzz([60, 40, 60]); }
});
cv.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && ptrs.size >= 2) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    cam.z = Math.max(0.15, Math.min(8, pinch.z * d / pinch.d));
    if (!follow) { cam.x = pinch.cx - ((a.x + b.x) / 2 - pinch.mx) / cam.z; cam.y = pinch.cy - ((a.y + b.y) / 2 - pinch.my) / cam.z; }
    return;
  }
  if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) downAt.moved = true;
  if (panning) { if (downAt && downAt.moved) { cam.x = panning.cx - (e.clientX - panning.x) / cam.z; cam.y = panning.cy - (e.clientY - panning.y) / cam.z; follow = false; } }
  else if (painting) { const [wx, wy] = s2w(e.clientX, e.clientY); painting.x = wx; painting.y = wy; }
});
function up(e) {
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch = null;
  if (ptrs.size === 0) {
    if (downAt && !downAt.moved && tool === 'look' && e.type === 'pointerup') { const [wx, wy] = s2w(e.clientX, e.clientY); pick(wx, wy); }
    painting = null; panning = null; downAt = null;
  }
}
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => { e.preventDefault(); const [bx, by] = s2w(e.clientX, e.clientY); cam.z = Math.max(0.15, Math.min(8, cam.z * Math.exp(-e.deltaY * 0.0015))); const [ax, ay] = s2w(e.clientX, e.clientY); cam.x += bx - ax; cam.y += by - ay; }, { passive: false });

function pick(wx, wy) {
  let best = null, bd = Math.pow(Math.max(14, 22 / cam.z), 2);
  for (const m of w.motes) { const d = (m.x - wx) ** 2 + (m.y - wy) ** 2; if (d < bd) { bd = d; best = m; } }
  if (!best && follow && selected()) return;                 // while following, tapping empty water keeps following
  selId = best ? best.id : 0; follow = false; inspHidden = false; renderInsp(true); updChip();
}
// Follow mode: the info panel can be hidden while the camera keeps tracking; a small chip stays on screen.
let inspHidden = false;
const fchip = document.createElement('div');
fchip.style.cssText = 'position:fixed;top:52px;left:50%;transform:translateX(-50%);background:#101722ee;border:1px solid #58c08a;border-radius:16px;padding:6px 12px;display:none;z-index:5;white-space:nowrap';
document.body.appendChild(fchip);
fchip.onclick = e => { if (e.target.dataset.x) { follow = false; inspHidden = false; renderInsp(true); } else { inspHidden = false; renderInsp(true); } updChip(); };
function updChip() {
  const m = selected();
  const show = follow && inspHidden && m;
  fchip.style.display = show ? 'block' : 'none';
  if (show) fchip.innerHTML = `👁 Following <b>${esc(m.name)}</b> · <u>info</u> · <b data-x="1" style="padding-left:6px">✕ stop</b>`;
}
function startFollow(m) { selId = m.id; follow = true; inspHidden = true; cam.z = Math.max(cam.z, 2.2); renderInsp(true); updChip(); }
const selected = () => { if (!selId) return null; const m = w.motes.find(m => m.id === selId); return m || null; };

// ---------- inspector ----------
const insp = $('insp');
insp.innerHTML = '<div id="ibody"></div><canvas id="brain"></canvas>';
const ib = $('ibody'), bc = $('brain'), bctx = bc.getContext('2d');
let lastInsp = 0;
const dietLabel = d => d < 0.2 ? 'Grazer' : d < 0.45 ? 'Forager' : d < 0.7 ? 'Omnivore' : 'Hunter';
function bar(label, v, max = 1) { return `<span>${label}</span><i><b style="width:${Math.max(0, Math.min(100, v / max * 100))}%"></b></i>`; }
function renderInsp(force) {
  const m = selected();
  if (!selId) { insp.style.display = 'none'; return; }
  if (inspHidden && m) { insp.style.display = 'none'; return; }
  if (!m) { inspHidden = false; // died
    if (force || insp.dataset.dead !== String(selId)) { insp.dataset.dead = String(selId); ib.innerHTML = `<h3>That mote has died.</h3><button data-a="close">Close</button>`; bc.style.display = 'none'; }
    insp.style.display = 'block'; return;
  }
  insp.dataset.dead = ''; bc.style.display = 'block'; insp.style.display = 'block';
  const sp = w.species.get(m.sp), b = m.g.b;
  const kinds = [];
  if (m.sick > 0) kinds.push('sick'); if (m.imm > 0) kinds.push('immune');
  ib.innerHTML = `<h3><span class="dot" style="background:hsl(${m.hue * 360},75%,60%)"></span>${esc(m.name)} ${m.fav ? '★' : ''}</h3>
  <div class="dim">${sp ? esc(sp.name) : '?'} · ${dietLabel(m.diet)} · gen ${m.gen} · age ${Math.round(m.age)}/${Math.round(m.life)}s · kids ${m.kids} · kills ${m.kills} ${kinds.join(' ')}</div>
  ${m.anc.length ? `<div class="dim">Ancestors: ${m.anc.map(esc).join(' ← ')}</div>` : ''}
  ${socialText(m)}
  <div class="bars">${bar('energy', m.e, m.cap)}${bar('size', b[S.B.SIZE])}${bar('speed', b[S.B.SPEED])}${bar('senses', b[S.B.SENSE])}${bar('diet', b[S.B.DIET])}${bar('armor', b[S.B.ARMOR])}${bar('sunlight', b[S.B.PHOTO])}${bar('segments', m.segs - 2, 7)}${bar('length', b[S.B.LEN])}${bar('curl', Math.abs(m.curl))}${bar('wiggle', b[S.B.WAMP])}${bar('limbs', m.limbs, 4)}</div>
  <div class="dim">Brain: ${m.net.nc} connections, ${m.net.nh} hidden neurons. Output now: ${topOut(m)}</div>
  <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap"><button data-a="follow" class="${follow ? 'on' : ''}">Follow</button><button data-a="fav">${m.fav ? '★ Unstar' : '☆ Star'}</button><button data-a="feed">Feed</button><button data-a="clone">Clone</button><button data-a="rename">Rename</button><button data-a="close">${follow ? 'Hide' : 'Close'}</button></div>`;
}
function socialText(m) {
  const fam = [], fr = [], gr = [];
  for (const o of w.motes) { if (o === m) continue; const r = S.relOf(m, o); if (r > 0) fam.push(`${esc(o.name)} (${r === 1 ? (o.id === m.pa || o.id === m.pb ? 'parent' : 'child') : 'sibling'})`); }
  for (const [id, s] of m.fr) { const o = w.byId.get(id); if (!o) continue; (s < 0 ? gr : fr).push(`${esc(o.name)}${s < 0 ? '' : ' ' + Math.round(s * 100) + '%'}`); }
  const parts = [];
  if (fam.length) parts.push('Family nearby/alive: ' + fam.slice(0, 6).join(', '));
  if (fr.length) parts.push('Friends: ' + fr.join(', '));
  if (gr.length) parts.push('Grudges: ' + gr.join(', '));
  if (m.mem[2] > 0.05) parts.push('Remembers food (' + Math.round(m.mem[2] * 15) + 's left)');
  if (m.mem[5] > 0.05) parts.push('Remembers who hurt it');
  if (m.pod) { const o = w.byId.get(m.pod); if (o) parts.push('In a pod with ' + esc(o.name)); }
  return parts.length ? `<div class="dim">${parts.join(' · ')}</div>` : '';
}
function topOut(m) { const o = m.o, names = S.OUT_NAMES, arr = []; for (let k = 2; k < S.NO; k++) if (Math.abs(o[k]) > 0.35 && !(k === 11 || k === 12 && false)) arr.push(names[k] + (o[k] < 0 ? '−' : '')); if (o[0] > 0.5) arr.unshift('moving'); return arr.join(', ') || 'quiet'; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
insp.addEventListener('click', e => {
  const a = e.target.dataset && e.target.dataset.a; if (!a) return;
  const m = selected();
  if (a === 'close') { if (follow && m) { inspHidden = true; insp.style.display = 'none'; updChip(); } else { selId = 0; follow = false; insp.style.display = 'none'; } }
  else if (m) {
    if (a === 'follow') { if (!follow) { startFollow(m); return; } follow = false; }
    if (a === 'fav') S.toggleFav(w, m);
    if (a === 'feed') S.feedMote(m);
    if (a === 'clone') { const c = S.cloneMote(w, m); selId = c.id; }
    if (a === 'rename') { const n = prompt('Name', m.name); if (n) { m.name = n.slice(0, 20); const f = w.favs.find(f => f.id === m.id); if (f) f.name = m.name; } }
    renderInsp(true);
  }
});
function drawBrain() {
  const m = selected(); if (!m || insp.style.display === 'none') return;
  const cw = bc.clientWidth, ch = bc.clientHeight;
  if (bc.width !== cw * dpr) { bc.width = cw * dpr; bc.height = ch * dpr; }
  bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, cw, ch);
  const v = S.brainView(m), cols = { in: [], hid: [], out: [] };
  for (const n of v.nodes) cols[n.kind].push(n);
  const pos = new Map();
  const place = (arr, x) => arr.forEach((n, i) => pos.set(n, [x, 10 + (ch - 20) * (arr.length === 1 ? 0.5 : i / (arr.length - 1))]));
  place(cols.in, 60); place(cols.hid, cw / 2); place(cols.out, cw - 60);
  for (const e of v.edges) {
    const a = pos.get(e.a), b = pos.get(e.b); if (!a || !b) continue;
    const act = Math.abs(v.act[e.a.slot]);
    bctx.strokeStyle = e.w > 0 ? `rgba(90,200,140,${0.15 + 0.6 * act})` : `rgba(230,100,100,${0.15 + 0.6 * act})`;
    bctx.lineWidth = Math.min(3, 0.4 + Math.abs(e.w) * 0.5);
    bctx.beginPath(); bctx.moveTo(a[0], a[1]); bctx.lineTo(b[0], b[1]); bctx.stroke();
  }
  bctx.font = '9px system-ui'; bctx.textBaseline = 'middle';
  for (const n of v.nodes) {
    const p = pos.get(n), a = v.act[n.slot], l = Math.round(60 + 40 * Math.abs(a));
    bctx.fillStyle = n.kind === 'in' ? `hsl(210,60%,${l}%)` : n.kind === 'out' ? `hsl(40,80%,${l}%)` : `hsl(280,60%,${l}%)`;
    bctx.beginPath(); bctx.arc(p[0], p[1], 3.5, 0, 7); bctx.fill();
    bctx.fillStyle = '#9fb0c4';
    if (n.kind === 'in') { bctx.textAlign = 'right'; bctx.fillText(n.label, p[0] - 6, p[1]); }
    else if (n.kind === 'out') { bctx.textAlign = 'left'; bctx.fillText(n.label, p[0] + 6, p[1]); }
  }
}

// ---------- menu ----------
const menu = $('menu'), mbody = $('mbody'), tabsEl = $('tabs');
const TABS = [['guide', 'Guide'], ['install', '📲 Install'], ['species', 'Species'], ['tree', '🌳 Tree'], ['diary', 'Diary'], ['stats', 'Stats'], ['stars', 'Stars'], ['dish', 'Dish']];
tabsEl.innerHTML = TABS.map(([id, l]) => `<button data-tab="${id}">${l}</button>`).join('') + '<button data-tab="close" style="margin-left:auto">✕ Close</button>';
tabsEl.onclick = e => { const t = e.target.dataset.tab; if (!t) return; if (t === 'close') { menu.style.display = 'none'; paused = false; $('bPause').textContent = '⏸'; } else { menuTab = t; renderMenu(); } };
function openMenu() { menu.style.display = 'flex'; renderMenu(); }
const dayOf = t => Math.floor(t / DAY) + 1;
const stamp = t => `Year ${Math.floor(t / S.YEAR) + 1}, day ${Math.floor((t % S.YEAR) / DAY) + 1}`;
let diaryFilter = 'all', spot = 0, shake = 0;
function renderMenu() {
  for (const b of tabsEl.children) b.classList.toggle('on', b.dataset.tab === menuTab);
  if (menuTab === 'guide') {
    mbody.onclick = null;
    if (mbody.dataset.tab !== 'guide') { mbody.innerHTML = guideHTML(); mbody.dataset.tab = 'guide'; mbody.scrollTop = 0; }
    return;
  }
  mbody.dataset.tab = '';
  if (menuTab === 'install') {
    mbody.onclick = null;
    mbody.innerHTML = installHTML(device, isStandalone());
    if (deferredInstall && !isStandalone()) {
      const n = $('installNative'); n.innerHTML = '<button id="doInstall" class="on" style="font-size:15px;padding:10px 16px">📲 Install Motes now</button><p class="dim">Your browser can install it with one tap.</p>';
      $('doInstall').onclick = async () => { deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (_) {} deferredInstall = null; renderMenu(); };
    }
    return;
  }
  if (menuTab === 'species') {
    const list = [...w.species.values()].sort((a, b) => (b.count - a.count) || (a.ext - b.ext));
    mbody.innerHTML = `<div class="dim">Tap a species to jump to one of its motes. Species are not designed: they split off when genes and brains drift apart.</div>` + list.slice(0, 80).map(s => `<div class="row" data-sp="${s.id}"><span class="dot" style="background:hsl(${s.hue * 360},75%,${s.ext ? 25 : 60}%)"></span><b>${esc(s.name)}</b> ${s.ext ? '<span class="dim">extinct day ' + dayOf(s.ext) + '</span>' : (s.count ? `<button data-spot="${s.id}" class="${spot === s.id ? 'on' : ''}" style="padding:1px 7px;margin-left:4px">🔦</button>` : '')}<span class="dim"> · alive ${s.count} · peak ${s.peak} · born day ${dayOf(s.born)}${s.par && w.species.get(s.par) ? ' · from ' + esc(w.species.get(s.par).name) : ''}</span></div>`).join('');
    mbody.onclick = e => { const sb = e.target.closest('[data-spot]'); if (sb) { const id = +sb.dataset.spot; spot = spot === id ? 0 : id; menu.style.display = 'none'; if (spot) { const sp = w.species.get(spot); showHint('spot', `Spotlight on ${sp.name}: every one of its motes is circled. Menu → Species → 🔦 again to clear.`); } return; } const r = e.target.closest('[data-sp]'); if (!r) return; const id = +r.dataset.sp; const ms = w.motes.filter(m => m.sp === id); if (ms.length) { menu.style.display = 'none'; startFollow(ms[(Math.random() * ms.length) | 0]); } };
  } else if (menuTab === 'tree') {
    renderTree();
  } else if (menuTab === 'diary') {
    const FILT = [['all', 'Everything'], ['year', 'Years'], ['first', 'Firsts'], ['species', 'Species'], ['event', 'Events'], ['fav', 'Stars']];
    const rows = S.allLog(w).filter(l => diaryFilter === 'all' || l.kind === diaryFilter).reverse().slice(0, 300);
    mbody.innerHTML = `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">${FILT.map(([k, l]) => `<button data-df="${k}" class="${diaryFilter === k ? 'on' : ''}">${l}</button>`).join('')}</div>` +
      (rows.map(l => `<div class="row k-${l.kind}"><span class="dim">${stamp(l.t)}</span> ${esc(l.text)}</div>`).join('') || '<div class="dim">Nothing here yet.</div>');
    mbody.onclick = e => { const k = e.target.dataset && e.target.dataset.df; if (k) { diaryFilter = k; renderMenu(); } };
  } else if (menuTab === 'stats') {
    mbody.onclick = null;
    const c = w.counters, f = w.fame, st = w.stats;
    const fr = (k, label, unit = '') => f[k] ? `<div class="row">${label}: <b>${esc(f[k].name)}</b> ${Math.round(f[k].val)}${unit} <span class="dim">(${esc((w.species.get(f[k].sp) || { name: '?' }).name)})</span></div>` : '';
    mbody.innerHTML = `<canvas id="graph" style="width:100%;height:150px;background:#0a0f16;border-radius:6px"></canvas><div class="dim">white: population · blue: species ×10 · green: avg brain size ×5</div>
    <div class="row">Day ${dayOf(w.t)} · population ${st.pop} · species alive ${st.species} · food ${st.food} · structures ${st.struct}</div>
    <div class="row">Average brain: ${(st.conns || 0).toFixed(1)} connections, ${(st.hid || 0).toFixed(2)} hidden neurons · average diet ${(st.diet || 0).toFixed(2)}</div>
    <div class="row">Births ${c.births} (mated ${c.sexual}, budded ${c.asexual}) · deaths ${c.deaths} · kills ${c.kills} · built ${c.built} · torn down ${c.dug}</div>
    <div class="row">Friendships formed ${c.friends} · grudges ${c.grudges} · energy fed to relatives ${Math.round(c.famGifts)} · devoted-pair children ${c.devoted} · inbred births ${c.inbred}</div>
    <div class="row">Energy shared ${Math.round(c.shared)} · stolen ${Math.round(c.stolen)} · hoarded ${Math.round(c.stored)} · species born ${c.newSpecies} · extinct ${c.extinct} · plagues ${c.plagues}</div>
    <h4>Records</h4>${fr('oldest', 'Oldest', 's')}${fr('kids', 'Most children')}${fr('kills', 'Most kills')}${fr('brain', 'Biggest brain')}${fr('gen', 'Deepest generation')}`;
    drawGraph();
  } else if (menuTab === 'stars') {
    mbody.innerHTML = (w.favs.length ? w.favs.map(f => `<div class="row" data-fid="${f.id}"><span class="dot" style="background:hsl(${f.hue * 360},75%,${f.alive ? 60 : 25}%)"></span><b>${esc(f.name)}</b> <span class="dim">${f.alive ? 'alive' : 'died (' + f.why + ')'} · age ${Math.round(f.age)}s · gen ${f.gen} · kids ${f.kids}</span></div>`).join('') : '<div class="dim">Select a mote and tap ☆ Star to keep an eye on it. Its story is saved here, even after it dies.</div>');
    mbody.onclick = e => { const r = e.target.closest('[data-fid]'); if (!r) return; const m = w.motes.find(m => m.id === +r.dataset.fid); if (m) { menu.style.display = 'none'; startFollow(m); } };
  } else if (menuTab === 'dish') {
    mbody.onclick = null;
    mbody.innerHTML = `<label>Max population <input id="sMax" type="range" min="100" max="1200" step="50" value="${w.maxPop}"><span id="vMax">${w.maxPop}</span></label>
    <label>Food abundance <input id="sFert" type="range" min="0.3" max="3" step="0.1" value="${w.fert}"><span id="vFert">${w.fert}</span></label>
    <label>Random events (blooms, cold, plague, spills, meteors) <input id="cEv" type="checkbox" ${w.events ? 'checked' : ''}></label>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin:8px 0"><button id="eBloom">Call a bloom</button><button id="eCold">Cold snap</button><button id="eHeat">Heatwave</button><button id="eIce">Ice age</button><button id="eDry">Drought</button><button id="ePlague">Plague</button></div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin:8px 0"><button id="bSound">${sndOn ? '🔊 Sound: on' : '🔈 Sound: off'}</button><button id="bPhoto">📷 Save a picture of the dish</button></div>
    <h4>Move this dish between phone and PC</h4>
    <div style="display:flex;gap:4px;flex-wrap:wrap"><button id="xDown">Download dish file</button><button id="xCopy">Copy dish code</button><label style="display:inline"><input id="xFile" type="file" accept=".json,.motes" hidden><button id="xUp" type="button">Load dish file</button></label></div>
    <textarea id="xText" placeholder="Paste a dish code here, then tap Load pasted code"></textarea><button id="xPaste">Load pasted code</button>
    <h4>Start over</h4><div class="dim">Pre-evolved dishes: each was fast-forwarded about 4 dish-years on a computer while the motes evolved. Loading one erases this dish.</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin:6px 0"><button id="nStarter">🏗️ Builders (smartest, spread out)</button><button id="nBuild">🦈 Predators (6 species)</button><button id="nCycle">🐝 The Swarm (predator ball)</button></div><div style="display:flex;gap:4px;flex-wrap:wrap"><button id="nNew">New primordial dish (erases this one)</button></div>
    <p class="dim">Dish saves automatically on this device. While you're away it keeps living at a slow pace, up to about 40 minutes of dish time, and the last few motes are protected so you never come back to an empty dish.</p>`;
    const g = id => $(id);
    g('sMax').oninput = e => { w.maxPop = +e.target.value; g('vMax').textContent = w.maxPop; };
    g('sFert').oninput = e => { w.fert = +e.target.value; g('vFert').textContent = w.fert; };
    g('cEv').onchange = e => { w.events = e.target.checked; };
    g('eBloom').onclick = () => S.triggerEvent(w, 'bloom'); g('eCold').onclick = () => S.triggerEvent(w, 'cold'); g('eHeat').onclick = () => S.triggerEvent(w, 'heat'); g('ePlague').onclick = () => S.startPlague(w, 6); g('eIce').onclick = () => S.triggerEvent(w, 'iceage'); g('eDry').onclick = () => S.triggerEvent(w, 'drought');
    g('bSound').onclick = () => { setSound(!sndOn); g('bSound').textContent = sndOn ? '🔊 Sound: on' : '🔈 Sound: off'; };
    g('bPhoto').onclick = () => { draw(); cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'motes-dish-day' + dayOf(w.t) + '.png'; a.click(); }); };
    g('xDown').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([S.serialize(w)], { type: 'application/json' })); a.download = 'motes-dish-day' + dayOf(w.t) + '.motes'; a.click(); };
    g('xCopy').onclick = async () => { try { await navigator.clipboard.writeText(S.serialize(w)); g('xCopy').textContent = 'Copied'; } catch { g('xText').value = S.serialize(w); g('xText').select(); } };
    g('xUp').onclick = () => g('xFile').click();
    g('xFile').onchange = async e => { const f = e.target.files[0]; if (f) importStr(await f.text()); };
    g('xPaste').onclick = () => importStr(g('xText').value.trim());
    for (const [id, nm] of [['nStarter', 'dish'], ['nBuild', 'predators'], ['nCycle', 'swarm']]) g(id).onclick = async () => { if (confirm('Replace this dish with this pre-evolved one?')) { if (await loadStarter(false, nm)) menu.style.display = 'none'; else alert('Could not load it (are you offline?)'); } };
    g('nNew').onclick =() => { if (confirm('Erase this dish and start a new one?')) { w = S.createWorld((Date.now() & 0x7fffffff) || 9); selId = 0; save(); menu.style.display = 'none'; } };
  }
}
// ---------- family tree of species ----------
function renderTree() {
  mbody.onclick = null;
  const sp = [...w.species.values()].filter(s => s.shown !== false && (s.count > 0 || s.peak >= 8));
  const ids = new Set(sp.map(s => s.id)), kids = new Map();
  for (const s of sp) { let p = s.par; while (p && !ids.has(p)) { const ps = w.species.get(p); p = ps ? ps.par : 0; } s._p = p || 0; if (!kids.has(s._p)) kids.set(s._p, []); kids.get(s._p).push(s); }
  const order = [];
  const walk = s => { order.push(s); for (const c of (kids.get(s.id) || []).sort((a, b) => a.born - b.born)) walk(c); };
  for (const r of (kids.get(0) || []).sort((a, b) => a.born - b.born)) walk(r);
  const rowH = 20, W2 = Math.max(300, mbody.clientWidth - 24), H2 = order.length * rowH + 30;
  mbody.innerHTML = '<div class="dim">Every species and where it came from, oldest at the left. Filled = alive (bigger = more motes), hollow = extinct. Lines join a species to the one it split from. Tap a row to follow one of its motes.</div><canvas id="tree" style="width:100%;height:' + H2 + 'px;background:#0a0f16;border-radius:6px;margin-top:6px"></canvas>';
  const cvT = $('tree'); cvT.width = W2 * dpr; cvT.height = H2 * dpr; const c = cvT.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const t0 = Math.min(0, ...order.map(s => s.born)), t1 = Math.max(w.t, t0 + 1), X = t => 12 + (t - t0) / (t1 - t0) * (W2 - 150), pos = new Map();
  order.forEach((s, i) => pos.set(s.id, [X(s.born), 18 + i * rowH]));
  c.font = '11px sans-serif';
  for (const s of order) { const p = pos.get(s._p); if (!p) continue; const q = pos.get(s.id); c.strokeStyle = '#ffffff40'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], q[1]); c.lineTo(q[0], q[1]); c.stroke(); }
  for (const s of order) {
    const [x, y] = pos.get(s.id), r = 3 + Math.min(9, Math.sqrt(s.count || 1) * 1.1), col = 'hsl(' + (s.hue * 360) + ',75%,60%)';
    const xe = s.count > 0 ? W2 - 140 : X(s.ext || w.t);
    c.strokeStyle = s.count ? col : '#ffffff30'; c.globalAlpha = s.count ? 0.55 : 1; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(xe, y); c.stroke(); c.globalAlpha = 1;
    c.fillStyle = s.count ? col : '#0a0f16'; c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
    c.fillStyle = s.count ? '#fff' : '#889'; c.fillText(s.name + (s.count ? ' · ' + s.count : ''), Math.min(xe + 6, W2 - 138), y + 4);
  }
  cvT.onclick = e => { const b = cvT.getBoundingClientRect(), y = (e.clientY - b.top) / b.height * H2, i = Math.round((y - 18) / rowH), s = order[i]; if (s) { const ms = w.motes.filter(m => m.sp === s.id); if (ms.length) { menu.style.display = 'none'; startFollow(ms[0]); } } };
}

// ---------- sound and haptics (off until you turn it on in Menu → Dish) ----------
let sndOn = localStorage.getItem('motes.snd') === '1', AC = null; const lastSfx = {};
function setSound(on) { sndOn = on; try { localStorage.setItem('motes.snd', on ? '1' : '0'); } catch (_) {} if (on) { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); sfx('spark'); } catch (_) { sndOn = false; } } }
function tone(f0, f1, dur, type, vol) { const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02); }
function sfx(k) {
  if (!sndOn) return; if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return; } }
  const now = performance.now(); if (now - (lastSfx[k] || 0) < (k === 'birth' ? 120 : 60)) return; lastSfx[k] = now;
  try {
    if (k === 'birth') tone(520 + Math.random() * 380, 900 + Math.random() * 300, 0.12, 'sine', 0.04);
    else if (k === 'kill') tone(140, 55, 0.18, 'triangle', 0.09);
    else if (k === 'spark') tone(600, 1500, 0.25, 'sine', 0.07);
    else if (k === 'zap') tone(900, 80, 0.2, 'sawtooth', 0.05);
    else if (k === 'sick') tone(200, 150, 0.5, 'sawtooth', 0.04);
    else if (k === 'boom') { tone(90, 25, 0.9, 'sine', 0.3); tone(300, 40, 0.5, 'sawtooth', 0.08); }
    else if (k === 'species') { tone(440, 660, 0.18, 'sine', 0.06); setTimeout(() => sndOn && tone(660, 880, 0.3, 'sine', 0.06), 150); }
  } catch (_) {}
}
function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} }
let lastC = null;
function soundTick() {
  const c = w.counters; const cur = { b: c.births, k: c.kills, s: c.newSpecies, p: c.plagues };
  if (lastC && sndOn) { if (cur.b > lastC.b) sfx('birth'); if (cur.k > lastC.k) sfx('kill'); if (cur.s > lastC.s) sfx('species'); if (cur.p > lastC.p) sfx('sick'); }
  lastC = cur;
}
function importStr(s) { try { const nw = S.deserialize(s); w = nw; selId = 0; save(); menu.style.display = 'none'; } catch (e) { alert('That does not look like a dish.'); } }
function drawGraph() {
  const g = $('graph'); if (!g) return;
  const cw = g.clientWidth, ch = g.clientHeight; g.width = cw * dpr; g.height = ch * dpr;
  const c = g.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const h = w.hist; if (h.length < 2) return;
  const series = [[1, 1, '#fff'], [2, 10, '#5aa8ff'], [3, 5, '#58c08a']];
  const max = Math.max(50, ...h.map(r => Math.max(r[1], r[2] * 10, r[3] * 5)));
  for (const [i, k, col] of series) { c.strokeStyle = col; c.beginPath(); h.forEach((r, j) => { const x = j / (h.length - 1) * cw, y = ch - 4 - (r[i] * k / max) * (ch - 8); j ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); }
}

// ---------- drawing ----------
const ov = document.createElement('canvas'); ov.width = GN; ov.height = GN; const octx = ov.getContext('2d'); const oimg = octx.createImageData(GN, GN);
let ovT = 0;
function updOverlay() {
  const d = oimg.data;
  // view 0 shows every field at once (scents, heat, cold, toxin); views 1-5 show just one
  const CC = [[255, 70, 70], [70, 255, 110], [90, 140, 255]];
  for (let i = 0; i < GN * GN; i++) {
    let r = 0, g = 0, b = 0, a = 0;
    const add = (c, al) => { if (al < 4) return; const t = a + al; r = (r * a + c[0] * al) / t; g = (g * a + c[1] * al) / t; b = (b * a + c[2] * al) / t; a = Math.min(235, t); };
    for (let k = 0; k < 3; k++) if (view === 0 || view === k + 1) add(CC[k], Math.min(1, w.chem[k][i] * 1.1) * 210);
    if (view === 0 || view === 4) { const h = w.heat[i]; if (h > 0.03) add([255, 130, 30], Math.min(1, h) * 190); else if (h < -0.03) add([80, 170, 255], Math.min(1, -h) * 190); }
    if (view === 0 || view === 5) add([180, 60, 255], Math.min(1, w.tox[i] * 1.3) * 230);
    d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = a;
  }
  octx.putImageData(oimg, 0, 0);
}
const STC = [null, '#7a8696', '#3f9a56', '#d08a3c', '#d6c04a'];
// A mote's body is generated from its shape genes: a spine of segments that curls and wiggles, tapering, with limbs.
const PX = new Float32Array(12), PY = new Float32Array(12), PA = new Float32Array(12), PR = new Float32Array(12);
function drawSquiggle(m, dtv) {
  const hh = m.hue * 360, light = m.diet > 0.6 ? 47 : 58;
  if (cam.z < 0.16) { ctx.fillStyle = `hsl(${hh},70%,${light}%)`; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * (0.8 + m.segs * 0.12), 0, 7); ctx.fill(); return; }
  m.ph += dtv * (1.5 + m.wfreq * 9) * (0.25 + m.v / m.maxSp);
  const n = m.segs, segLen = m.r * 0.8 * m.lenF;
  let x = m.x, y = m.y, a = m.h + Math.PI;
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0;
    PX[i] = x; PY[i] = y; PA[i] = a; PR[i] = m.r * (1 - m.taper * 0.72 * t);
    a += m.curl * 0.32 + Math.sin(m.ph - i * 0.9) * m.wamp * 0.55;
    x += Math.cos(a) * segLen; y += Math.sin(a) * segLen;
  }
  if (m.glow > 0.45) {                      // bioluminescence: soft halo and glowing belly dots
    const ga = (m.glow - 0.4) * (0.5 + 0.25 * Math.sin(m.ph * 0.6 + m.id)); ctx.fillStyle = `hsla(${(m.accent * 360)},95%,65%,${ga})`;
    for (let i = 0; i < n; i += 1) { ctx.beginPath(); ctx.arc(PX[i], PY[i], PR[i] * 1.9, 0, 7); ctx.fill(); }
  }
  if (m.limbs > 0) {
    ctx.strokeStyle = `hsl(${hh},50%,${light - 12}%)`; ctx.lineWidth = Math.max(0.8, m.r * 0.18); ctx.lineCap = 'round'; ctx.beginPath();
    const len = m.r * (0.7 + m.limbLen * 1.5);
    for (let k = 0; k < m.limbs; k++) {
      const i = Math.min(n - 1, 1 + Math.floor(k * (n - 1) / m.limbs));
      for (const side of [-1, 1]) {
        const ang = PA[i] + side * (1.35 + Math.sin(m.ph * 1.3 + i + (side > 0 ? 1 : 0)) * 0.45);
        ctx.moveTo(PX[i], PY[i]); ctx.lineTo(PX[i] + Math.cos(ang) * len, PY[i] + Math.sin(ang) * len);
      }
    }
    ctx.stroke();
  }
  const acc = m.accent * 360;
  if (m.fin > 0.15) {                       // tail fin: a translucent fan behind the last segment
    const t = n - 1, fl = m.r * (0.8 + m.fin * 2.4), sw = Math.sin(m.ph * 1.2) * 0.25;
    ctx.fillStyle = `hsla(${acc},80%,65%,0.55)`; ctx.beginPath(); ctx.moveTo(PX[t], PY[t]);
    ctx.lineTo(PX[t] + Math.cos(PA[t] + 0.7 + sw) * fl, PY[t] + Math.sin(PA[t] + 0.7 + sw) * fl);
    ctx.lineTo(PX[t] + Math.cos(PA[t] + sw) * fl * 1.25, PY[t] + Math.sin(PA[t] + sw) * fl * 1.25);
    ctx.lineTo(PX[t] + Math.cos(PA[t] - 0.7 + sw) * fl, PY[t] + Math.sin(PA[t] - 0.7 + sw) * fl); ctx.closePath(); ctx.fill();
  }
  const st = m.style;
  if (st === 1) {                           // smooth tube: one continuous tapering body
    ctx.fillStyle = `hsl(${hh},70%,${light}%)`; ctx.beginPath();
    for (let i = 0; i < n; i++) { const nx = Math.cos(PA[i] + 1.5708) * PR[i], ny = Math.sin(PA[i] + 1.5708) * PR[i]; i ? ctx.lineTo(PX[i] + nx, PY[i] + ny) : ctx.moveTo(PX[i] + nx, PY[i] + ny); }
    ctx.arc(PX[n - 1], PY[n - 1], PR[n - 1], PA[n - 1] + 1.5708, PA[n - 1] - 1.5708, false);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(PX[i] - Math.cos(PA[i] + 1.5708) * PR[i], PY[i] - Math.sin(PA[i] + 1.5708) * PR[i]);
    ctx.arc(PX[0], PY[0], PR[0], PA[0] - 1.5708, PA[0] + 1.5708, true);
    ctx.closePath(); ctx.fill();
    if (m.pat) for (let i = 0; i < n; i++) {
      if (m.pat === 1) { ctx.fillStyle = `hsl(${acc},85%,72%)`; ctx.beginPath(); ctx.arc(PX[i] + PR[i] * 0.2, PY[i] - PR[i] * 0.2, PR[i] * 0.35, 0, 7); ctx.fill(); }
      else if (m.pat === 2 && (i & 1)) { ctx.strokeStyle = `hsl(${acc},75%,${light - 8}%)`; ctx.lineWidth = Math.max(1, PR[i] * 0.7); ctx.beginPath(); ctx.moveTo(PX[i] - Math.cos(PA[i] + 1.5708) * PR[i], PY[i] - Math.sin(PA[i] + 1.5708) * PR[i]); ctx.lineTo(PX[i] + Math.cos(PA[i] + 1.5708) * PR[i], PY[i] + Math.sin(PA[i] + 1.5708) * PR[i]); ctx.stroke(); }
      else if (m.pat === 3) { ctx.fillStyle = `hsla(${hh + i * 24},80%,60%,0.5)`; ctx.beginPath(); ctx.arc(PX[i], PY[i], PR[i] * 0.8, 0, 7); ctx.fill(); }
    }
    if (m.armor > 0.4) { ctx.strokeStyle = '#cfd8e3'; ctx.lineWidth = 0.6 + m.armor * 1.6; ctx.stroke(); }
  } else {
    for (let i = n - 1; i >= 0; i--) {
      const stripe = m.pat === 2 && (i & 1), band = m.pat === 3, r = PR[i], px = PX[i], py = PY[i], pa = PA[i];
      ctx.fillStyle = stripe ? `hsl(${acc},75%,${light - 8}%)` : `hsl(${band ? hh + i * 24 : hh + i * 5},70%,${light - i * 1.5}%)`;
      ctx.beginPath();
      if (st === 2) {                       // diamonds
        const c = Math.cos(pa), sn = Math.sin(pa);
        ctx.moveTo(px + c * r * 1.5, py + sn * r * 1.5); ctx.lineTo(px - sn * r * 0.95, py + c * r * 0.95); ctx.lineTo(px - c * r * 1.5, py - sn * r * 1.5); ctx.lineTo(px + sn * r * 0.95, py - c * r * 0.95); ctx.closePath();
      } else if (st === 3) {                // stars
        for (let q = 0; q < 12; q++) { const ang = pa + q * 0.5236, rr = q & 1 ? r * 0.55 : r * 1.45; q ? ctx.lineTo(px + Math.cos(ang) * rr, py + Math.sin(ang) * rr) : ctx.moveTo(px + Math.cos(ang) * rr, py + Math.sin(ang) * rr); }
        ctx.closePath();
      } else if (st === 5) {                // leaves
        ctx.ellipse(px, py, r * 1.55, r * 0.8, pa, 0, 7);
      } else ctx.arc(px, py, r, 0, 7);
      ctx.fill();
      if (st === 4) { ctx.strokeStyle = `hsl(${hh},70%,${light + 18}%)`; ctx.lineWidth = Math.max(1, r * 0.35); ctx.beginPath(); ctx.arc(px, py, r * 0.62, 0, 7); ctx.stroke(); ctx.fillStyle = `hsl(${acc},85%,70%)`; ctx.beginPath(); ctx.arc(px, py, r * 0.22, 0, 7); ctx.fill(); }
      if (m.pat === 1) { ctx.fillStyle = `hsl(${acc},85%,72%)`; ctx.beginPath(); ctx.arc(px + r * 0.2, py - r * 0.15, r * 0.38, 0, 7); ctx.fill(); }
      if (m.armor > 0.4) { ctx.strokeStyle = '#cfd8e3'; ctx.lineWidth = 0.6 + m.armor * 1.6; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.stroke(); }
    }
  }
  if (m.spikes > 0) {                       // spikes along both flanks (1: tail only, 2: every other segment, 3: all)
    ctx.fillStyle = `hsl(${acc},70%,78%)`; ctx.beginPath();
    for (let i = m.spikes === 1 ? n - 1 : 1; i < n; i += m.spikes === 2 ? 2 : 1) {
      for (const side of [-1, 1]) { const an = PA[i] + side * 1.5708, bx = PX[i] + Math.cos(an) * PR[i] * 0.8, by = PY[i] + Math.sin(an) * PR[i] * 0.8, L = PR[i] * (0.9 + m.spikes * 0.35), w2 = PR[i] * 0.3;
        ctx.moveTo(bx + Math.cos(PA[i]) * w2, by + Math.sin(PA[i]) * w2); ctx.lineTo(bx + Math.cos(an) * L + Math.cos(PA[i] + Math.PI) * w2 * 0.2, by + Math.sin(an) * L + Math.sin(PA[i] + Math.PI) * w2 * 0.2); ctx.lineTo(bx - Math.cos(PA[i]) * w2, by - Math.sin(PA[i]) * w2); }
    }
    ctx.fill();
  }
  if (m.frill > 0.35) {                     // dorsal frill: a row of translucent fins that ripples
    ctx.fillStyle = `hsla(${acc},85%,70%,0.5)`; ctx.beginPath();
    for (let i = 0; i < n; i++) { const an = PA[i] - 1.5708 + Math.sin(m.ph + i) * 0.25, L = PR[i] * (0.8 + m.frill * 1.8); ctx.moveTo(PX[i] - Math.cos(PA[i]) * PR[i] * 0.7, PY[i] - Math.sin(PA[i]) * PR[i] * 0.7); ctx.lineTo(PX[i] + Math.cos(an) * (PR[i] + L), PY[i] + Math.sin(an) * (PR[i] + L)); ctx.lineTo(PX[i] + Math.cos(PA[i]) * PR[i] * 0.7, PY[i] + Math.sin(PA[i]) * PR[i] * 0.7); }
    ctx.fill();
  }
  if (m.ant > 0) {                          // antennae with little bulbs
    ctx.strokeStyle = `hsl(${hh},60%,75%)`; ctx.lineWidth = Math.max(0.7, m.r * 0.12); ctx.fillStyle = `hsl(${acc},90%,70%)`;
    for (let k = 0; k < m.ant; k++) {
      const spread = m.ant === 1 ? 0 : (k / (m.ant - 1) - 0.5) * 1.1, ang = m.h + spread + Math.sin(m.ph * 0.8 + k) * 0.25, L = m.r * 1.7;
      const ex = m.x + Math.cos(ang) * L, ey = m.y + Math.sin(ang) * L;
      ctx.beginPath(); ctx.moveTo(m.x + Math.cos(m.h) * m.r * 0.6, m.y + Math.sin(m.h) * m.r * 0.6); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex, ey, m.r * 0.18, 0, 7); ctx.fill();
    }
  }
  const ch = Math.cos(m.h), sh = Math.sin(m.h), e = m.r * 0.42, pupil = m.diet > 0.6 ? '#e22' : '#111';
  const eye = (ex, ey, er) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 7); ctx.fill(); ctx.fillStyle = pupil; ctx.beginPath(); ctx.arc(ex + ch * er * 0.35, ey + sh * er * 0.35, er * 0.5, 0, 7); ctx.fill(); };
  const hx = m.x + ch * m.r * 0.4, hy = m.y + sh * m.r * 0.4;
  if (m.eyes === 1) eye(hx, hy, m.r * 0.5);
  else if (m.eyes === 2) { eye(hx - sh * e, hy + ch * e, m.r * 0.25); eye(hx + sh * e, hy - ch * e, m.r * 0.25); }
  else if (m.eyes === 3) { eye(hx - sh * e, hy + ch * e, m.r * 0.22); eye(hx + sh * e, hy - ch * e, m.r * 0.22); eye(hx + ch * e * 0.9, hy + sh * e * 0.9, m.r * 0.2); }
  else if (m.eyes === 4) { ctx.strokeStyle = `hsl(${hh},60%,70%)`; ctx.lineWidth = Math.max(0.8, m.r * 0.1); for (const sd of [-1, 1]) { const ex = hx + ch * m.r * 0.7 - sh * sd * e * 1.5, ey = hy + sh * m.r * 0.7 + ch * sd * e * 1.5; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke(); eye(ex, ey, m.r * 0.22); } }
  else { ctx.fillStyle = pupil; ctx.beginPath(); ctx.arc(hx, hy, m.r * 0.12, 0, 7); ctx.fill(); }
}
let dtv = 0.016;
function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#05080c'; ctx.fillRect(0, 0, W, H);
  if (shake > 0.02) { ctx.translate((Math.random() - 0.5) * 14 * shake, (Math.random() - 0.5) * 14 * shake); shake *= 0.9; }
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  // dish: darker at night
  const lum = Math.round(14 + 14 * w.light);
  ctx.fillStyle = `rgb(${lum},${lum + 4},${lum + 10})`; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
  ctx.strokeStyle = '#2a3a4e'; ctx.lineWidth = 4; ctx.stroke();
  if (performance.now() - ovT > 200) { updOverlay(); ovT = performance.now(); }
  ctx.imageSmoothingEnabled = true; ctx.drawImage(ov, -R, -R, GN * CELL, GN * CELL);
  // structures
  const x0 = Math.max(0, Math.floor((cam.x - W / 2 / cam.z + R) / CELL)), x1 = Math.min(GN - 1, Math.floor((cam.x + W / 2 / cam.z + R) / CELL));
  const y0 = Math.max(0, Math.floor((cam.y - H / 2 / cam.z + R) / CELL)), y1 = Math.min(GN - 1, Math.floor((cam.y + H / 2 / cam.z + R) / CELL));
  for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
    const t = w.st[gy * GN + gx]; if (t === 0 || t === 255) continue;
    ctx.fillStyle = STC[t]; ctx.globalAlpha = t === 1 ? 0.95 : 0.55;
    ctx.fillRect(gx * CELL - R + 0.5, gy * CELL - R + 0.5, CELL - 1, CELL - 1);
    if (t === 4) { ctx.globalAlpha = 1; ctx.fillStyle = '#fff6'; const f = Math.min(1, w.store[gy * GN + gx] / 150); ctx.fillRect(gx * CELL - R + 3, gy * CELL - R + CELL - 3 - f * (CELL - 6), CELL - 6, f * (CELL - 6)); }
  }
  ctx.globalAlpha = 1;
  // food
  ctx.fillStyle = '#7fe08a'; ctx.beginPath();
  for (const f of w.food) if (f.k === 0) { ctx.moveTo(f.x + 2, f.y); ctx.arc(f.x, f.y, 2, 0, 7); }
  ctx.fill();
  ctx.fillStyle = '#d96a6a'; ctx.beginPath();
  for (const f of w.food) if (f.k === 1) { ctx.moveTo(f.x + 2.2, f.y); ctx.arc(f.x, f.y, 2.2, 0, 7); }
  ctx.fill();
  // motes
  for (const m of w.motes) {
    if (spot) ctx.globalAlpha = m.sp === spot ? 1 : 0.28;
    drawSquiggle(m, dtv);
    if (spot && m.sp === spot) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6 / cam.z + 0.5; ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 2.2 + 4 + Math.sin(performance.now() / 250) * 1.5, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (m.pod && m.id < m.pod) { const po = w.byId.get(m.pod); if (po) { ctx.strokeStyle = '#ffe14d70'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(po.x, po.y); ctx.stroke(); } }
    if (m.hurt > 0 && m.why2 === 'toxin') { ctx.strokeStyle = '#c6f'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 3 + Math.sin(performance.now() / 70) * 1.5, 0, 7); ctx.stroke(); }
    for (let k = 0; k < 3; k++) { const e = m.o[S.OUT.EMIT_A + k]; if (e > 0.05) { const ph = ((performance.now() / 700 + m.id * 0.37 + k * 0.33) % 1); ctx.strokeStyle = ['#ff4646', '#46ff6e', '#5a8cff'][k]; ctx.globalAlpha = (1 - ph) * 0.8; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 3 + ph * 22, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; } }
    if (m.sick > 0) { ctx.strokeStyle = '#9f4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 2, 0, 7); ctx.stroke(); }
    if (m.fav) { ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 3, 0, 7); ctx.stroke(); }
    if (m.o[S.OUT.BITE] > 0.3 && m.hurt < 0.1) { ctx.fillStyle = '#ff0'; ctx.fillRect(m.x - 1, m.y - m.r - 4, 2, 2); }
  }
  const sm = selected();
  if (sm) {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 / cam.z + 0.5; ctx.beginPath(); ctx.arc(sm.x, sm.y, sm.r + 5, 0, 7); ctx.stroke();
    ctx.lineWidth = 1.2 / cam.z + 0.4;
    for (const o of w.motes) { if (o !== sm && S.relOf(sm, o) > 0) { ctx.strokeStyle = '#ffd24acc'; ctx.beginPath(); ctx.moveTo(sm.x, sm.y); ctx.lineTo(o.x, o.y); ctx.stroke(); } }
    for (const [id, s] of sm.fr) { const o = w.byId.get(id); if (!o) continue; ctx.strokeStyle = s < 0 ? '#ff4a4acc' : `rgba(90,220,140,${0.3 + 0.6 * s})`; ctx.setLineDash(s < 0 ? [3, 3] : []); ctx.beginPath(); ctx.moveTo(sm.x, sm.y); ctx.lineTo(o.x, o.y); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.strokeStyle = '#ffffff30'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(sm.x, sm.y, sm.senseR, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    if (sm.mem[2] > 0.05) { ctx.strokeStyle = '#7fe08acc'; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(sm.x, sm.y); ctx.lineTo(sm.mem[0], sm.mem[1]); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(sm.mem[0], sm.mem[1], 4, 0, 7); ctx.stroke(); }
    if (sm.mem[5] > 0.05) { ctx.strokeStyle = '#ff6a6acc'; ctx.beginPath(); ctx.arc(sm.mem[3], sm.mem[4], 5, 0, 7); ctx.stroke(); }
    if (sm.pod) { const po = w.byId.get(sm.pod); if (po) { ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 2.2 / cam.z + 0.6; ctx.beginPath(); ctx.moveTo(sm.x, sm.y); ctx.lineTo(po.x, po.y); ctx.stroke(); } }
  }
  if (painting && tool !== 'look') {
    const tc = { toxin: '#c6f', heat: '#fa4', cold: '#8cf', chemA: '#f55', chemB: '#5f7', chemC: '#58f' }[tool];
    if (tc) { ctx.fillStyle = tc; ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.arc(painting.x, painting.y, brush, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.strokeStyle = tc || '#fff8'; ctx.lineWidth = 1.5 / cam.z; ctx.beginPath(); ctx.arc(painting.x, painting.y, brush, 0, 7); ctx.stroke();
  }
  ctx.restore();
}

// ---------- loop ----------
let last = performance.now(), acc = 0, hudT = 0, menuT = 0;
function frame(now) {
  const rdt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!fitted || W !== innerWidth || H !== innerHeight) resize();
  if (catching) catchStep();
  else if (!paused && menu.style.display !== 'flex') {
    acc += rdt * speed;
    const t0 = performance.now(); let n = 0;
    w.thinkMask = speed > 3 ? 3 : 1;
    while (acc >= 0.05 && n < 60 && performance.now() - t0 < 13) { S.step(w, 0.05); acc -= 0.05; n++; }
    if (acc > 0.5) acc = 0;
  }
  if (painting && tool !== 'look' && tool !== 'spark' && !catching) { S.paint(w, tool, painting.x, painting.y, brush, Math.max(0.02, rdt)); if (tool === 'erase' || tool === 'food') S.cleanFood(w); }
  const sm = selected();
  if (follow && sm) { cam.x += (sm.x - cam.x) * 0.15; cam.y += (sm.y - cam.y) * 0.15; }
  if (!catching) soundTick();
  dtv = rdt; draw();
  if (now - hudT > 400) {
    hudT = now;
    const s = w.stats, tod = ((w.t % DAY) / DAY), moon = w.light < 0.5 ? '🌙' : '☀️';
    $('hud').textContent = `${moon} Y${Math.floor(w.t / S.YEAR) + 1} D${Math.floor((w.t % S.YEAR) / DAY) + 1} · 🧫 ${w.motes.length} · 🧬 ${s.species} species · 🍃 ${w.food.length}` + (w.sick > 0 ? ` · 🦠 ${w.sick}` : '');
    if (selId) renderInsp(false);
    if (follow && !selected()) { follow = false; inspHidden = false; renderInsp(true); }
    updChip();
    if (!w.motes.length && !catching && $('over').style.display !== 'flex') { const o = $('over'); o.style.display = 'flex'; o.innerHTML = '<div style="font-size:18px">The dish is empty.</div><div class="dim">Every mote is gone. Seed new life, or start fresh.</div><button id="seed">Seed new life</button><button id="fresh">New dish</button>'; $('seed').onclick = () => { for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28, d = Math.random() * 400; S.spark(w, Math.cos(a) * d, Math.sin(a) * d); } o.style.display = 'none'; }; $('fresh').onclick = () => { w = S.createWorld((Date.now() & 0x7fffffff) || 5); o.style.display = 'none'; }; }
  }
  if (menu.style.display === 'flex' && now - menuT > 1000 && ['species', 'stats'].includes(menuTab) && !document.activeElement.matches('input,textarea')) { menuT = now; renderMenu(); }
  drawBrain();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__motes = { get w() { return w; }, S, cam, catchUp: maybeCatchUp, setTool: t => { tool = t; syncTools(); } };

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
