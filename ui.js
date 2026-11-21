import * as S from './sim.js';
const { R, CELL, GN, DAY } = S;

const $ = id => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');
const SAVE = 'motes.save.v1', SAVED_AT = 'motes.savedAt';
let w, selId = 0, follow = false, tool = 'look', brush = 40, view = 0, speed = 1, paused = false, menuTab = 'species';
const cam = { x: 0, y: 0, z: 0.6 };
let W = 0, H = 0, dpr = 1;
let catching = null;

// ---------- boot ----------
function load() {
  try { const s = localStorage.getItem(SAVE); if (s) return S.deserialize(s); } catch (e) { console.warn('load failed', e); }
  return S.createWorld((Date.now() & 0x7fffffff) || 7);
}
w = load();
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
  catch (e) { console.warn('save failed', e); }
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
  ['plague', '🦠 Plague'], ['smite', '⚡ Smite'], ['spark', '✨ Spark'], ['erase', '🧹 Erase'],
];
const bot = $('bot');
for (const [id, label] of TOOLS) { const b = document.createElement('button'); b.textContent = label; b.dataset.t = id; bot.appendChild(b); }
const bBrush = document.createElement('button'); bBrush.textContent = '◯ M'; bot.appendChild(bBrush);
function syncTools() { for (const b of bot.children) b.classList.toggle('on', b.dataset.t === tool); }
bot.onclick = e => { const t = e.target.dataset && e.target.dataset.t; if (t) { tool = t; syncTools(); } };
bBrush.onclick = () => { brush = brush === 20 ? 40 : brush === 40 ? 80 : 20; bBrush.textContent = '◯ ' + (brush === 20 ? 'S' : brush === 40 ? 'M' : 'L'); };
syncTools();
$('bPause').onclick = () => { paused = !paused; $('bPause').textContent = paused ? '▶' : '⏸'; };
$('bSpeed').onclick = () => { speed = speed === 1 ? 3 : speed === 3 ? 8 : speed === 8 ? 0.4 : 1; $('bSpeed').textContent = speed + '×'; };
const VIEWS = ['View', 'Scent A', 'Scent B', 'Scent C', 'Heat', 'Toxin'];
$('bView').onclick = () => { view = (view + 1) % VIEWS.length; $('bView').textContent = VIEWS[view]; };
$('bMenu').onclick = () => { openMenu(); };
addEventListener('keydown', e => { if (e.code === 'Space') { $('bPause').click(); e.preventDefault(); } });

