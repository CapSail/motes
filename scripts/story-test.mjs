// do the new diary stories fire? node scripts/story-test.mjs [seed] [minutes]
import * as S from '../sim.js';
const w = S.createWorld(+process.argv[2] || 100); const mins = +process.argv[3] || 120;
for (let min = 1; min <= mins; min++) { for (let i = 0; i < 300; i++) S.step(w, 0.2); if (min === 30) S.startPlague(w, 8); }
const all = S.allLog(w), pick = re => all.filter(l => re.test(l.text));
const groups = { Rivalry: /^Rivalry/, 'Family line': /family has grown/, Record: /^Record broken/, Obituary: /Left behind|peacefully|starved|was eaten/, 'Last of kind': /^Last of their kind/, 'Species first': /learned to|began hoarding|began caring|first energy thief|started building/, Plague: /plague/i };
for (const [k, re] of Object.entries(groups)) { const m = pick(re); console.log(k.padEnd(14), String(m.length).padStart(4), m[0] ? '| e.g. ' + m[0].text.slice(0, 110) : ''); }
console.log('pop', w.motes.length, 'species', w.stats.species, 'rivalries', w.counters.rivalries || 0, 'plagues', w.counters.plagues, 'largest family', w.fame.dynasty && w.fame.dynasty.name + ' ' + w.fame.dynasty.val);
const w2 = S.deserialize(S.serialize(w)); console.log('save roundtrip ok:', w2.motes.length === w.motes.length, 'strain kept:', w2.motes.some(m => m.strain !== 0.5), 'lines kept:', w2.motes.every(m => m.ln));
