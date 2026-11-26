// clumping in a saved dish after some minutes: node scripts/clump-dish.mjs dish.json mins (env NOSPACE=1 turns the personal-space nudge off)
import * as S from '../sim.js'; import { readFileSync } from 'node:fs';
if (process.env.NOSPACE) globalThis.__NOSPACE = 1;
const w = S.deserialize(readFileSync(process.argv[2], 'utf8')); w.noLog = true; w.maxPop = 450; const mins = +process.argv[3] || 40; const out = [];
for (let min = 1; min <= mins; min++) {
  for (let i = 0; i < 300; i++) S.step(w, 0.2);
  if (min % 10 === 0) { const ms = w.motes, n = ms.length; let crowded = 0, big = 0, sum = 0;
    for (const a of ms) { let c = 0, nn = 1e9; for (const b of ms) { if (a === b) continue; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 60) c++; if (d < nn) nn = d; } sum += nn; if (c >= 4) crowded++; if (c >= 8) big++; }
    const area = Math.PI * S.R * S.R, ce = (sum / n) / (0.5 / Math.sqrt(n / area));
    out.push(`n${n} ce${ce.toFixed(2)} in-groups(4+)${(100 * crowded / n).toFixed(0)}% in-big(8+)${(100 * big / n).toFixed(0)}%`); }
}
console.log(process.argv[2].split('/').pop(), process.env.NOSPACE ? '[no space nudge]' : '[with space nudge]', out.join(' | '));
