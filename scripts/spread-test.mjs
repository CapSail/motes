import * as S from '../sim.js'; import { readFileSync } from 'node:fs';
for (const f of process.argv.slice(2)) {
  const w = S.deserialize(readFileSync(f, 'utf8')); w.maxPop = 450; const row = [];
  for (let m = 0; m <= 6; m++) {
    if (m) for (let i = 0; i < 60 / 0.05; i++) S.step(w, 0.05);
    const ms = w.motes, n = ms.length, cx = ms.reduce((a, x) => a + x.x, 0) / n, cy = ms.reduce((a, x) => a + x.y, 0) / n;
    // fraction of the dish (in 100-unit tiles) holding at least one mote
    const tiles = new Set(ms.map(x => Math.floor(x.x / 100) + ',' + Math.floor(x.y / 100)));
    row.push(n + ':' + tiles.size + 'tiles');
  }
  console.log(f.split('/').pop(), row.join(' '), '(dish is ~154 tiles)');
}
