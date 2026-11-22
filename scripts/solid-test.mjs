// walls must stop bodies (even fast ones, even big ones), and bodies must not overlap unless one is biting the other
import * as S from '../sim.js';
let fails = 0; const ok = (name, c, extra = '') => { console.log((c ? 'PASS ' : 'FAIL ') + name + ' ' + extra); if (!c) fails++; };
// 1. a fast creature charging a wall, at the big headless step and the small live step
for (const dt of [0.2, 0.05]) {
  const w = S.createWorld(3); w.events = false; w.noLog = true;
  const proto = w.motes.slice().sort((a, b) => b.maxSp - a.maxSp)[0];
  const m = S.cloneMote(w, proto); w.motes.length = 0; w.motes.push(m); w.food.length = 0;
  m.x = -200; m.y = 0; m.h = 0; m.maxSp = 70; m.e = m.cap; m.rt = 0; m.rth = 1;
  for (let y = -400; y <= 400; y += 4) { const i = S.cidx(-100, y); if (i >= 0) { w.st[i] = 1; w.hp[i] = 255; } }
  w.walls = 99; let maxX = -999;
  m.think = null;
  for (let t = 0; t < 400; t++) { m.e = m.cap; m.o[S.OUT.THRUST] = 1; m.o[S.OUT.TURN] = 0; S.step(w, dt); if (m.dead) break; maxX = Math.max(maxX, m.x); }
  ok(`fast creature stopped by a wall (dt ${dt})`, maxX < -100 - 4, 'furthest x ' + maxX.toFixed(1) + ' (wall at -100)');
}
// 2. two creatures in a crowd: no overlap
{
  const w = S.createWorld(5); w.events = false; w.noLog = true; for (let t = 0; t < 600; t++) S.step(w, 0.2);
  let worst = 0, pairs = 0, over = 0; const ms = w.motes;
  for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) { const a = ms[i], b = ms[j]; const d = Math.hypot(a.x - b.x, a.y - b.y), need = (a.r + b.r) * 0.95; pairs++; if (d < need * 0.8) { over++; worst = Math.max(worst, need - d); } }
  ok('crowd: almost no deep overlaps (newborns are still being pushed out)', over / pairs < 0.001, `${over} overlapping pairs of ${pairs}, worst ${worst.toFixed(2)}`);
}
// 3. a pile forced onto one spot spreads out
{
  const w = S.createWorld(7); w.events = false; w.noLog = true;
  const ms = w.motes.slice(0, 8); for (const m of ms) { m.x = 10 + Math.random(); m.y = 10 + Math.random(); m.o[S.OUT.BITE] = 0; m.bt = 0; }
  for (let t = 0; t < 40; t++) S.step(w, 0.05);
  let minD = 1e9; for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) minD = Math.min(minD, Math.hypot(ms[i].x - ms[j].x, ms[i].y - ms[j].y) / (ms[i].r + ms[j].r));
  ok('stacked creatures push apart', minD > 0.6, 'closest pair at ' + minD.toFixed(2) + ' of touching distance');
}
// 4. nobody inside a wall after a long run with builders
{
  const w = S.createWorld(11); w.noLog = true; let inside = 0, tot = 0;
  for (let t = 0; t < 3000; t++) { S.step(w, 0.2); if (t % 100 === 99) for (const m of w.motes) { tot++; const i = S.cidx(m.x, m.y); if (i >= 0 && (w.st[i] === 1)) inside++; } }
  ok('creatures are not inside walls', inside / Math.max(1, tot) < 0.002, `${inside} of ${tot} samples; walls ${w.walls}`);
}
console.log(fails ? fails + ' FAILED' : 'ALL PASS');
