import { deserialize } from '../sim.js'; import { readFileSync } from 'node:fs';
for (const f of process.argv.slice(2)) { const w = deserialize(readFileSync(f, 'utf8')), ms = w.motes; if (!ms.length) { console.log(f.split('/').pop(), 'empty'); continue; }
  const a = g => (ms.reduce((s, m) => s + g(m), 0) / ms.length).toFixed(2);
  console.log(f.split('/').pop(), 'n' + ms.length, 'basal', a(m => m.basal), 'armor', a(m => m.armor), 'toxr', a(m => m.toxr), 'disr', a(m => m.disr), 'r', a(m => m.r), 'arms', a(m => m.arms), 'photo', a(m => m.photo)); }
