// how clumped are the creatures? node scripts/clump-test.mjs seed,seed,... mins
if (process.env.NOPOD) globalThis.__NOPOD = 1;
// ce = Clark-Evans ratio (mean nearest-neighbour distance / what random scatter would give): 1 = random, below 1 = clumped, above 1 = evenly spread
// crowded = share of creatures that have 6 or more neighbours within 50 units
import * as S from '../sim.js';
const seeds = (process.argv[2] || '7').split(',').map(Number), mins = +process.argv[3] || 120;
const rows = [];
for (const seed of seeds) {
  const w = S.createWorld(seed); w.noLog = true; w.maxPop = 450; const out = [];
  for (let min = 1; min <= mins; min++) {
    for (let i = 0; i < 300; i++) S.step(w, 0.2);
    if (min % 30 === 0 && w.motes.length > 5) {
      const ms = w.motes, n = ms.length; let sum = 0, crowded = 0;
      for (const a of ms) { let nn = 1e9, c = 0; for (const b of ms) { if (a === b) continue; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < nn) nn = d; if (d < 50) c++; } sum += nn; if (c >= 6) crowded++; }
      const area = Math.PI * S.R * S.R, expect = 0.5 / Math.sqrt(n / area);
      out.push({ ce: (sum / n) / expect, crowded: crowded / n, n });
    }
  }
  rows.push(out);
  console.log(seed, out.map(o => `n${o.n} ce${o.ce.toFixed(2)} crowd${(o.crowded * 100).toFixed(0)}%`).join(' | '));
}
const all = rows.flat(); console.log('MEAN ce', (all.reduce((a, o) => a + o.ce, 0) / all.length).toFixed(2), 'crowded', (100 * all.reduce((a, o) => a + o.crowded, 0) / all.length).toFixed(0) + '%');
