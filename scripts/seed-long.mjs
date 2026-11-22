import * as S from '../sim.js';
for (const seed of process.argv.slice(2).map(Number)) {
  const w = S.createWorld(seed); w.noLog = true; w.maxPop = 450; const row = [];
  for (let min = 1; min <= 180; min++) { for (let i = 0; i < 300; i++) S.step(w, 0.2); if (min % 30 === 0) { const ms = w.motes; row.push(ms.length + '/' + new Set(ms.map(m => m.sp)).size + 'sp/' + ms.filter(m => m.diet > .25).length + 'h/' + new Set(ms.map(m => Math.floor(m.x / 100) + ',' + Math.floor(m.y / 100))).size + 't'); } if (!w.motes.length) { row.push('EXTINCT@' + min); break; } }
  console.log(seed, row.join(' '));
}
