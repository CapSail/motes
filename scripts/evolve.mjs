// Fast-forward a dish for many dish-years, headless. node scripts/evolve.mjs <seed> <years> <out.json> [maxPop]
// 1 dish-year = 365 days x 200 s = 73,000 sim-seconds.
import { createWorld, step, serialize } from '../sim.js';
import { writeFileSync } from 'node:fs';
const seed = +process.argv[2] || 1, years = +process.argv[3] || 1, out = process.argv[4], maxPop = +process.argv[5] || 500;
const YEAR = 365 * 200, dt = 0.2;
const w = createWorld(seed); w.maxPop = maxPop; w.mercy = true;
const t0 = Date.now(); let next = 0;
for (let t = 0; t < years * YEAR; t += dt) {
  step(w, dt);
  if (t >= next) {
    next += YEAR / 4;
    const plans = new Set(w.motes.map(m => m.segs + '' + m.limbs + m.pat + (m.fin > 0.5 ? 1 : 0) + m.ant)).size;
    const s = w.stats, c = w.counters;
    console.log(`y${(t / YEAR).toFixed(2)} pop=${w.motes.length} sp=${s.species} plans=${plans} conns=${(s.conns || 0).toFixed(0)} hid=${(s.hid || 0).toFixed(1)} diet=${(s.diet || 0).toFixed(2)} struct=${w.stCount} born=${c.births} kills=${c.kills} fr=${c.friends} famGifts=${Math.round(c.famGifts)} stolen=${Math.round(c.stolen)} shared=${Math.round(c.shared)} newsp=${c.newSpecies} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    if (out) writeFileSync(out, serialize(w));
  }
}
w.mercy = false;
if (out) writeFileSync(out, serialize(w));
console.log('done', out, (serialize(w).length / 1024).toFixed(0) + 'KB');
