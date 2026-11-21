// pour something at the centre, scatter motes around it, and see where likers / haters end up
import * as S from '../sim.js';
const mk = () => { const w = S.createWorld(5); w.events = false; w.maxPop = 200; for (let i = 0; i < 100; i++) S.step(w, 0.2);
  for (const m of w.motes) { const a = Math.random() * 6.283, d = 60 + Math.random() * 240; m.x = Math.cos(a) * d; m.y = Math.sin(a) * d; m.e = m.cap; } return w; };
const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN;
for (const [tool, k] of [['chemA', 0], ['chemB', 1], ['chemC', 2], ['toxin', -1], ['heat', -1], ['cold', -1]]) {
  const w = mk(), ids = w.motes.map(m => m.id);
  const startD = new Map(w.motes.map(m => [m.id, Math.hypot(m.x, m.y)]));
  for (let t = 0; t < 400; t++) { if (t % 4 === 0) S.paint(w, tool, 0, 0, 80, 0.2); S.step(w, 0.05); for (const m of w.motes) m.e = Math.max(m.e, m.cap * 0.8); }
  const live = w.motes.filter(m => startD.has(m.id));
  const delta = m => Math.hypot(m.x, m.y) - startD.get(m.id);
  if (k >= 0) {
    const like = live.filter(m => m.aff[k] > 0.2), hate = live.filter(m => m.aff[k] < -0.2);
    console.log(tool, 'likers moved', mean(like.map(delta)).toFixed(0), `(n=${like.length})`, ' haters moved', mean(hate.map(delta)).toFixed(0), `(n=${hate.length})   (negative = moved toward centre)`);
  } else {
    console.log(tool, 'all motes moved', mean(live.map(delta)).toFixed(0), '  inside r<80:', live.filter(m => Math.hypot(m.x, m.y) < 80).length, 'of', live.length);
  }
}
