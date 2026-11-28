// the god rule: a starred creature survives every way of dying, nobody can feed on it, and unstarring makes it mortal again
import * as S from '../sim.js';
let fails = 0; const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + x); if (!c) fails++; };
const make = (seed = 5) => { const w = S.createWorld(seed); w.noLog = true; for (let i = 0; i < 300; i++) S.step(w, 0.2); const picks = w.motes.slice(0, 4); for (const m of picks) S.toggleFav(w, m); return { w, picks }; };
const alive = (w, picks) => picks.filter(m => !m.dead && w.motes.includes(m)).length;
const run = (w, secs, each) => { for (let t = 0; t < secs / 0.2; t++) { if (each) each(); S.step(w, 0.2); } };
{ const { w, picks } = make(); w.fert = 0; w.events = false; run(w, 600, () => { w.food.length = 0; for (const m of picks) m.e = Math.min(m.e, 1); }); ok('starvation', alive(w, picks) === 4, alive(w, picks) + '/4'); }
{ const { w, picks } = make(); for (const m of picks) m.age = m.life * 5; run(w, 120); ok('old age', alive(w, picks) === 4, alive(w, picks) + '/4'); }
{ const { w, picks } = make(); for (let k = 0; k < 5; k++) for (const m of picks) S.meteor(w, m.x, m.y, 135); ok('meteor', alive(w, picks) === 4, alive(w, picks) + '/4'); }
{ const { w, picks } = make(); for (const m of picks) S.paint(w, 'smite', m.x, m.y, 60, 0.05); ok('smite', alive(w, picks) === 4, alive(w, picks) + '/4'); }
{ const { w, picks } = make(); run(w, 180, () => { for (const m of picks) { S.paint(w, 'toxin', m.x, m.y, 40, 0.05); S.paint(w, 'plague', m.x, m.y, 20, 0.05); } }); ok('poison and plague', alive(w, picks) === 4, alive(w, picks) + '/4'); }
{ const { w, picks } = make(); run(w, 200, () => { for (const m of picks) S.paint(w, 'heat', m.x, m.y, 60, 0.2); }); S.triggerEvent(w, 'iceage'); run(w, 200); ok('heat and ice age', alive(w, picks) === 4, alive(w, picks) + '/4'); }
{ const { w, picks } = make(11); run(w, 3600); ok('an hour of ordinary life and predators', alive(w, picks) === 4, alive(w, picks) + '/4, pop ' + w.motes.length);
  const w2 = S.deserialize(S.serialize(w)); ok('still starred after save and load', w2.motes.filter(m => m.fav).length === 4);
  for (const m of picks) S.toggleFav(w, m); for (const m of picks) m.age = m.life * 2; run(w, 5); ok('unstarred creatures are mortal again', alive(w, picks) === 0, alive(w, picks) + ' still alive'); }
console.log(fails ? fails + ' FAILED' : 'ALL PASS');
