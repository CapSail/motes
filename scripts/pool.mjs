// collect one successful mote per species from evolved dishes: node scripts/pool.mjs out.json dish1.json dish2.json ...
import * as S from '../sim.js'; import { readFileSync, writeFileSync } from 'node:fs';
const [out, ...files] = process.argv.slice(2); const pool = [];
for (const f of files) {
  const w = S.deserialize(readFileSync(f, 'utf8')), by = new Map();
  for (const m of w.motes) { if (!by.has(m.sp)) by.set(m.sp, []); by.get(m.sp).push(m); }
  for (const [sp, ms] of by) {
    if (ms.length < 4) continue;
    ms.sort((a, b) => (b.kids + b.age / 50) - (a.kids + a.age / 50));
    const m = ms[0];
    pool.push({ src: f.split('/').pop() + '#' + sp, n: ms.length, diet: +m.diet.toFixed(2), nh: m.net.nh, nc: m.net.nc, style: m.style, size: +m.r.toFixed(1), kids: m.kids, g: S.packGenome(m.g) });
  }
}
writeFileSync(out, JSON.stringify(pool));
for (const p of pool) console.log(p.src, 'n', p.n, 'diet', p.diet, 'hid', p.nh, 'conns', p.nc, 'style', p.style, 'size', p.size, 'kids', p.kids);
console.log(pool.length, 'candidates');
