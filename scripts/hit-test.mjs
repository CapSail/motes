// what happens to the creatures actually under a local power? share of them still alive 20 s and 60 s later (control = untouched twin dish)
import * as S from '../sim.js';
const power = process.argv[2], seeds = process.argv.slice(3).map(Number);
const R = { power, hit: 0, alive20: 0, alive60: 0, ctl20: 0, ctl60: 0, sickPeak: 0, k: 0 };
for (const seed of seeds) for (const treat of [false, true]) {
  const w = S.createWorld(seed); w.noLog = true; w.events = false; w.maxPop = 450;
  for (let i = 0; i < 3000; i++) S.step(w, 0.2);
  let best = null, bn = -1; for (const a of w.motes) { const n = w.motes.filter(b => Math.hypot(a.x - b.x, a.y - b.y) < 60).length; if (n > bn) { bn = n; best = a; } }
  const x = best.x, y = best.y, rad = power === 'meteor' ? 135 : 60, ids = new Set(w.motes.filter(m => Math.hypot(m.x - x, m.y - y) < rad).map(m => m.id));
  let peak = 0;
  if (treat) { if (power === 'meteor') S.meteor(w, x, y, 135); else for (let i = 0; i < 40; i++) { S.paint(w, power, x, y, 60, 0.05); S.step(w, 0.05); } }
  const alive = () => w.motes.filter(m => ids.has(m.id)).length / Math.max(1, ids.size);
  let a20 = 0, a60 = 0;
  for (let i = 1; i <= 300; i++) { S.step(w, 0.2); peak = Math.max(peak, w.motes.filter(m => m.sick > 0).length); if (i === 100) a20 = alive(); if (i === 300) a60 = alive(); }
  if (treat) { R.hit += ids.size; R.alive20 += a20; R.alive60 += a60; R.sickPeak += peak; R.k++; } else { R.ctl20 += a20; R.ctl60 += a60; }
}
for (const k of ['hit', 'alive20', 'alive60', 'ctl20', 'ctl60', 'sickPeak']) R[k] = +(R[k] / R.k).toFixed(2);
console.log(JSON.stringify(R));
