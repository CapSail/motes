// load a dish and run it with real settings (no mercy) to see whether it stays alive and interesting
import * as S from '../sim.js'; import { readFileSync } from 'node:fs';
for (const f of process.argv.slice(2)) {
  const w = S.deserialize(readFileSync(f, 'utf8')); w.maxPop = 450; w.mercy = false; const t0 = Date.now(), out = [];
  for (let m = 1; m <= 12; m++) { for (let i = 0; i < 60 / 0.05; i++) S.step(w, 0.05); out.push(w.motes.length + '/' + new Set(w.motes.map(x => x.sp)).size + 'sp/d' + (w.motes.reduce((a, x) => a + x.diet, 0) / (w.motes.length || 1)).toFixed(2)); }
  console.log(f.split('/').pop(), out.join(' '), ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
