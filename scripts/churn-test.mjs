// how many species are born per dish-hour, and how many are alive
import * as S from '../sim.js';
if (process.env.NOPOD) globalThis.__NOPOD = 1;
const seed = +process.argv[2] || 1, mins = +process.argv[3] || 30;
const w = S.createWorld(seed); w.noLog = true; if (process.env.NOEV) w.events = false; if (process.env.SPL) S.__setSplit && 0;
const t0 = Date.now();
for (let t = 0; t < mins * 60 / 0.2; t++) S.step(w, 0.2);
const sp = [...w.species.values()];
const big = sp.filter(s => s.peak >= 5).length;
console.log(`seed ${seed} ${mins}min: pop ${w.motes.length} alive ${w.stats.species} born ${w.counters.newSpecies} extinct ${w.counters.extinct} species-with-peak>=5 ${big} (${((Date.now()-t0)/1000).toFixed(0)}s)`);
