// how hard does each player power hit? node scripts/power-test.mjs power seeds...   prints population against an untouched twin at +20 seconds, +1, +3 and +10 minutes
// one "use" = holding the medium brush on the busiest spot for 2 seconds (events: one tap; meteor: one drop)
import * as S from '../sim.js';
const power = process.argv[2], seeds = process.argv.slice(3).map(Number);
const res = { power, k: 0, p0: 0, p1: 0, p3: 0, p10: 0, ext: 0, food: 0 };
for (const seed of seeds) {
  const run = apply => {
    const w = S.createWorld(seed); w.noLog = true; w.events = false; w.maxPop = 450;
    for (let i = 0; i < 3000; i++) S.step(w, 0.2);
    let best = null, bn = -1; for (const a of w.motes) { const n = w.motes.filter(b => Math.hypot(a.x - b.x, a.y - b.y) < 60).length; if (n > bn) { bn = n; best = a; } }
    const x = best.x, y = best.y, before = w.motes.length; let inst = 0;
    if (apply) {
      if (['iceage', 'drought', 'cold', 'heat', 'bloom'].includes(apply) && !process.env.BRUSH) S.triggerEvent(w, apply);
      else if (apply === 'meteor') S.meteor(w, x, y, 135);
      else if (apply === 'spark') S.spark(w, x, y);
      else for (let i = 0; i < 40; i++) { S.paint(w, apply === 'bcold' ? 'cold' : apply === 'bheat' ? 'heat' : apply, x, y, 40, 0.05); S.step(w, 0.05); }
    }
    const at = [];
    for (let i = 1; i <= 3000; i++) { S.step(w, 0.2); if (i === 100 || i === 300 || i === 900 || i === 3000) at.push(w.motes.length); }
    return { at, food: w.food.length };
  };
  const c = run(null), t = run(power);
  res.k++; res.p0 += (t.at[0] || 0) / Math.max(1, c.at[0]); res.p1 += (t.at[1] || 0) / Math.max(1, c.at[1]); res.p3 += (t.at[2] || 0) / Math.max(1, c.at[2]); res.p10 += (t.at[3] || 0) / Math.max(1, c.at[3]); res.food += t.food / Math.max(1, c.food); if (!t.at[3]) res.ext++;
}
for (const k of ['p0', 'p1', 'p3', 'p10', 'food']) res[k] = +(res[k] / res.k).toFixed(2);
console.log(JSON.stringify(res));
