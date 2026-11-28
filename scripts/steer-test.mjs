import * as S from '../sim.js';
let fails = 0; const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + ' ' + x); if (!c) fails++; };
const w = S.createWorld(182); w.noLog = true; w.events = false; for (let i = 0; i < 100; i++) S.step(w, 0.05);
const m = w.motes[0]; S.toggleFav(w, m); const others = w.motes.filter(o => o !== m); w.motes.length = 0; w.motes.push(m); m.x = -80; m.y = 0; m.h = Math.PI;
w.steer = { id: m.id, x: 90, y: 40, on: true, bite: false };
let best = 1e9; for (let i = 0; i < 400; i++) { S.step(w, 0.05); best = Math.min(best, Math.hypot(m.x - 90, m.y - 40)); }
ok('swims to the finger, even when it starts facing away', best < 10, 'closest ' + best.toFixed(1));
w.steer.on = false; for (let i = 0; i < 100; i++) S.step(w, 0.05); ok('stops when the finger lifts', m.v < 1, 'speed ' + m.v.toFixed(2));
const v = others[0]; w.motes.push(v); let bites = 0;
const put = () => { v.x = m.x + Math.cos(m.h) * (m.r + v.r - 1); v.y = m.y + Math.sin(m.h) * (m.r + v.r - 1); };
for (let i = 0; i < 60; i++) { put(); S.step(w, 0.05); if (m.actK >= 2) bites++; } ok('does not bite unless told', bites === 0);
w.steer.bite = true; for (let i = 0; i < 100 && !v.dead; i++) { put(); S.step(w, 0.05); if (m.actK >= 2) bites++; } ok('bites when Bite is held', bites > 0);
S.toggleFav(w, m); w.steer = { id: m.id, x: 0, y: -150, on: false, bite: false }; m.o.fill(0); for (let i = 0; i < 20; i++) S.step(w, 0.05); ok('an unstarred creature ignores steering', m.o[S.OUT.DIG] !== -1);
console.log(fails ? fails + ' FAILED' : 'ALL PASS');

// building and smells on order
{ const w = S.createWorld(182); w.noLog = true; w.events = false; for (let i = 0; i < 100; i++) S.step(w, 0.05);
  const m = w.motes[0]; S.toggleFav(w, m); w.motes.length = 0; w.motes.push(m); m.x = 0; m.y = 0; m.e = m.cap;
  for (const [k, name] of [[1, 'wall'], [2, 'farm'], [3, 'nest'], [4, 'granary']]) {
    m.x = -120 + k * 60; m.y = 20; m.h = 0; m.e = m.cap * 0.4; m.cdB = 0; w.steer = { id: m.id, x: 0, y: 0, on: false, bite: false, build: k, dig: false, smell: -1, did: '' };
    for (let i = 0; i < 60 && !w.steer.did; i++) S.step(w, 0.05);
    console.log((w.steer.did === name ? 'PASS ' : 'FAIL ') + 'builds a ' + name + ' on order, even below half energy');
  }
  w.steer = { id: m.id, x: 0, y: 0, on: false, bite: false, build: 0, dig: false, smell: 1, did: '' }; w.chem.forEach(c => c.fill(0));
  for (let i = 0; i < 40; i++) S.step(w, 0.05); const sum = k => w.chem[k].reduce((a, b) => a + b, 0);
  console.log((sum(1) > 0.5 && sum(0) === 0 && sum(2) === 0 ? 'PASS ' : 'FAIL ') + 'releases only the chosen smell'); }
