import * as S from '../sim.js';
const w = S.createWorld(4); for (let i = 0; i < 1500; i++) S.step(w, 0.2);
const p0 = w.motes.length; const m = w.motes[0];
const dead = S.meteor(w, m.x, m.y, 120);
console.log('pop', p0, '-> after meteor', w.motes.length, 'killed', dead);
S.triggerEvent(w, 'iceage'); S.triggerEvent(w, 'drought');
for (let i = 0; i < 3000; i++) S.step(w, 0.2);
console.log('after ice age/drought 600s pop', w.motes.length, 'food', w.food.length, 'pods shared', Math.round(w.counters.podShared || 0));
const s2 = S.deserialize(S.serialize(w)); console.log('reload ok', s2.motes.length, s2.species.size);
