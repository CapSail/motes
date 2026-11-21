// a mote on one side of a wall must not see food on the other side
import * as S from '../sim.js';
const w = S.createWorld(3); w.events = false;
w.motes.length = 0; w.food.length = 0;
const probe = () => { // one grazer-ish mote
  const w2 = S.createWorld(3); return w2.motes.find(m => m.diet < 0.2); };
const proto = probe(); const m = S.cloneMote(w, proto); w.motes.length = 0; w.motes.push(m);
m.x = -80; m.y = 0; m.h = 0; m.e = m.cap * 0.3; m.senseR = 200; m.maxSp = 0;
w.food.push({ x: 40, y: 0, k: 0, e: 18, dead: false, age: 0 });
const idx = (x, y) => S.cidx(x, y);
const readFood = () => { for (let i = 0; i < 4; i++) S.step(w, 0.05); return m.inp[S.IN.PLANT_F]; };
const open = readFood();
for (let y = -300; y <= 300; y += 7) { const i = idx(-20, y); if (i >= 0) w.st[i] = 1; }
w.walls = 99; w.tStruct = 0;
const walled = readFood();
console.log('food ahead, open ground:', open.toFixed(2), ' with a wall between:', walled.toFixed(2), walled === 0 && open > 0 ? 'PASS' : 'CHECK');
