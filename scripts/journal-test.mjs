// star a few creatures, let the dish run, and read their journals
import * as S from '../sim.js'; import { jText } from '../journal.js';
const w = S.createWorld(11); w.noLog = false; for (let i = 0; i < 600; i++) S.step(w, 0.2);
const picks = w.motes.slice().sort((a, b) => b.kids - a.kids).slice(0, 3); for (const m of picks) S.toggleFav(w, m);
for (let i = 0; i < 12000; i++) { S.step(w, 0.2); if (i === 3000) S.meteor(w, picks[0].x, picks[0].y); if (i === 5000) S.startPlague(w, 30); if (i === 7000) picks[1].e = 0.01; }
let fails = 0; const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + x); if (!c) fails++; };
const js = Object.values(w.journals);
ok('three journals', js.length === 3);
ok('all immortals alive', picks.every(m => w.motes.includes(m)));
const kinds = {}; for (const j of js) for (const e of j.entries) kinds[e[1]] = (kinds[e[1]] || 0) + 1;
console.log('entry kinds', JSON.stringify(kinds));
ok('daily reviews written', kinds.day >= 20); ok('cheated death recorded', kinds.cheat >= 1); ok('no spam: under 900 entries each', js.every(j => j.entries.length <= 900), js.map(j => j.entries.length).join(','));
const saved = S.serialize(w), w2 = S.deserialize(saved);
ok('journals survive save and load', Object.keys(w2.journals).length === 3 && w2.journals[picks[0].id].entries.length === w.journals[picks[0].id].entries.length, 'save ' + (saved.length / 1024 | 0) + 'KB, journals ' + (JSON.stringify(w.journals).length / 1024 | 0) + 'KB');
S.toggleFav(w, picks[2]); ok('unstar keeps the journal', w.journals[picks[2].id].mortal === true);
const lines = jText(w.journals[picks[0].id]).split('\n'); console.log('---- sample ----\n' + lines.slice(0, 14).join('\n') + '\n  ...\n' + lines.slice(-22).join('\n'));
console.log(fails ? fails + ' FAILED' : 'ALL PASS');
