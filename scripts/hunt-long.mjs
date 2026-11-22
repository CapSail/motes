// long run for hunters: node hunt-long.mjs seed hours  (env PK MF BG). prints every 2h: pop, diet histogram, kills/hr
import * as S from '../sim.js';
if (process.env.PK) globalThis.__PK = +process.env.PK;
if (process.env.MF) globalThis.__MF = +process.env.MF;
if (process.env.BG) globalThis.__BG = +process.env.BG;
const seed = +process.argv[2] || 226, hours = +process.argv[3] || 12;
const w = S.createWorld(seed); w.noLog = true; w.maxPop = 450; let lastK = 0;
for (let h = 1; h <= hours; h++) {
  for (let i = 0; i < 18000; i++) S.step(w, 0.2);
  if (h % 2 === 0) {
    const ms = w.motes, b = [0, 0, 0, 0, 0];
    for (const m of ms) b[Math.min(4, Math.floor(m.diet * 5))]++;
    const topK = ms.slice().sort((a, c) => c.kills - a.kills)[0];
    console.log(`${seed} h${h} pop${ms.length} diet[${b.join(',')}] sp${new Set(ms.map(m => m.sp)).size} kills/h${Math.round((w.counters.kills - lastK) / 2)} topKiller:${topK ? topK.kills + 'k d' + topK.diet.toFixed(2) : '-'}`);
    lastK = w.counters.kills;
  }
  if (!ms0(w)) { console.log(seed, 'EXTINCT h' + h); break; }
}
function ms0(w) { return w.motes.length; }