// ---------- camera / input ----------
const s2w = (sx, sy) => [(sx - W / 2) / cam.z + cam.x, (sy - H / 2) / cam.z + cam.y];
const ptrs = new Map();
let pinch = null, downAt = null, painting = null, panning = null;
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cx: cam.x, cy: cam.y }; painting = null; downAt = null; panning = null; return; }
  downAt = { x: e.clientX, y: e.clientY, moved: false };
  if (e.button === 1 || e.button === 2 || tool === 'look') { panning = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }; return; }
  const [wx, wy] = s2w(e.clientX, e.clientY);
  painting = { x: wx, y: wy };
  if (tool === 'spark') { S.spark(w, wx, wy); painting = null; }
});
cv.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && ptrs.size >= 2) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    cam.z = Math.max(0.15, Math.min(8, pinch.z * d / pinch.d));
    cam.x = pinch.cx - ((a.x + b.x) / 2 - pinch.mx) / cam.z; cam.y = pinch.cy - ((a.y + b.y) / 2 - pinch.my) / cam.z;
    follow = false; return;
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
  selId = best ? best.id : 0; follow = false; renderInsp(true);
}
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
  if (!m) { // died
    if (force || insp.dataset.dead !== String(selId)) { insp.dataset.dead = String(selId); ib.innerHTML = `<h3>That mote has died.</h3><button data-a="close">Close</button>`; bc.style.display = 'none'; }
    insp.style.display = 'block'; return;
  }
  insp.dataset.dead = ''; bc.style.display = 'block'; insp.style.display = 'block';
  const sp = w.species.get(m.sp), b = m.g.b;
  const kinds = [];
  if (m.sick > 0) kinds.push('sick'); if (m.imm > 0) kinds.push('immune');
  ib.innerHTML = `<h3><span class="dot" style="background:hsl(${m.hue * 360},75%,60%)"></span>${esc(m.name)} ${m.fav ? '★' : ''}</h3>
  <div class="dim">${sp ? esc(sp.name) : '?'} · ${dietLabel(m.diet)} · gen ${m.gen} · age ${Math.round(m.age)}/${Math.round(m.life)}s · kids ${m.kids} · kills ${m.kills} ${kinds.join(' ')}</div>
  ${m.anc.length ? `<div class="dim">Parents: ${m.anc.map(esc).join(' ← ')}</div>` : ''}
  <div class="bars">${bar('energy', m.e, m.cap)}${bar('size', b[S.B.SIZE])}${bar('speed', b[S.B.SPEED])}${bar('senses', b[S.B.SENSE])}${bar('diet', b[S.B.DIET])}${bar('armor', b[S.B.ARMOR])}${bar('sunlight', b[S.B.PHOTO])}</div>
  <div class="dim">Brain: ${m.net.nc} connections, ${m.net.nh} hidden neurons. Output now: ${topOut(m)}</div>
  <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap"><button data-a="follow" class="${follow ? 'on' : ''}">Follow</button><button data-a="fav">${m.fav ? '★ Unstar' : '☆ Star'}</button><button data-a="feed">Feed</button><button data-a="clone">Clone</button><button data-a="rename">Rename</button><button data-a="close">Close</button></div>`;
}
function topOut(m) { const o = m.o, names = S.OUT_NAMES, arr = []; for (let k = 2; k < S.NO; k++) if (Math.abs(o[k]) > 0.35 && !(k === 11 || k === 12 && false)) arr.push(names[k] + (o[k] < 0 ? '−' : '')); if (o[0] > 0.5) arr.unshift('moving'); return arr.join(', ') || 'quiet'; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
insp.addEventListener('click', e => {
  const a = e.target.dataset && e.target.dataset.a; if (!a) return;
  const m = selected();
  if (a === 'close') { selId = 0; follow = false; insp.style.display = 'none'; }
  else if (m) {
    if (a === 'follow') follow = !follow;
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
const TABS = [['species', 'Species'], ['diary', 'Diary'], ['stats', 'Stats'], ['stars', 'Stars'], ['dish', 'Dish']];
tabsEl.innerHTML = TABS.map(([id, l]) => `<button data-tab="${id}">${l}</button>`).join('') + '<button data-tab="close" style="margin-left:auto">✕ Close</button>';
tabsEl.onclick = e => { const t = e.target.dataset.tab; if (!t) return; if (t === 'close') { menu.style.display = 'none'; paused = false; $('bPause').textContent = '⏸'; } else { menuTab = t; renderMenu(); } };
function openMenu() { menu.style.display = 'flex'; renderMenu(); }
const dayOf = t => Math.floor(t / DAY) + 1;
function renderMenu() {
  for (const b of tabsEl.children) b.classList.toggle('on', b.dataset.tab === menuTab);
  if (menuTab === 'species') {
    const list = [...w.species.values()].sort((a, b) => (b.count - a.count) || (a.ext - b.ext));
    mbody.innerHTML = `<div class="dim">Tap a species to jump to one of its motes. Species are not designed: they split off when genes and brains drift apart.</div>` + list.slice(0, 80).map(s => `<div class="row" data-sp="${s.id}"><span class="dot" style="background:hsl(${s.hue * 360},75%,${s.ext ? 25 : 60}%)"></span><b>${esc(s.name)}</b> ${s.ext ? '<span class="dim">extinct day ' + dayOf(s.ext) + '</span>' : ''}<span class="dim"> · alive ${s.count} · peak ${s.peak} · born day ${dayOf(s.born)}${s.par && w.species.get(s.par) ? ' · from ' + esc(w.species.get(s.par).name) : ''}</span></div>`).join('');
    mbody.onclick = e => { const r = e.target.closest('[data-sp]'); if (!r) return; const id = +r.dataset.sp; const ms = w.motes.filter(m => m.sp === id); if (ms.length) { const m = ms[(Math.random() * ms.length) | 0]; selId = m.id; follow = true; cam.z = Math.max(cam.z, 2.2); menu.style.display = 'none'; renderInsp(true); } };
  } else if (menuTab === 'diary') {
    mbody.onclick = null;
    mbody.innerHTML = [...w.log].reverse().map(l => `<div class="row k-${l.kind}"><span class="dim">day ${dayOf(l.t)}</span> ${esc(l.text)}</div>`).join('') || '<div class="dim">Nothing yet.</div>';
  } else if (menuTab === 'stats') {
    mbody.onclick = null;
    const c = w.counters, f = w.fame, st = w.stats;
    const fr = (k, label, unit = '') => f[k] ? `<div class="row">${label}: <b>${esc(f[k].name)}</b> ${Math.round(f[k].val)}${unit} <span class="dim">(${esc((w.species.get(f[k].sp) || { name: '?' }).name)})</span></div>` : '';
    mbody.innerHTML = `<canvas id="graph" style="width:100%;height:150px;background:#0a0f16;border-radius:6px"></canvas><div class="dim">white: population · blue: species ×10 · green: avg brain size ×5</div>
    <div class="row">Day ${dayOf(w.t)} · population ${st.pop} · species alive ${st.species} · food ${st.food} · structures ${st.struct}</div>
    <div class="row">Average brain: ${(st.conns || 0).toFixed(1)} connections, ${(st.hid || 0).toFixed(2)} hidden neurons · average diet ${(st.diet || 0).toFixed(2)}</div>
    <div class="row">Births ${c.births} (mated ${c.sexual}, budded ${c.asexual}) · deaths ${c.deaths} · kills ${c.kills} · built ${c.built} · torn down ${c.dug}</div>
    <div class="row">Energy shared ${Math.round(c.shared)} · stolen ${Math.round(c.stolen)} · hoarded ${Math.round(c.stored)} · species born ${c.newSpecies} · extinct ${c.extinct} · plagues ${c.plagues}</div>
    <h4>Records</h4>${fr('oldest', 'Oldest', 's')}${fr('kids', 'Most children')}${fr('kills', 'Most kills')}${fr('brain', 'Biggest brain')}${fr('gen', 'Deepest generation')}`;
    drawGraph();
  } else if (menuTab === 'stars') {
    mbody.innerHTML = (w.favs.length ? w.favs.map(f => `<div class="row" data-fid="${f.id}"><span class="dot" style="background:hsl(${f.hue * 360},75%,${f.alive ? 60 : 25}%)"></span><b>${esc(f.name)}</b> <span class="dim">${f.alive ? 'alive' : 'died (' + f.why + ')'} · age ${Math.round(f.age)}s · gen ${f.gen} · kids ${f.kids}</span></div>`).join('') : '<div class="dim">Select a mote and tap ☆ Star to keep an eye on it. Its story is saved here, even after it dies.</div>');
    mbody.onclick = e => { const r = e.target.closest('[data-fid]'); if (!r) return; const m = w.motes.find(m => m.id === +r.dataset.fid); if (m) { selId = m.id; follow = true; menu.style.display = 'none'; renderInsp(true); } };
  } else if (menuTab === 'dish') {
    mbody.onclick = null;
    mbody.innerHTML = `<label>Max population <input id="sMax" type="range" min="100" max="1200" step="50" value="${w.maxPop}"><span id="vMax">${w.maxPop}</span></label>
    <label>Food abundance <input id="sFert" type="range" min="0.3" max="3" step="0.1" value="${w.fert}"><span id="vFert">${w.fert}</span></label>
    <label>Random events (blooms, cold, plague, spills) <input id="cEv" type="checkbox" ${w.events ? 'checked' : ''}></label>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin:8px 0"><button id="eBloom">Call a bloom</button><button id="eCold">Cold snap</button><button id="eHeat">Heatwave</button><button id="ePlague">Plague</button></div>
    <h4>Move this dish between phone and PC</h4>
    <div style="display:flex;gap:4px;flex-wrap:wrap"><button id="xDown">Download dish file</button><button id="xCopy">Copy dish code</button><label style="display:inline"><input id="xFile" type="file" accept=".json,.motes" hidden><button id="xUp" type="button">Load dish file</button></label></div>
    <textarea id="xText" placeholder="Paste a dish code here, then tap Load pasted code"></textarea><button id="xPaste">Load pasted code</button>
    <h4>Danger</h4><button id="nNew">New dish (erases this one)</button>
    <p class="dim">Dish saves automatically on this device. While you're away it keeps living at a slow pace, up to about 40 minutes of dish time, and the last few motes are protected so you never come back to an empty dish.</p>`;
    const g = id => $(id);
    g('sMax').oninput = e => { w.maxPop = +e.target.value; g('vMax').textContent = w.maxPop; };
    g('sFert').oninput = e => { w.fert = +e.target.value; g('vFert').textContent = w.fert; };
    g('cEv').onchange = e => { w.events = e.target.checked; };
    g('eBloom').onclick = () => S.triggerEvent(w, 'bloom'); g('eCold').onclick = () => S.triggerEvent(w, 'cold'); g('eHeat').onclick = () => S.triggerEvent(w, 'heat'); g('ePlague').onclick = () => S.startPlague(w, 6);
    g('xDown').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([S.serialize(w)], { type: 'application/json' })); a.download = 'motes-dish-day' + dayOf(w.t) + '.motes'; a.click(); };
    g('xCopy').onclick = async () => { try { await navigator.clipboard.writeText(S.serialize(w)); g('xCopy').textContent = 'Copied'; } catch { g('xText').value = S.serialize(w); g('xText').select(); } };
    g('xUp').onclick = () => g('xFile').click();
    g('xFile').onchange = async e => { const f = e.target.files[0]; if (f) importStr(await f.text()); };
    g('xPaste').onclick = () => importStr(g('xText').value.trim());
    g('nNew').onclick = () => { if (confirm('Erase this dish and start a new one?')) { w = S.createWorld((Date.now() & 0x7fffffff) || 9); selId = 0; save(); menu.style.display = 'none'; } };
  }
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
  for (let i = 0; i < GN * GN; i++) {
    let r = 0, g = 0, b = 0, a = 0;
    if (view >= 1 && view <= 3) { const v = Math.min(1, w.chem[view - 1][i] * 0.8); [r, g, b] = [[255, 70, 70], [70, 255, 110], [90, 140, 255]][view - 1]; a = v * 200; }
    else if (view === 4) { const h = w.heat[i]; if (h > 0.02) { r = 255; g = 130; b = 30; a = Math.min(1, h) * 170; } else if (h < -0.02) { r = 80; g = 170; b = 255; a = Math.min(1, -h) * 170; } }
    else if (view === 5) { r = 170; g = 60; b = 255; a = Math.min(1, w.tox[i]) * 200; }
    d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = a;
  }
  octx.putImageData(oimg, 0, 0);
}
const STC = [null, '#7a8696', '#3f9a56', '#d08a3c', '#d6c04a'];
function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#05080c'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  // dish: darker at night
  const lum = Math.round(14 + 14 * w.light);
  ctx.fillStyle = `rgb(${lum},${lum + 4},${lum + 10})`; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
  ctx.strokeStyle = '#2a3a4e'; ctx.lineWidth = 4; ctx.stroke();
  if (view) { if (performance.now() - ovT > 250) { updOverlay(); ovT = performance.now(); } ctx.imageSmoothingEnabled = true; ctx.drawImage(ov, -R, -R, GN * CELL, GN * CELL); }
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
    const hh = m.hue * 360;
    ctx.fillStyle = `hsl(${hh},70%,${m.diet > 0.6 ? 48 : 58}%)`;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill();
    if (m.armor > 0.4) { ctx.strokeStyle = '#cfd8e3'; ctx.lineWidth = 1 + m.armor * 2; ctx.stroke(); }
    ctx.strokeStyle = '#000a'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + Math.cos(m.h) * m.r * 1.1, m.y + Math.sin(m.h) * m.r * 1.1); ctx.stroke();
    if (m.diet > 0.6) { ctx.fillStyle = '#ff5050'; ctx.beginPath(); ctx.arc(m.x + Math.cos(m.h) * m.r * 0.5, m.y + Math.sin(m.h) * m.r * 0.5, m.r * 0.22, 0, 7); ctx.fill(); }
    if (m.sick > 0) { ctx.strokeStyle = '#9f4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 2, 0, 7); ctx.stroke(); }
    if (m.fav) { ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(m.x, m.y, m.r + 3, 0, 7); ctx.stroke(); }
    if (m.o[S.OUT.BITE] > 0.3 && m.hurt < 0.1) { ctx.fillStyle = '#ff0'; ctx.fillRect(m.x - 1, m.y - m.r - 4, 2, 2); }
  }
  const sm = selected();
  if (sm) {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 / cam.z + 0.5; ctx.beginPath(); ctx.arc(sm.x, sm.y, sm.r + 5, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#ffffff30'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(sm.x, sm.y, sm.senseR, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  }
  if (painting && tool !== 'look') { ctx.strokeStyle = '#fff8'; ctx.lineWidth = 1.5 / cam.z; ctx.beginPath(); ctx.arc(painting.x, painting.y, brush, 0, 7); ctx.stroke(); }
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
  draw();
  if (now - hudT > 400) {
    hudT = now;
    const s = w.stats, tod = ((w.t % DAY) / DAY), moon = w.light < 0.5 ? '🌙' : '☀️';
    $('hud').textContent = `${moon} Day ${dayOf(w.t)} · 🧫 ${w.motes.length} · 🧬 ${s.species} species · 🍃 ${w.food.length}` + (w.sick > 0 ? ` · 🦠 ${w.sick}` : '');
    if (selId) renderInsp(false);
    if (!w.motes.length && !catching && $('over').style.display !== 'flex') { const o = $('over'); o.style.display = 'flex'; o.innerHTML = '<div style="font-size:18px">The dish is empty.</div><div class="dim">Every mote is gone. Seed new life, or start fresh.</div><button id="seed">Seed new life</button><button id="fresh">New dish</button>'; $('seed').onclick = () => { for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28, d = Math.random() * 400; S.spark(w, Math.cos(a) * d, Math.sin(a) * d); } o.style.display = 'none'; }; $('fresh').onclick = () => { w = S.createWorld((Date.now() & 0x7fffffff) || 5); o.style.display = 'none'; }; }
  }
  if (menu.style.display === 'flex' && now - menuT > 1000 && ['species', 'stats'].includes(menuTab) && !document.activeElement.matches('input,textarea')) { menuT = now; renderMenu(); }
  drawBrain();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__motes = { get w() { return w; }, S, cam, catchUp: maybeCatchUp, setTool: t => { tool = t; syncTools(); } };

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
