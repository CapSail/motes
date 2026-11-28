// food must behave: nothing broken, nothing out of bounds or in walls, nothing eaten but still lying there, nothing a creature sits on without eating
import * as S from '../sim.js';
for (const seed of [182, 7, 137]) {
  const w = S.createWorld(seed); w.noLog = true; let bad = { nan: 0, out: 0, wall: 0, dead: 0, stale: 0, neg: 0 }, maxStack = 0, sitting = 0, samples = 0, ages = [], maxFood = 0, kinds = [0, 0];
  const seen = new Map();
  for (let i = 1; i <= 9000; i++) {
    S.step(w, 0.2);
    if (i % 150 === 0) {
      samples++; maxFood = Math.max(maxFood, w.food.length); const cells = new Map();
      for (const f of w.food) {
        if (!Number.isFinite(f.x + f.y + f.e)) bad.nan++; if (f.x * f.x + f.y * f.y > S.R * S.R) bad.out++; if (f.dead) bad.dead++; if (f.e <= 0) bad.neg++; kinds[f.k]++;
        const c = S.cidx(f.x, f.y); if (c >= 0 && w.st[c] === 1) bad.wall++;
        if (f.k === 1 && f.age > 140) bad.stale++;
        const key = Math.round(f.x / 3) + ',' + Math.round(f.y / 3); cells.set(key, (cells.get(key) || 0) + 1);
      }
      for (const v of cells.values()) maxStack = Math.max(maxStack, v);
      for (const m of w.motes) { if (m.e < m.cap * 0.9) { for (const f of w.food) { const eff = f.k ? m.meatEff : m.plantEff; if (eff > (f.k ? 0.1 : 0.05) && Math.hypot(f.x - m.x, f.y - m.y) < m.r * 0.8) { sitting++; break; } } } }
    }
  }
  console.log(seed, JSON.stringify(bad), 'max food', maxFood, 'plants/meat', kinds.map(k => Math.round(k / samples)).join('/'), 'most pellets in one 3x3 spot', maxStack, 'hungry creatures sitting on edible food (per sample)', (sitting / samples).toFixed(2), 'pop', w.motes.length);
}
