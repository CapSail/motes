// drop killers into a running dish: do they hunt and last, and does the dish survive them? node scripts/killer-test.mjs seed...
import * as S from '../sim.js';
for (const seed of process.argv.slice(2).map(Number)) {
  const run = drop => {
    const w = S.createWorld(seed); w.noLog = true; w.maxPop = 450;
    for (let i = 0; i < 3000; i++) S.step(w, 0.2);
    let sp = 0;
    if (drop) { let best = null, bn = -1; for (const a of w.motes) { const n = w.motes.filter(b => Math.hypot(a.x - b.x, a.y - b.y) < 90).length; if (n > bn) { bn = n; best = a; } } const k = S.spark(w, best.x, best.y, true); sp = k.sp; }
    const at = []; const mine = new Set(drop ? w.motes.filter(m => m.sp === sp).map(m => m.id) : []); let kills = 0;
    for (let i = 1; i <= 9000; i++) {
      S.step(w, 0.2);
      if (drop && i % 5 === 0) for (const m of w.motes) if (m.diet > 0.65) { mine.add(m.id); m._k = m.kills; }
      if (i === 150 || i === 300 || i === 900 || i === 3000 || i === 9000) at.push([w.motes.length, w.motes.filter(m => m.diet > 0.65).length]);
      if (!w.motes.length) break;
    }
    return { at, ext: !w.motes.length };
  };
  const c = run(false), k = run(true);
  console.log(seed, 'killers alive at 30s/1m/3m/10m/30m:', k.at.map(a => a[1]).join('/'), '| dish pop with killers', k.at.map(a => a[0]).join('/'), 'vs without', c.at.map(a => a[0]).join('/'), k.ext ? 'EXTINCT' : '');
}
