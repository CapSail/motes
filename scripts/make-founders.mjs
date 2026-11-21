// pick a varied set of evolved genomes from scripts/pool.json and write founders.js (used by createWorld)
import { readFileSync, writeFileSync } from 'node:fs';
const pool = JSON.parse(readFileSync(process.argv[2] || 'scripts/pool.json', 'utf8')), max = +process.argv[3] || 18;
const dishOf = p => p.src.split('#')[0];
const byDish = new Map(); for (const p of pool) { if (!byDish.has(dishOf(p))) byDish.set(dishOf(p), []); byDish.get(dishOf(p)).push(p); }
const chosen = new Set();
const hunters = pool.filter(p => p.diet >= 0.5).sort((a, b) => b.n - a.n).slice(0, 4); hunters.forEach(p => chosen.add(p));
for (const [, arr] of byDish) { arr.sort((a, b) => (b.n + b.kids * 8) - (a.n + a.kids * 8)); let k = 0; for (const p of arr) { if (chosen.size >= max) break; if (!chosen.has(p) && p.diet < 0.5 && k < 2) { chosen.add(p); k++; } } }
const list = [...chosen];
writeFileSync('founders.js', '// Evolved genomes (bodies and brains) taken from dishes that were fast-forwarded for years. A fresh dish starts from a few of these at generation 0.\nexport const PACK = ' + JSON.stringify(list.map(p => p.g)) + ';\nexport const PACK_INFO = ' + JSON.stringify(list.map(p => ({ src: p.src, diet: p.diet, hid: p.nh }))) + ';\n');
console.log('founders.js:', list.length, 'genomes,', list.filter(p => p.diet >= 0.5).length, 'hunters');
