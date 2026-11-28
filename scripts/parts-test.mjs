// do the optional parts spread or fade? node scripts/parts-test.mjs seed hours
import * as S from '../sim.js';
const seed = +process.argv[2] || 1, hours = +process.argv[3] || 6;
const w = S.createWorld(seed); w.noLog = true; w.maxPop = 450; const row = [];
const share = () => ['sting', 'camo', 'jet'].map(k => Math.round(100 * w.motes.filter(m => m[k] > 0).length / Math.max(1, w.motes.length)));
row.push('start ' + share().join('/'));
for (let h = 1; h <= hours; h++) { for (let i = 0; i < 18000; i++) S.step(w, 0.2); if (!w.motes.length) { row.push('EXTINCT'); break; } if (h % 2 === 0) row.push(`h${h} n${w.motes.length} ${share().join('/')}`); }
console.log(seed, '% stinger/camo/jet:', row.join(' | '));
