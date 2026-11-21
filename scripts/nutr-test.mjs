// what does the soil do? node scripts/nutr-test.mjs <seed> [minutes]
import * as S from '../sim.js';
const seed = +process.argv[2] || 175, mins = +process.argv[3] || 120; if (process.argv[4]) S.NUTRIENTS.use = +process.argv[4]; if (process.argv[5]) S.NUTRIENTS.regen = +process.argv[5]; if (process.argv[6]) S.NUTRIENTS.excrete = +process.argv[6]; if (process.argv[7]) S.SUN.k = +process.argv[7]; const w = S.createWorld(seed); w.noLog = true; w.maxPop = 450; const rows = [];
for (let m = 1; m <= mins; m++) { for (let i = 0; i < 300; i++) S.step(w, 0.2);
  if (m % 20 === 0) { const ms = w.motes, n = ms.length || 1, nut = w.nut.reduce((a, v, i) => a + (w.st[i] === 255 ? 0 : v), 0) / (w.nut.length * 0.78);
    rows.push(`${ms.length}c ${new Set(ms.map(x => x.sp)).size}sp photo${(ms.reduce((a, x) => a + x.photo, 0) / n).toFixed(2)} hunt${ms.filter(x => x.diet > .5).length} soil${nut.toFixed(2)} food${w.food.length}`); }
  if (!w.motes.length) { rows.push('EXTINCT@' + m); break; } }
console.log(seed + ': ' + rows.join(' | '));
