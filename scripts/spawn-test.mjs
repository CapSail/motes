// food must appear the way it should: farms grow food on their own tiles (even when the dish is full of food), nothing flashes into view and vanishes, nothing in walls or outside
import * as S from '../sim.js';
let fails = 0; const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + x); if (!c) fails++; };
const onFarm = (w, f) => { const i = S.cidx(f.x, f.y); return i >= 0 && w.st[i] === 2; };
for (const full of [false, true]) {
  const w = S.createWorld(182); w.noLog = true; w.events = false;
  w.motes.length = 0; if (full) { let g = 0; while (w.food.length < w.foodMax && g++ < 6000) S.paint(w, 'food', (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500, 120, 0.4); }
  S.paint(w, 'farm', 0, 0, 60, 1); const tiles = w.st.filter(v => v === 2).length;
  for (let i = w.food.length - 1; i >= 0; i--) if (onFarm(w, w.food[i])) w.food.splice(i, 1);
  const at = [];
  for (let t = 1; t <= 600; t++) { w.light = 1; S.step(w, 0.2); if (t === 150 || t === 300 || t === 600) at.push(w.food.filter(f => onFarm(w, f)).length); }
  ok(`farm of ${tiles} tiles grows food on itself (${full ? 'dish already full of food' : 'ordinary dish'})`, at[1] >= tiles * 0.4 && at[2] <= tiles * 3.2, 'pellets on the farm after 30s/60s/120s: ' + at.join('/'));
}
{ const w = S.createWorld(7); w.noLog = true; let flash = 0, bad = 0;
  S.paint(w, 'wall', 60, 0, 50, 1);
  for (let t = 0; t < 3000; t++) { S.step(w, 0.2); for (const f of w.food) { if (f.dead) flash++; const i = S.cidx(f.x, f.y); if (i < 0 || w.st[i] === 1 || f.x * f.x + f.y * f.y > S.R * S.R) bad++; } }
  ok('no food flashes into view only to vanish', flash === 0, flash + ' dead pellets left showing over 10 minutes');
  ok('no food in walls or outside the dish', bad === 0, String(bad)); }
console.log(fails ? fails + ' FAILED' : 'ALL PASS');
