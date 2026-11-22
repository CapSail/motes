// what bodies evolved: arms and tools by diet, plus body shape averages. node scripts/arms-hist.mjs dish.json ...
import { deserialize, TOOLS } from '../sim.js'; import { readFileSync } from 'node:fs';
for (const f of process.argv.slice(2)) {
  const w = deserialize(readFileSync(f, 'utf8')), ms = w.motes; if (!ms.length) { console.log(f.split('/').pop(), 'empty'); continue; }
  const arms = [0, 0, 0], tool = {}; let meatW = 0, meat = 0, plantG = 0, plant = 0;
  for (const m of ms) { arms[m.arms]++; if (m.arms) tool[TOOLS[m.tool]] = (tool[TOOLS[m.tool]] || 0) + 1; const me = m.diet > 0.2; if (me) { meat++; if (m.arms && m.tool <= 2) meatW++; } else { plant++; if (m.arms && m.tool >= 3) plantG++; } }
  const avg = g => (ms.reduce((a, m) => a + g(m), 0) / ms.length).toFixed(2);
  console.log(f.split('/').pop(), 'n' + ms.length, 'arms[' + arms + ']', JSON.stringify(tool), `weaponised meat-eaters ${meatW}/${meat}, gatherers among plant-eaters ${plantG}/${plant}`, 'segs', avg(m => m.segs), 'taper', avg(m => m.taper), 'curl', avg(m => Math.abs(m.curl)), 'len', avg(m => m.lenF));
}
