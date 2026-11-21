// Which founding seed makes the best day-1 dish? node scripts/seed-search.mjs <from> <to>
import * as S from '../sim.js';
const [a, b] = [+process.argv[2] || 1, +process.argv[3] || 20];
for (let seed = a; seed <= b; seed++) {
  const w = S.createWorld(seed); w.noLog = true; w.maxPop = 450;
  const looks0 = new Set(w.motes.map(m => m.style + '' + m.eyes + m.spikes)).size, styles0 = new Set(w.motes.map(m => m.style)).size;
  const snap = [];
  for (let min = 1; min <= 60; min++) {
    for (let i = 0; i < 60 / 0.2; i++) S.step(w, 0.2);
    if ([10, 30, 60].includes(min)) {
      const ms = w.motes, n = ms.length, tiles = new Set(ms.map(x => Math.floor(x.x / 100) + ',' + Math.floor(x.y / 100))).size;
      snap.push({ n, sp: new Set(ms.map(x => x.sp)).size, hun: ms.filter(x => x.diet > 0.5).length, tiles, looks: new Set(ms.map(m => m.style + '' + m.eyes + m.spikes)).size, styles: new Set(ms.map(m => m.style)).size });
    }
    if (!w.motes.length) { snap.push({ n: 0 }); break; }
  }
  const last = snap[snap.length - 1];
  const alive = last.n >= 60;
  const sc = !alive ? 0 : snap.reduce((acc, s) => acc + (s.n ? Math.min(6, s.sp) * 3 + Math.min(25, s.hun) * 0.6 + s.looks * 0.6 + s.styles * 2 + Math.min(80, s.tiles) * 0.15 : 0), 0) + looks0 + styles0 * 2;
  console.log(JSON.stringify({ seed, alive, score: +sc.toFixed(1), looks0, styles0, snap }));
}
