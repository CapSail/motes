import { deserialize } from '../sim.js';
import { readFileSync } from 'node:fs';
for (const f of process.argv.slice(2)) {
  const s = readFileSync(f, 'utf8'), w = deserialize(s), ms = w.motes;
  const plans = new Set(ms.map(m => m.segs + '' + m.limbs + m.pat + (m.fin > .5 ? 1 : 0) + m.ant)).size;
  const sp = new Set(ms.map(m => m.sp)).size, diet = ms.reduce((a, m) => a + m.diet, 0) / ms.length;
  const hunters = ms.filter(m => m.diet > .5).length, c = w.counters;
  const score = sp * 3 + plans + Math.min(40, hunters) + Math.min(60, ms.reduce((a, m) => a + m.net.nh, 0) / ms.length * 2) + (w.stCount > 50 ? 10 : 0);
  console.log(f, 'KB', (s.length / 1024) | 0, 'pop', ms.length, 'species', sp, 'plans', plans, 'hunters', hunters, 'avgHid', (ms.reduce((a, m) => a + m.net.nh, 0) / ms.length).toFixed(1), 'struct', w.stCount, 'year', (w.t / 73000).toFixed(2), 'keep', w.keep.length, 'score', score.toFixed(0), 'friends', c.friends, 'inbred', c.inbred);
}
