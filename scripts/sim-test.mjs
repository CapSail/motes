// Headless run: node scripts/sim-test.mjs [seed] [simMinutes]
import { createWorld, step, serialize, deserialize, SPLIT } from '../sim.js';
const seed = +process.argv[2] || 1, mins = +process.argv[3] || 20;
const w = createWorld(seed);
const t0 = Date.now();
const dt = 0.1;
w.thinkMask = 1;
let next = 0;
for (let t = 0; t < mins * 60; t += dt) {
  step(w, dt);
  if (t >= next) {
    next += 120;
    const s = w.stats, c = w.counters;
    console.log(`t=${(t / 60).toFixed(0)}m pop=${w.motes.length} sp=${s.species} food=${w.food.length} diet=${(s.diet || 0).toFixed(2)} conns=${(s.conns || 0).toFixed(1)} hid=${(s.hid || 0).toFixed(2)} photo=${(s.photo || 0).toFixed(2)} struct=${w.stCount} births=${c.births} (sex ${c.sexual}) kills=${c.kills} built=${c.built} stored=${Math.round(c.stored)} stolen=${Math.round(c.stolen)} shared=${Math.round(c.shared)}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    if (!w.motes.length) { console.log('EXTINCT'); break; }
  }
}
console.log('--- diary (last 25)');
for (const l of w.log.slice(-25)) console.log(Math.round(l.t) + 's', l.kind, l.text);
console.log('--- fame', JSON.stringify(w.fame));
const str = serialize(w);
console.log('save size', (str.length / 1024).toFixed(0) + 'KB');
const w2 = deserialize(str);
console.log('reload pop', w2.motes.length, 'food', w2.food.length, 'species', w2.species.size);
for (let i = 0; i < 200; i++) step(w2, 0.1);
console.log('after 20s more pop', w2.motes.length);
