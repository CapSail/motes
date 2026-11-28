// The immortals' journals: a detailed life story for every starred creature. Pure data, no drawing.
// The engine calls these as things happen; the app only reads w.journals.
const DAY = 200, YEAR = 365 * DAY, CAP = 700;
export const JKINDS = [['all', 'Everything'], ['day', 'Daily'], ['family', 'Family'], ['friend', 'Friends'], ['fight', 'Fights'], ['cheat', 'Cheated death'], ['deed', 'Deeds'], ['world', 'World']];

const book = (w, m) => (w.journals && m.fav ? w.journals[m.id] : null);
const emptyDay = () => ({ plants: 0, meat: 0, dist: 0, kids: 0, fights: 0, cheats: 0, kills: 0, gifts: 0, stolen: 0, low: 1, high: 0, acts: {} });

function push(j, t, kind, text) {
  j.entries.push([Math.round(t), kind, text]);
  if (j.entries.length > CAP) {                       // very long lives: small talk fades first; milestones, daily reviews and cheated deaths are kept longest
    const small = e => e[1] === 'deed' || e[1] === 'friend' || e[1] === 'fight' || e[1] === 'world';
    let i = j.entries.findIndex(small); if (i < 0 || i > CAP - 120) i = j.entries.findIndex(e => e[1] === 'family'); if (i < 0) i = j.entries.findIndex(e => e[1] === 'day'); j.entries.splice(i < 0 ? 0 : i, 1);
  }
}
// add a line; with a key, the same kind of line is not repeated within 'cool' seconds
export function jAdd(w, m, kind, text, key, cool) {
  const j = book(w, m); if (!j) return false;
  if (key) { const last = j.cd[key]; if (last !== undefined && w.t - last < (cool === undefined ? 60 : cool)) return false; j.cd[key] = w.t; }
  push(j, w.t, kind, text); return true;
}
export function jOpen(w, m, portrait) {
  if (!w.journals) w.journals = {};
  let j = w.journals[m.id];
  if (!j) {
    j = w.journals[m.id] = { id: m.id, name: m.name, hue: m.hue, since: w.t, mortal: false, portrait, entries: [], cd: {}, kids: [], grand: 0,
      stats: { plants: 0, meat: 0, kills: 0, children: 0, attacked: 0, gifts: 0, given: 0, stolen: 0, sick: 0, stung: 0, dist: 0, friends: 0, lost: 0, built: {}, cheats: {} },
      seen: { fr: [], foe: [], pod: 0, sp: m.sp, x: m.x, y: m.y, day: Math.floor(w.t / DAY), keepT: w.t, bornDays: Math.floor(m.age / DAY), alone: false }, day: emptyDay() };
    push(j, w.t, 'life', `★ ${m.name} was made immortal.`);
    for (const line of portrait) push(j, w.t, 'life', line);
    if (m.kids) push(j, w.t, 'family', `Already had ${m.kids} ${m.kids === 1 ? 'child' : 'children'} before the star.`);
    if (m.kills) push(j, w.t, 'fight', `Had already taken ${m.kills} ${m.kills === 1 ? 'life' : 'lives'} before the star.`);
  } else { j.mortal = false; j.portrait = portrait; j.seen.x = m.x; j.seen.y = m.y; push(j, w.t, 'life', `★ Immortal once more.`); }
  return j;
}
export function jClose(w, m) {
  const j = w.journals && w.journals[m.id]; if (!j) return;
  j.mortal = true; push(j, w.t, 'life', `The star was removed. ${m.name} is mortal again, aged ${Math.round(m.age)}s.`);
}
export function jStat(w, m, k, n = 1) {
  const j = book(w, m); if (!j) return 0;
  j.stats[k] = (j.stats[k] || 0) + n; if (j.day[k] !== undefined) j.day[k] += n; return j.stats[k];
}
const MEALS = [1, 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
export function jEat(w, m, isMeat) {
  const j = book(w, m); if (!j) return;
  const k = isMeat ? 'meat' : 'plants', n = jStat(w, m, k);
  if (MEALS.includes(n)) push(j, w.t, 'deed', n === 1 ? `First ${isMeat ? 'scrap of meat' : 'plant'} eaten as an immortal.` : `Has now eaten ${n} ${isMeat ? 'scraps of meat' : 'plants'} as an immortal.`);
}
const CHEAT = {
  starved: 'ran completely out of energy and should have starved', 'old age': 'passed its natural lifespan and should have died of old age', plague: 'should have been killed by the plague', toxin: 'should have died of poison',
  heat: 'should have died of the heat', cold: 'should have frozen to death', sting: 'should have died of a venomous sting', smitten: 'was struck by your Smite', meteor: 'was caught under your meteor (or one from the sky)',
};
export function jCheat(w, m, why) {
  const j = book(w, m); if (!j) return;
  const key = 'cheat:' + why, cool = why === 'old age' ? 1e12 : 90, last = j.cd[key];
  if (last !== undefined && w.t - last < cool) return;
  j.cd[key] = w.t; j.stats.cheats[why] = (j.stats.cheats[why] || 0) + 1; j.day.cheats++;
  push(j, w.t, 'cheat', `Cheated death: ${CHEAT[why] || 'should have died (' + why + ')'}. It lived.`);
}
const HOW = { starved: 'starved', 'old age': 'died of old age', eaten: 'was eaten', plague: 'died of the plague', toxin: 'died of poison', heat: 'died of the heat', cold: 'froze', sting: 'died of a sting', smitten: 'was struck down by your Smite', meteor: 'was killed by a meteor' };
// somebody else died: did an immortal lose anyone who mattered?
export function jDeath(w, dead, why, killerName, relOf) {
  if (!w.journals) return;
  for (const m of w.motes) {
    if (!m.fav || m === dead || m.dead) continue; const j = w.journals[m.id]; if (!j) continue;
    const rel = relOf(m, dead), f = m.fr.get(dead.id) || 0, child = j.kids.includes(dead.id);
    const how = (HOW[why] || why) + (why === 'eaten' && killerName ? ' by ' + killerName : '');
    if (child || rel === 1) { j.stats.lost++; push(j, w.t, 'family', `Lost ${child ? 'a child' : 'close family'}: ${dead.name} ${how}, aged ${Math.round(dead.age)}s.`); }
    else if (f > 0.35) { j.stats.lost++; push(j, w.t, 'friend', `Lost a friend: ${dead.name} ${how}.`); }
    else if (rel > 0) push(j, w.t, 'family', `A relative, ${dead.name}, ${how}.`);
    else if (f < -0.35) push(j, w.t, 'friend', `An enemy is gone: ${dead.name} ${how}.`);
  }
}
export function jBirth(w, pa, pb, c) {
  if (!w.journals) return;
  for (const [m, other] of [[pa, pb], [pb, pa]]) {
    const j = m && book(w, m); if (!j) continue;
    j.kids.push(c.id); if (j.kids.length > 400) j.kids.shift();
    const n = jStat(w, m, 'children'); j.day.kids++;
    push(j, w.t, 'family', `${other ? `Had a child with ${other.name}` : 'Budded a child on its own'}: ${c.name} (child number ${n} as an immortal, generation ${c.gen}).`);
  }
  // grandchildren: the new baby's parent is the child of an immortal
  for (const id in w.journals) {
    const j = w.journals[id]; if (j.mortal) continue;
    const via = j.kids.includes(pa.id) ? pa : pb && j.kids.includes(pb.id) ? pb : null;
    if (via) { j.grand++; if (j.grand <= 10 || j.grand % 25 === 0) push(j, w.t, 'family', `A grandchild: ${c.name}, born to ${via.name} (grandchild number ${j.grand}).`); }
  }
}
const names = (w, ids) => ids.map(id => w.byId.get(id)).filter(Boolean);
function activity(w, m) {
  if (m.sick > 0) return 'being sick';
  if (w.t - m.actT < 5 && m.actK >= 2) return 'fighting';
  if (w.t - m.actT < 5 && m.actK === 1) return 'feeding';
  if (m.o[12] > 0 && m.e >= m.thr) return 'courting';
  if (m.pod) return 'keeping company with its pod';
  if (m.v < 4) return 'resting';
  return 'roaming';
}
// every few seconds: notice what has changed in each immortal's life, and close off each day
export function jTick(w) {
  if (!w.journals) return;
  for (const m of w.motes) {
    if (!m.fav || m.dead) continue;
    let j = w.journals[m.id];
    if (!j) j = jOpen(w, m, ['Its journal starts here: it was starred before journals existed.']);
    j.name = m.name; j.hue = m.hue;
    const s = j.seen, sp = w.species.get(m.sp);
    const d = Math.hypot(m.x - s.x, m.y - s.y); s.x = m.x; s.y = m.y; if (d < 600) { j.stats.dist += d; j.day.dist += d; }
    const ef = m.e / m.cap; j.day.low = Math.min(j.day.low, ef); j.day.high = Math.max(j.day.high, ef);
    const a = activity(w, m); j.day.acts[a] = (j.day.acts[a] || 0) + 1;
    if (ef < 0.15) jAdd(w, m, 'deed', 'Is desperately hungry and searching for food.', 'hungry', 240);
    if (m.why2 === 'cold' || m.why2 === 'heat') jAdd(w, m, 'world', `Is struggling in the ${m.why2}.`, 'weather', 300);
    // friends and enemies
    const fr = [], foe = [];
    for (const [id, v] of m.fr) { if (v > 0.45) fr.push(id); else if (v < -0.35) foe.push(id); }
    for (const o of names(w, fr.filter(id => !s.fr.includes(id)))) { j.stats.friends++; jAdd(w, m, 'friend', `Became friends with ${o.name}.`, 'newfriend', 100); }
    for (const o of names(w, s.fr.filter(id => !m.fr.has(id)))) jAdd(w, m, 'friend', `Drifted apart from ${o.name}.`, 'drift', 500);
    for (const o of names(w, foe.filter(id => !s.foe.includes(id)))) jAdd(w, m, 'friend', `Now holds a grudge against ${o.name}.`, 'foe', 300);
    s.fr = fr; s.foe = foe;
    if (m.pod && m.pod !== s.pod) { const o = w.byId.get(m.pod); if (o) jAdd(w, m, 'friend', `Formed a pod with ${o.name}: they stick together and share food.`, 'pod' + o.id, 300); }
    s.pod = m.pod || s.pod;
    if (m.sp !== s.sp) { s.sp = m.sp; if (sp) jAdd(w, m, 'life', `Is now counted as a new kind: ${sp.name}.`); }
    if (sp && sp.count === 1 && !s.alone) { s.alone = true; jAdd(w, m, 'life', `Is the very last of its kind (${sp.name}).`, 'last', 2000); } else if (sp && sp.count > 2) s.alone = false;
    const lived = Math.floor(m.age / DAY);
    if (lived > s.bornDays) { s.bornDays = lived; if (lived <= 5 || lived % 5 === 0) jAdd(w, m, 'life', `Has now lived ${lived} ${lived === 1 ? 'day' : 'days'}.`); }
    // big things happening in the dish
    for (const list of [w.log, w.keep]) for (let i = list.length - 1; i >= 0 && list[i].t > s.keepT; i--) if (list[i].kind === 'event') jAdd(w, m, 'world', 'Lived through it: ' + list[i].text, 'ev' + list[i].text, 60);
    s.keepT = w.t;
    // the day in review
    const today = Math.floor(w.t / DAY);
    if (today !== s.day) {
      const y = j.day, top = Object.entries(y.acts).sort((p, q) => q[1] - p[1]).slice(0, 2).map(e => e[0]);
      const bits = [`ate ${y.plants} plant${y.plants === 1 ? '' : 's'}${y.meat ? ` and ${y.meat} meat` : ''}`, `travelled ${Math.round(y.dist / (m.r * 2))} body-lengths`, `energy ${Math.round(Math.max(0, y.low) * 100)}% to ${Math.round(y.high * 100)}%`];
      if (y.kids) bits.push(`${y.kids} new ${y.kids === 1 ? 'child' : 'children'}`);
      if (y.kills) bits.push(`caught ${y.kills}`);
      if (y.gifts) bits.push(`fed others ${y.gifts} time${y.gifts === 1 ? '' : 's'}`);
      if (y.stolen) bits.push('stole some energy');
      if (y.fights) bits.push(`was attacked ${y.fights} time${y.fights === 1 ? '' : 's'}`);
      if (y.cheats) bits.push(`cheated death ${y.cheats} time${y.cheats === 1 ? '' : 's'}`);
      const crew = names(w, fr).map(o => o.name.split(' ')[0]);
      push(j, w.t, 'day', `Day in review: mostly ${top.join(' and ') || 'roaming'}; ${bits.join('; ')}.${crew.length ? ' Friends: ' + crew.join(', ') + '.' : ' No close friends right now.'}`);
      s.day = today; j.day = emptyDay();
    }
  }
}
export const jStamp = t => `Year ${Math.floor(t / YEAR) + 1}, day ${Math.floor((t % YEAR) / DAY) + 1}`;
// the whole journal as plain text, to copy or save
export function jText(j) {
  const s = j.stats, ch = Object.entries(s.cheats).map(([k, v]) => `${k} x${v}`).join(', ') || 'none yet';
  const out = [`THE JOURNAL OF ${j.name.toUpperCase()}`, `Immortal since ${jStamp(j.since)}${j.mortal ? ' (now mortal)' : ''}`, `Ate ${s.plants} plants, ${s.meat} meat. Children ${s.children}, grandchildren ${j.grand}. Caught ${s.kills}. Attacked ${s.attacked}. Cheated death: ${ch}.`, ''];
  let day = '';
  for (const [t, , text] of j.entries) { const d = jStamp(t); if (d !== day) { day = d; out.push('', d); } out.push('  - ' + text); }
  return out.join('\n');
}
