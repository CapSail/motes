// give every creature in a saved dish an American name (children share their parent's surname): node scripts/rename-dish.mjs in.json out.json
import * as S from '../sim.js'; import { readFileSync, writeFileSync } from 'node:fs';
const w = S.deserialize(readFileSync(process.argv[2], 'utf8')); S.seedRng(12345);
const by = new Map(w.motes.map(m => [m.id, m])), last = new Map();
for (const m of [...w.motes].sort((a, b) => a.id - b.id)) {
  const p = by.get(m.pa) || by.get(m.par); const sur = p ? last.get(p.id) : '';
  m.name = S.personName(sur || undefined); last.set(m.id, S.lastNameOf(m.name));
  m.anc = [];
}
for (const f of w.favs) { const m = by.get(f.id); if (m) f.name = m.name; }
writeFileSync(process.argv[3] || process.argv[2], S.serialize(w));
console.log('renamed', w.motes.length, 'creatures; examples:', w.motes.slice(0, 5).map(m => m.name).join(', '));
