// extinction test: node ext-test.mjs from to mins (env PK MF BG override). prints extinct seeds and lowest pops
import * as S from '../sim.js';
if (process.env.PK) globalThis.__PK = +process.env.PK; if (process.env.MF) globalThis.__MF = +process.env.MF; if (process.env.BG) globalThis.__BG = +process.env.BG;
const [a, b, mins] = [+process.argv[2], +process.argv[3], +process.argv[4] || 60]; const ext = [], low = [];
for (let seed = a; seed <= b; seed++) {
  const w = S.createWorld(seed); w.noLog = true; w.maxPop = 450; let mn = 1e9, dead = 0;
  for (let min = 1; min <= mins; min++) { for (let i = 0; i < 300; i++) S.step(w, 0.2); mn = Math.min(mn, w.motes.length); if (!w.motes.length) { dead = min; break; } }
  if (dead) ext.push(seed + '@' + dead); else low.push(mn);
}
console.log(`${a}-${b}: extinct ${ext.length}/${b - a + 1} [${ext.join(' ')}] lowest-pop median ${low.sort((x, y) => x - y)[(low.length / 2) | 0]}`);
