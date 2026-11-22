// hunter test: do carnivores survive? usage: node hunt-test.mjs seed mins  (env PK, MF, BG override the diet rules)
import * as S from '../sim.js';
if (process.env.PK) globalThis.__PK = +process.env.PK;
if (process.env.MF) globalThis.__MF = +process.env.MF;
if (process.env.BG) globalThis.__BG = +process.env.BG;
const mins = +process.argv[3] || 60;
for (const seed of (process.argv[2] || '226').split(',').map(Number)) {
  const w = S.createWorld(seed); w.noLog = true; w.maxPop = 450; const row = [];
  for (let min = 1; min <= mins; min++) {
    for (let i = 0; i < 300; i++) S.step(w, 0.2);
    if (min % (mins >= 60 ? 15 : 5) === 0 || min === 1) { const ms = w.motes; const h = ms.filter(m => m.diet > .5).length, mid = ms.filter(m => m.diet > .2 && m.diet <= .5).length; row.push(`${ms.length}p ${h}h ${mid}o d${(ms.reduce((a, m) => a + m.diet, 0) / (ms.length || 1)).toFixed(2)} k${w.counters.kills}`); }
    if (!w.motes.length) { row.push('EXTINCT@' + min); break; }
  }
  console.log(seed, row.join(' | '));
}
