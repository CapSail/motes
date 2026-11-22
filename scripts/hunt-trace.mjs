import * as S from '../sim.js';
const w = S.createWorld(+process.argv[2] || 226); w.noLog = true;
const hs = () => w.motes.filter(m => m.diet > .5);
console.log('start hunters', hs().length, 'total', w.motes.length);
for (let t = 0; t < 120; t++) {
  for (let i = 0; i < 25; i++) S.step(w, 0.2);   // 5 s
  const h = hs();
  if (t % 2 === 0) console.log((t * 5) + 's', h.length + 'h', h.map(m => Math.round(m.e) + '/' + m.kills).join(' '), 'prey', w.motes.length, 'kills', w.counters.kills);
  if (!h.length) break;
}
