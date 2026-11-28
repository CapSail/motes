// how do creatures die, and how well do dishes hold up? node scripts/death-test.mjs from to mins   (env NOSURV=1 turns survival instincts off)
if (process.env.FD) globalThis.__FD = +process.env.FD;
import * as S from '../sim.js';
if (process.env.NOSURV) globalThis.__NOSURV = 1;
const [a, b, mins] = [+process.argv[2] || 1, +process.argv[3] || 6, +process.argv[4] || 60];
const T = {}; let ext = 0, popSum = 0, popN = 0, lows = [], ages = 0, deaths = 0;
for (let seed = a; seed <= b; seed++) {
  const w = S.createWorld(seed); w.noLog = true; w.maxPop = 450; let mn = 1e9; const live = new Map();
  for (let i = 0; i < mins * 300; i++) {
    if (i % 5 === 0) for (const m of w.motes) live.set(m.id, m);
    S.step(w, 0.2);
    if (i % 5 === 4) { const now = new Set(w.motes.map(m => m.id)); for (const [id, m] of live) if (!now.has(id)) { T[m.why] = (T[m.why] || 0) + 1; ages += m.age / m.life; deaths++; live.delete(id); } }
    if (i % 300 === 299) { popSum += w.motes.length; popN++; if (i > 1500) mn = Math.min(mn, w.motes.length); }
    if (!w.motes.length) { ext++; break; }
  }
  lows.push(mn);
}
console.log(JSON.stringify({ seeds: `${a}-${b}`, T, ext, avgPop: +(popSum / popN).toFixed(0), lows, lifeUsed: +(ages / deaths).toFixed(3), deaths }));
