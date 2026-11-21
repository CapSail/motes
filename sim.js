// MOTES engine. Pure JS, no DOM. One world per page.
//
// What makes it deep, in one paragraph: every mote has a *brain*: a small recurrent neural net whose
// topology and weights are its genome (NEAT-style: nodes get added, connections get added/removed,
// crossover matches connections by innovation key). The brain reads ~45 senses (food, other motes, kin,
// walls, three chemical channels with gradients, temperature, toxin, light, its own energy, a clock) and
// drives 13 outputs: thrust, turn, bite, emit three chemicals, build wall/farm/nest/granary, dig,
// give-or-take energy, willingness to mate. Nobody wrote what the chemicals mean, what the granary is for,
// or whether taking energy from a neighbour is a good idea. Evolution decides.

export const R = 700;                    // dish radius
export const CELL = 14;                  // structure/field grid cell
export const GN = Math.ceil((2 * R) / CELL);
export const HS = 48;                    // spatial hash cell
export const HN = Math.ceil((2 * R) / HS) + 1;
export const DAY = 200;                  // seconds per day

// ---------- inputs / outputs ----------
export const IN = {
  BIAS: 0, ENERGY: 1, AGE: 2, SPEED: 3,
  PLANT_F: 4, PLANT_S: 5, MEAT_F: 6, MEAT_S: 7,
  MOTE_F: 8, MOTE_S: 9, MOTE_P: 10, MOTE_SIZE: 11, MOTE_KIN: 12, MOTE_DIET: 13, MOTE_E: 14,
  KIN_F: 15, KIN_S: 16, DENS: 17, KINCOUNT: 18,
  WALL_L: 19, WALL_F: 20, WALL_R: 21,
  ON_FARM: 22, ON_NEST: 23, ON_GRAN: 24, GRAN_STORE: 25,
  TEMP: 26, TOX: 27, LIGHT: 28, SICK: 29,
  CH_A: 30, CH_B: 31, CH_C: 32, GA_F: 33, GA_S: 34, GB_F: 35, GB_S: 36, GC_F: 37, GC_S: 38,
  CLOCK: 39, NOISE: 40, HURT: 41, CONTACT: 42, MOTE_ARMOR: 43, MOTE_BITE: 44,
  // social senses: family (parent/child +1, sibling +0.5), friendship (+) or grudge (-), direction to nearest friend / family
  MOTE_REL: 45, MOTE_FRIEND: 46, FRIEND_F: 47, FRIEND_S: 48, FAM_F: 49, FAM_S: 50, FAMCOUNT: 51,
};
export const NI = 52;
export const OUT = {
  THRUST: 0, TURN: 1, BITE: 2, EMIT_A: 3, EMIT_B: 4, EMIT_C: 5,
  B_WALL: 6, B_FARM: 7, B_NEST: 8, B_GRAN: 9, DIG: 10, XFER: 11, MATE: 12,
};
export const NO = 13;
const OUT_ID = 500;                      // output node ids are 500..512, hidden ids are >= 1000
export const IN_NAMES = Object.keys(IN).map(s => s.toLowerCase());
export const OUT_NAMES = Object.keys(OUT).map(s => s.toLowerCase());
const MAXH = 48, MAXC = 420;

// ---------- body genes ----------
export const B = {
  SIZE: 0, SPEED: 1, SENSE: 2, DIET: 3, ARMOR: 4, PHOTO: 5, REPRO: 6, INVEST: 7, MUT: 8, TPREF: 9,
  TTOL: 10, TOXR: 11, DISR: 12, HUE: 13, LOBES: 14, LIFE: 15, EFFIC: 16, FAT: 17, BRAINMUT: 18, MATURE: 19,
  // shape genes: a procedural squiggle (spine of segments, curl, wiggle, limbs). They change how it moves, too.
  SEGS: 20, LEN: 21, TAPER: 22, CURL: 23, WAMP: 24, WFREQ: 25, LIMBS: 26, LIMBLEN: 27,
  BOND: 28,   // how easily it makes friends
  // look genes: skin pattern, accent colour, antennae, tail fin
  PATTERN: 29, ACCENT: 30, ANTENNA: 31, FIN: 32,
  // smell genes: how strongly it is drawn to (above 0.5) or repelled by (below 0.5) each of the three scents
  SC_A: 33, SC_B: 34, SC_C: 35,
};
export const NB = 36;

// ---------- rng (seedable, serialisable) ----------
let RS = 1;
export function seedRng(s) { RS = (s | 0) || 1; }
export function rngState() { return RS; }
export function rand() {
  RS = (RS + 0x6D2B79F5) | 0;
  let t = Math.imul(RS ^ (RS >>> 15), 1 | RS);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function gauss() { let u = 0; while (!u) u = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand()); }
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
let INNOV = 1000;
export function innovState() { return INNOV; }

// ---------- names ----------
const SYL = ['bo', 'zu', 'mi', 'ka', 'lo', 'pi', 'ta', 'ne', 'gu', 'fi', 'ra', 'so', 'vi', 'wu', 'de', 'ya', 'qui', 'zo', 'mo', 'li', 'nu', 'be', 'cha', 'dro', 'fle', 'gri', 'sha', 'tri', 'plo', 'ski'];
export function petName() {
  const n = 2 + (rand() < 0.35 ? 1 : 0);
  let s = '';
  for (let i = 0; i < n; i++) s += SYL[(rand() * SYL.length) | 0];
  return s[0].toUpperCase() + s.slice(1);
}
const NOUNS_PLANT = ['Grazer', 'Nibbler', 'Muncher', 'Browser'];
const NOUNS_MEAT = ['Chomper', 'Stalker', 'Snapper', 'Hunter'];
const NOUNS_MIX = ['Scavenger', 'Forager', 'Rummager', 'Gleaner'];
const NOUNS_PHOTO = ['Bloomer', 'Sunsipper', 'Drifter', 'Leafling'];
function speciesName(g) {
  const b = g.b;
  const arr = b[B.PHOTO] > 0.6 ? NOUNS_PHOTO : b[B.DIET] > 0.62 ? NOUNS_MEAT : b[B.DIET] > 0.3 ? NOUNS_MIX : NOUNS_PLANT;
  return petName() + ' ' + arr[(rand() * arr.length) | 0];
}

// ---------- genome ----------
const ckey = (s, d) => s * 1000000 + d;
function cloneG(g) { return { b: Float32Array.from(g.b), h: g.h.slice(), c: g.c.map(c => ({ k: c.k, s: c.s, d: c.d, w: c.w })) }; }

// tiny wiring DSL for hand-made founders: nodes are numbers (inputs/outputs) or strings (hidden)
function wire(body, links) {
  const hid = new Map(), g = { b: Float32Array.from(body), h: [], c: [] };
  const idOf = n => {
    if (typeof n === 'number') return n;
    if (!hid.has(n)) { const id = INNOV++; hid.set(n, id); g.h.push(id); }
    return hid.get(n);
  };
  for (const [s, d, w] of links) { const S = idOf(s), D = idOf(d); g.c.push({ k: ckey(S, D), s: S, d: D, w }); }
  return g;
}
const O = k => OUT_ID + k;

function compile(g) {
  const nh = g.h.length, slot = new Map();
  for (let i = 0; i < NI; i++) slot.set(i, i);
  for (let j = 0; j < nh; j++) slot.set(g.h[j], NI + j);
  for (let o = 0; o < NO; o++) slot.set(OUT_ID + o, NI + nh + o);
  const cs = [];
  for (const c of g.c) { const a = slot.get(c.s), b = slot.get(c.d); if (a !== undefined && b !== undefined && b >= NI) cs.push([a, b, c.w]); }
  const nc = cs.length;
  const net = { nh, nc, src: new Int16Array(nc), dst: new Int16Array(nc), w: new Float32Array(nc), act: new Float32Array(NI + nh + NO), acc: new Float32Array(nh + NO) };
  for (let i = 0; i < nc; i++) { net.src[i] = cs[i][0]; net.dst[i] = cs[i][1]; net.w[i] = cs[i][2]; }
  return net;
}
function runBrain(net, inp) {
  const a = net.act, acc = net.acc, src = net.src, dst = net.dst, w = net.w, nc = net.nc;
  acc.fill(0);
  for (let i = 0; i < NI; i++) a[i] = inp[i];
  for (let c = 0; c < nc; c++) acc[dst[c] - NI] += w[c] * a[src[c]];
  const n = net.nh + NO;
  for (let j = 0; j < n; j++) a[NI + j] = Math.tanh(acc[j]);
}

const BODY_DIFF = [B.SIZE, B.SPEED, B.SENSE, B.DIET, B.ARMOR, B.PHOTO, B.EFFIC, B.TPREF, B.LIFE, B.FAT, B.SEGS, B.LEN, B.CURL, B.LIMBS, B.PATTERN, B.FIN];
function dist(a, b) {
  let bd = 0;
  for (let i = 0; i < BODY_DIFF.length; i++) bd += Math.abs(a.b[BODY_DIFF[i]] - b.b[BODY_DIFF[i]]);
  bd /= BODY_DIFF.length;
  let hd = Math.abs(a.b[B.HUE] - b.b[B.HUE]); hd = Math.min(hd, 1 - hd);
  const mb = new Map(); for (const c of b.c) mb.set(c.k, c.w);
  let match = 0, wd = 0;
  for (const c of a.c) { const w2 = mb.get(c.k); if (w2 !== undefined) { match++; wd += Math.abs(c.w - w2); } }
  const total = a.c.length + b.c.length - match || 1;
  const miss = 1 - match / total;
  return 1.6 * bd + 0.8 * hd + 0.7 * miss + (match ? 0.12 * (wd / match) : 0);
}
export const SPLIT = 0.42;

function mutateG(g) {
  const b = g.b, mu = b[B.MUT];
  for (let i = 0; i < NB; i++) {
    if (rand() < 0.2 * (0.5 + mu)) b[i] = clamp01(b[i] + gauss() * (0.03 + 0.09 * mu));
    if (rand() < 0.004 * (0.5 + mu)) b[i] = rand();
  }
  const bs = 0.4 + b[B.BRAINMUT] * 1.4, c = g.c;
  for (let i = 0; i < c.length; i++) {
    if (rand() < 0.22 * bs) c[i].w = clamp(rand() < 0.07 ? gauss() * 1.2 : c[i].w + gauss() * 0.3, -6, 6);
  }
  const nodes = () => { const arr = []; for (let i = 0; i < NI; i++) arr.push(i); for (const h of g.h) arr.push(h); return arr; };
  if (rand() < 0.12 * bs && c.length < MAXC) {            // add connection
    const srcs = nodes(), s = srcs[(rand() * srcs.length) | 0];
    const dsts = g.h.concat(Array.from({ length: NO }, (_, o) => OUT_ID + o));
    const d = dsts[(rand() * dsts.length) | 0], k = ckey(s, d);
    if (s !== d && !c.some(x => x.k === k)) c.push({ k, s, d, w: gauss() * 0.7 });
  }
  if (rand() < 0.05 * bs && c.length && g.h.length < MAXH && c.length < MAXC) {   // add node by splitting a connection
    const i = (rand() * c.length) | 0, old = c[i], id = INNOV++;
    g.h.push(id);
    c.splice(i, 1);
    c.push({ k: ckey(old.s, id), s: old.s, d: id, w: 1 }, { k: ckey(id, old.d), s: id, d: old.d, w: old.w });
  }
  if (rand() < 0.04 * bs && c.length > 4) c.splice((rand() * c.length) | 0, 1);  // remove connection
  if (g.h.length) {                                       // prune hidden nodes that lost all their links
    const used = new Set(); for (const x of c) { used.add(x.s); used.add(x.d); }
    g.h = g.h.filter(h => used.has(h));
  }
}
function cross(ga, gb) {
  const b = new Float32Array(NB);
  for (let i = 0; i < NB; i++) b[i] = rand() < 0.5 ? (rand() < 0.5 ? ga.b[i] : gb.b[i]) : (ga.b[i] + gb.b[i]) / 2;
  const mb = new Map(); for (const c of gb.c) mb.set(c.k, c);
  const out = [], seen = new Set();
  for (const c of ga.c) {
    seen.add(c.k); const o = mb.get(c.k);
    if (o) out.push({ k: c.k, s: c.s, d: c.d, w: rand() < 0.5 ? c.w : o.w });
    else if (rand() < 0.65) out.push({ k: c.k, s: c.s, d: c.d, w: c.w });
  }
  for (const c of gb.c) if (!seen.has(c.k) && rand() < 0.65) out.push({ k: c.k, s: c.s, d: c.d, w: c.w });
  if (out.length > MAXC) out.length = MAXC;
  const hs = new Set(); for (const c of out) { if (c.s >= 1000) hs.add(c.s); if (c.d >= 1000) hs.add(c.d); }
  let h = [...hs];
  if (h.length > MAXH) { h = h.slice(0, MAXH); const keep = new Set(h); return { b, h, c: out.filter(c => (c.s < 1000 || keep.has(c.s)) && (c.d < 1000 || keep.has(c.d))) }; }
  return { b, h, c: out };
}

// ---------- founders ----------
function bodyOf(o) {
  const b = new Float32Array(NB).fill(0.5);
  b[B.MUT] = 0.45; b[B.BRAINMUT] = 0.45; b[B.REPRO] = 0.4; b[B.INVEST] = 0.5; b[B.LIFE] = 0.5; b[B.MATURE] = 0.3; b[B.EFFIC] = 0.5;
  b[B.TOXR] = 0.15; b[B.DISR] = 0.2; b[B.ARMOR] = 0.1; b[B.PHOTO] = 0.0; b[B.FAT] = 0.4; b[B.TTOL] = 0.55;
  for (let k = 0; k < 3; k++) b[B.SC_A + k] = 0.5 + (rand() < 0.5 ? -1 : 1) * (0.25 + rand() * 0.25);
  for (const k in o) b[B[k]] = o[k];
  return b;
}
const WALLAVOID = [[IN.WALL_L, O(OUT.TURN), -1.6], [IN.WALL_R, O(OUT.TURN), 1.6], [IN.WALL_F, O(OUT.TURN), 1.4], [IN.WALL_F, O(OUT.THRUST), -0.7]];
const WANDER = [[IN.NOISE, O(OUT.TURN), 0.9]];
const MATEING = [[IN.ENERGY, O(OUT.MATE), 4.2], [IN.BIAS, O(OUT.MATE), -2.7]];
// family instincts: drift toward friends and family, and feed a hungry relative or friend who is touching me when I am full
const FAMILY = [
  [IN.FRIEND_S, O(OUT.TURN), 0.5], [IN.FAM_S, O(OUT.TURN), 0.5], [IN.FRIEND_F, O(OUT.THRUST), 0.25],
  [IN.MOTE_REL, 'care', 2.5], [IN.MOTE_FRIEND, 'care', 1.5], [IN.ENERGY, 'care', 2.2], [IN.CONTACT, 'care', 1.5], [IN.MOTE_E, 'care', -2.4], [IN.BIAS, 'care', -4.4], ['care', O(OUT.XFER), 2.2],
];
function grazer(hue) {
  return wire(bodyOf({ SIZE: 0.35, SPEED: 0.4, SENSE: 0.45, DIET: 0.04, HUE: hue, SEGS: 0.45, LEN: 0.4, TAPER: 0.6, CURL: 0.5, WAMP: 0.4, WFREQ: 0.4, LIMBS: 0.25, LIMBLEN: 0.4, PATTERN: 0.3, ACCENT: 0.3, ANTENNA: 0.3, FIN: 0.2 }), [
    [IN.BIAS, O(OUT.THRUST), 0.3], [IN.PLANT_F, O(OUT.THRUST), 1.3], [IN.ENERGY, O(OUT.THRUST), -0.6],
    [IN.PLANT_S, O(OUT.TURN), 2.3], [IN.KIN_S, O(OUT.TURN), 0.45],
    ...WANDER, ...WALLAVOID, ...MATEING, ...FAMILY,
    [IN.MOTE_P, 'fl', 2.0], [IN.MOTE_DIET, 'fl', 2.6], [IN.BIAS, 'fl', -3.1],                 // a hungry-looking neighbour close by
    ['fl', 'tl', 2.6], [IN.MOTE_S, 'tl', 2.6], [IN.BIAS, 'tl', -2.6],
    ['fl', 'tr', 2.6], [IN.MOTE_S, 'tr', -2.6], [IN.BIAS, 'tr', -2.6],
    ['tl', O(OUT.TURN), -2.6], ['tr', O(OUT.TURN), 2.6], ['fl', O(OUT.THRUST), 1.3],
  ]);
}
function hunter(hue) {
  return wire(bodyOf({ SIZE: 0.7, SPEED: 0.62, SENSE: 0.6, DIET: 0.92, ARMOR: 0.25, HUE: hue, REPRO: 0.3, SEGS: 0.75, LEN: 0.85, TAPER: 0.85, CURL: 0.5, WAMP: 0.75, WFREQ: 0.7, LIMBS: 0.1, LIMBLEN: 0.3, PATTERN: 0.6, ACCENT: 0.8, ANTENNA: 0.1, FIN: 0.8 }), [
    [IN.BIAS, O(OUT.THRUST), 0.25], [IN.MEAT_F, O(OUT.THRUST), 0.9], [IN.MEAT_S, O(OUT.TURN), 1.8],
    ...WANDER, ...WALLAVOID, ...MATEING,
    [IN.MOTE_P, 'hu', 2.2], [IN.MOTE_KIN, 'hu', -1.6], [IN.MOTE_SIZE, 'hu', -1.3], [IN.BIAS, 'hu', -1.1],
    ['hu', 'hl', 2.4], [IN.MOTE_S, 'hl', 2.6], [IN.BIAS, 'hl', -2.6],
    ['hu', 'hr', 2.4], [IN.MOTE_S, 'hr', -2.6], [IN.BIAS, 'hr', -2.6],
    ['hl', O(OUT.TURN), 2.4], ['hr', O(OUT.TURN), -2.4], ['hu', O(OUT.THRUST), 1.1],
    [IN.CONTACT, O(OUT.BITE), 1.8], [IN.MOTE_KIN, O(OUT.BITE), -1.9], [IN.BIAS, O(OUT.BITE), -0.7],
  ]);
}
function weaver(hue) {
  return wire(bodyOf({ SIZE: 0.4, SPEED: 0.35, SENSE: 0.5, DIET: 0.05, HUE: hue, FAT: 0.7, SEGS: 0.35, LEN: 0.25, TAPER: 0.3, CURL: 0.5, WAMP: 0.3, WFREQ: 0.3, LIMBS: 0.85, LIMBLEN: 0.7, PATTERN: 0.9, ACCENT: 0.5, ANTENNA: 0.9, FIN: 0.1 }), [
    [IN.BIAS, O(OUT.THRUST), 0.25], [IN.PLANT_F, O(OUT.THRUST), 1.2], [IN.PLANT_S, O(OUT.TURN), 2.2], [IN.KIN_S, O(OUT.TURN), 0.4],
    ...WANDER, ...WALLAVOID, ...MATEING,
    [IN.ENERGY, O(OUT.B_NEST), 4.4], [IN.BIAS, O(OUT.B_NEST), -3.3],
    [IN.ENERGY, O(OUT.B_FARM), 4.4], [IN.BIAS, O(OUT.B_FARM), -3.4],
    [IN.ENERGY, O(OUT.B_WALL), 4.4], [IN.BIAS, O(OUT.B_WALL), -3.5], [IN.WALL_F, O(OUT.B_WALL), 1.0],
    [IN.ENERGY, O(OUT.B_GRAN), 4.2], [IN.BIAS, O(OUT.B_GRAN), -3.5],
    ...FAMILY,
    [IN.ON_GRAN, 'sv', 3.0], [IN.ENERGY, 'sv', 3.2], [IN.BIAS, 'sv', -4.6], ['sv', O(OUT.XFER), 2.2],      // on a granary and full: stock it
    [IN.ON_GRAN, 'wd', 3.0], [IN.ENERGY, 'wd', -3.6], [IN.BIAS, 'wd', -0.4], ['wd', O(OUT.XFER), -2.2],   // on a granary and hungry: withdraw
  ]);
}
function scavenger(hue) {
  return wire(bodyOf({ SIZE: 0.45, SPEED: 0.5, SENSE: 0.6, DIET: 0.5, HUE: hue, SEGS: 0.6, LEN: 0.55, TAPER: 0.5, CURL: 0.92, WAMP: 0.55, WFREQ: 0.55, LIMBS: 0.5, LIMBLEN: 0.5, PATTERN: 0.75, ACCENT: 0.15, ANTENNA: 0.6, FIN: 0.4 }), [
    [IN.BIAS, O(OUT.THRUST), 0.3], [IN.MEAT_F, O(OUT.THRUST), 1.0], [IN.PLANT_F, O(OUT.THRUST), 0.7],
    [IN.MEAT_S, O(OUT.TURN), 2.2], [IN.PLANT_S, O(OUT.TURN), 1.1], [IN.KIN_S, O(OUT.TURN), 0.3],
    ...WANDER, ...WALLAVOID, ...MATEING,
  ]);
}
function drifter(hue) {
  return wire(bodyOf({ SIZE: 0.55, SPEED: 0.12, SENSE: 0.25, DIET: 0.0, PHOTO: 0.92, HUE: hue, LIFE: 0.7, SEGS: 0.2, LEN: 0.15, TAPER: 0.2, CURL: 0.4, WAMP: 0.15, WFREQ: 0.2, LIMBS: 1, LIMBLEN: 0.9, PATTERN: 0.1, ACCENT: 0.6, ANTENNA: 0.0, FIN: 0.95 }), [
    [IN.BIAS, O(OUT.THRUST), -0.4], [IN.PLANT_F, O(OUT.THRUST), 0.5], [IN.ENERGY, O(OUT.THRUST), -0.4],
    ...WANDER, ...WALLAVOID, ...MATEING, [IN.LIGHT, O(OUT.MATE), 0.0],
  ]);
}
function wild(hue) {
  const body = bodyOf({ SIZE: 0.2 + rand() * 0.6, SPEED: 0.2 + rand() * 0.6, SENSE: 0.3 + rand() * 0.5, DIET: rand(), HUE: hue, PHOTO: rand() * 0.3, SEGS: rand(), LEN: rand(), TAPER: rand(), CURL: rand(), WAMP: rand(), WFREQ: rand(), LIMBS: rand(), LIMBLEN: rand(), PATTERN: rand(), ACCENT: rand(), ANTENNA: rand(), FIN: rand() });
  const links = [...WALLAVOID, ...MATEING, [IN.BIAS, O(OUT.THRUST), 0.3]];
  const ins = [IN.PLANT_F, IN.PLANT_S, IN.MEAT_F, IN.MEAT_S, IN.MOTE_F, IN.MOTE_S, IN.MOTE_P, IN.KIN_S, IN.CH_A, IN.CH_B, IN.GA_S, IN.CLOCK, IN.NOISE];
  const outs = [OUT.THRUST, OUT.TURN, OUT.BITE, OUT.EMIT_A, OUT.EMIT_B, OUT.B_NEST, OUT.XFER];
  for (let i = 0; i < 14; i++) links.push([ins[(rand() * ins.length) | 0], O(outs[(rand() * outs.length) | 0]), gauss() * 1.2]);
  links.push([IN.PLANT_S, O(OUT.TURN), 1.6], [IN.PLANT_F, O(OUT.THRUST), 0.8]);
  const seen = new Set(), uniq = [];
  for (const l of links) { const k = l[0] + ':' + l[1]; if (!seen.has(k) || l[2] === 0) { seen.add(k); uniq.push(l); } }
  return wire(body, uniq);
}

// ---------- world ----------
export function createWorld(seed = 1) {
  seedRng(seed); INNOV = 1000;
  const N = GN * GN;
  const w = {
    ver: 1, t: 0, tick: 0, nextId: 1, nextSp: 1,
    motes: [], food: [], species: new Map(),
    st: new Uint8Array(N), hp: new Uint8Array(N), store: new Float32Array(N),
    heat: new Float32Array(N), tox: new Float32Array(N),
    chem: [new Float32Array(N), new Float32Array(N), new Float32Array(N)],
    light: 1, tempEv: 0, tempEvLeft: 0, evTimer: 150, bloom: 0, thinkMask: 1,
    log: [], keep: [], lastYear: 0, snap: null, hist: [], fame: {}, favs: [], milestones: {},
    byId: new Map(),
    counters: { friends: 0, grudges: 0, famGifts: 0, inbred: 0, devoted: 0, births: 0, deaths: 0, kills: 0, built: 0, sexual: 0, asexual: 0, newSpecies: 0, extinct: 0, plagues: 0, dug: 0, stolen: 0, shared: 0, stored: 0 },
    maxPop: 600, foodMax: 1500, fert: 1, events: true, mercy: false,
    tFood: 0, tStruct: 0, tField: 0, tSample: 0, sick: 0, plagueDead: 0, plagueOn: false,
    hash: { mh: new Int32Array(HN * HN), mn: new Int32Array(4096), fh: new Int32Array(HN * HN), fn: new Int32Array(8192) },
    stats: { pop: 0, species: 0 }, tmp: { stCount: 0 },
  };
  for (let gy = 0; gy < GN; gy++) for (let gx = 0; gx < GN; gx++) {
    const cx = (gx + 0.5) * CELL - R, cy = (gy + 0.5) * CELL - R;
    if (Math.hypot(cx, cy) > R - CELL * 0.3) w.st[gy * GN + gx] = 255;
  }
  for (let i = 0; i < 700; i++) spawnFood(w, null, null, 0, 18);
  const founders = [
    [grazer, 20], [hunter, 8], [weaver, 14], [scavenger, 12], [drifter, 12], [wild, 8],
  ];
  let hue = rand();
  for (const [fn, count] of founders) {
    hue = (hue + 0.17 + rand() * 0.1) % 1;
    const g = fn(hue);
    const sp = newSpecies(w, g, 0);
    for (let i = 0; i < count; i++) {
      const gg = cloneG(g);
      if (i > 0) mutateG(gg);
      gg.b[B.HUE] = clamp01(hue + (rand() - 0.5) * 0.04);
      const a = rand() * 6.283, d = Math.sqrt(rand()) * (R - 60);
      const m = makeMote(w, gg, Math.cos(a) * d, Math.sin(a) * d, 0, 0);
      m.sp = sp.id; m.e = m.cap * (0.5 + rand() * 0.3); m.age = rand() * m.life * 0.2;
    }
  }
  log(w, 'The dish is seeded. Six kinds of life, ' + w.motes.length + ' motes.', 'life');
  sample(w);
  return w;
}

// ---------- motes ----------
function derive(m) {
  const b = m.g.b;
  m.r = 2.8 + b[B.SIZE] * 6.2;
  m.maxSp = 12 + b[B.SPEED] * 55;
  // sight/hunting range is now long (50-240); smell (food) reaches a further 50% beyond that
  m.senseR = 50 + b[B.SENSE] * 190;
  m.aff = [(b[B.SC_A] - 0.5) * 2, (b[B.SC_B] - 0.5) * 2, (b[B.SC_C] - 0.5) * 2];
  m.diet = b[B.DIET]; m.armor = b[B.ARMOR]; m.photo = b[B.PHOTO];
  m.cap = 50 + m.r * 16 + b[B.FAT] * 60;
  m.life = 140 + b[B.LIFE] * 340;
  m.matureAge = m.life * (0.05 + 0.2 * b[B.MATURE]);
  m.thr = m.cap * (0.55 + 0.4 * b[B.REPRO]);
  m.invest = 0.25 + 0.5 * b[B.INVEST];
  m.intake = 0.7 + 0.6 * b[B.EFFIC];
  m.plantEff = (1 - m.diet * 0.92) * (1 - m.photo * 0.35);
  m.meatEff = 0.08 + 0.92 * m.diet;
  m.tpref = (b[B.TPREF] - 0.5) * 1.2; m.ttol = 0.15 + b[B.TTOL] * 0.6;
  m.toxr = b[B.TOXR]; m.disr = b[B.DISR];
  m.basal = (0.28 + m.r * 0.09 + m.armor * m.r * 0.12 + m.photo * 0.25 + m.toxr * 0.15 + m.disr * 0.12) * (0.8 + 0.5 * b[B.EFFIC]);
  m.hue = b[B.HUE]; m.lobes = 3 + Math.floor(b[B.LOBES] * 5.99);
  // shape -> physics: long bodies run fast but turn slowly, limbs turn well but cost drag, a strong wiggle swims cheaply
  m.segs = 2 + Math.floor(b[B.SEGS] * 7.99); m.lenF = 0.5 + b[B.LEN]; m.taper = b[B.TAPER]; m.curl = (b[B.CURL] - 0.5) * 2;
  m.wamp = b[B.WAMP]; m.wfreq = b[B.WFREQ]; m.limbs = Math.floor(b[B.LIMBS] * 4.99); m.limbLen = b[B.LIMBLEN];
  m.maxSp *= 0.85 + 0.4 * b[B.LEN];
  m.turnRate = 4.5 * (1.25 - 0.5 * b[B.LEN]) * (0.8 + 0.1 * m.limbs);
  m.mvMul = (1.25 - 0.5 * m.wamp) * (1 + 0.08 * m.limbs * (0.5 + m.limbLen));
  // looks with small consequences: a tail fin makes swimming cheaper, antennae see a bit further but cost a little to keep
  m.pat = Math.floor(b[B.PATTERN] * 3.99); m.accent = (m.hue + 0.25 + b[B.ACCENT] * 0.5) % 1;
  m.ant = Math.floor(b[B.ANTENNA] * 3.99); m.fin = b[B.FIN];
  m.mvMul *= 1.08 - 0.22 * m.fin; m.senseR *= (1 + 0.05 * m.ant) * (1 + 0.15 * m.diet); m.basal += 0.025 * m.ant + 0.05 * m.fin;
}
function makeMote(w, g, x, y, e, gen) {
  const m = {
    id: w.nextId++, name: petName(), g, net: null, o: null, inp: new Float32Array(NI),
    x, y, h: rand() * 6.283, v: 0, e, age: 0, gen, sp: 0, par: 0, anc: [], kids: 0, kills: 0, fav: false,
    pa: 0, pb: 0, fr: new Map(),
    dead: false, why: '', sick: 0, imm: 0, lt: w.t, cdB: 0, cdD: 0, cdA: rand() * 4, hurt: 0, killer: 0,
    r: 0, maxSp: 0, senseR: 0, diet: 0, armor: 0, photo: 0, cap: 0, life: 0, matureAge: 0, thr: 0, invest: 0, intake: 1,
    aff: [0, 0, 0], rt: 0, rth: 0, plantEff: 1, meatEff: 1, tpref: 0, ttol: 0, toxr: 0, disr: 0, basal: 0, hue: 0, lobes: 3, bcost: 0,
    pat: 0, accent: 0.5, ant: 0, fin: 0, segs: 4, lenF: 1, taper: 0.5, curl: 0, wamp: 0.5, wfreq: 0.5, limbs: 0, limbLen: 0.5, turnRate: 4.5, mvMul: 1, ph: rand() * 6.28,
  };
  derive(m); setBrain(m);
  m.e = e || m.cap * 0.4;
  w.motes.push(m);
  return m;
}
function setBrain(m) {
  m.net = compile(m.g);
  m.o = m.net.act.subarray(NI + m.net.nh, NI + m.net.nh + NO);
  m.bcost = 0.0045 * m.net.nc + 0.012 * m.net.nh;
}

// ---------- species ----------
function newSpecies(w, g, parentSp) {
  const sp = { id: w.nextSp++, name: speciesName(g), hue: g.b[B.HUE], rep: cloneG(g), count: 0, peak: 0, born: w.t, ext: 0, par: parentSp };
  w.species.set(sp.id, sp);
  return sp;
}
function assignSpecies(w, c, hint) {
  const sp = w.species.get(hint);
  if (sp && dist(c.g, sp.rep) < SPLIT) { c.sp = hint; return; }
  let best = null, bd = SPLIT;
  for (const s of w.species.values()) { if (s.ext || s === sp) continue; const d = dist(c.g, s.rep); if (d < bd) { bd = d; best = s; } }
  if (best) { c.sp = best.id; return; }
  const ns = newSpecies(w, c.g, hint);
  c.sp = ns.id; w.counters.newSpecies++;
  if (!w.noLog) log(w, `New species: ${ns.name}` + (sp ? ` (split from ${sp.name})` : ''), 'species');
}

// ---------- food ----------
function spawnFood(w, x, y, k, e) {
  if (w.food.length >= w.foodMax + 600) return null;
  if (x === null) {
    if (w.food.length && rand() < 0.6) {
      const p = w.food[(rand() * w.food.length) | 0];
      x = p.x + gauss() * 22; y = p.y + gauss() * 22;
    } else { const a = rand() * 6.283, d = Math.sqrt(rand()) * (R - 10); x = Math.cos(a) * d; y = Math.sin(a) * d; }
  }
  if (x * x + y * y > (R - 6) * (R - 6)) return null;
  const f = { x, y, k, e, dead: false, age: 0 };
  w.food.push(f);
  return f;
}

// ---------- helpers ----------
export function cidx(x, y) {
  const gx = Math.floor((x + R) / CELL), gy = Math.floor((y + R) / CELL);
  if (gx < 0 || gy < 0 || gx >= GN || gy >= GN) return -1;
  return gy * GN + gx;
}
function solidAt(w, x, y) { const i = cidx(x, y); if (i < 0) return true; const s = w.st[i]; return s === 1 || s === 255; }
export const YEAR = 365 * DAY;
const KEEP = new Set(['first', 'year', 'fav']);
export function log(w, text, kind) {
  const e = { t: w.t, text, kind: kind || 'info' };
  if (KEEP.has(e.kind)) { w.keep.push(e); if (w.keep.length > 400) w.keep.splice(0, 50); return; }   // the big moments are never pushed out
  w.log.push(e);
  if (w.log.length > 220) w.log.splice(0, w.log.length - 180);
}
export function allLog(w) { return w.keep.concat(w.log).sort((a, b) => a.t - b.t); }
function yearReview(w) {
  const c = w.counters, s = w.snap || { newSpecies: 0, extinct: 0, births: 0, kills: 0, friends: 0 };
  let top = null; for (const sp of w.species.values()) if (sp.count > 0 && (!top || sp.count > top.count)) top = sp;
  const f = w.fame, bits = [];
  bits.push(`population ${w.motes.length}, ${w.stats.species} species alive`);
  bits.push(`${c.newSpecies - s.newSpecies} species born, ${c.extinct - s.extinct} went extinct`);
  bits.push(`${c.births - s.births} births, ${c.kills - s.kills} kills, ${c.friends - s.friends} friendships`);
  if (top) bits.push(`the ${top.name}s lead with ${top.count}`);
  if (f.gen) bits.push(`deepest line: generation ${Math.round(f.gen.val)}`);
  log(w, `Year ${w.lastYear} in review: ${bits.join('; ')}.`, 'year');
  w.snap = { newSpecies: c.newSpecies, extinct: c.extinct, births: c.births, kills: c.kills, friends: c.friends };
}
function milestone(w, key, text) { if (!w.milestones[key]) { w.milestones[key] = w.t; log(w, text, 'first'); } }
function infect(w, m) {
  if (m.sick > 0 || m.imm > 0 || m.dead) return;
  m.sick = 18 + rand() * 22; w.sick++;
  if (!w.plagueOn) { w.plagueOn = true; w.plagueDead = 0; }
}

function kill(w, m, why, killer) {
  if (m.dead) return false;
  if (w.mercy && (why === 'starved' || why === 'old age') && w.motes.length - w.deadN < 14) { m.e = m.cap * 0.5; m.age *= 0.6; return false; }
  m.dead = true; m.why = why; m.killer = killer || 0; w.deadN++;
  w.counters.deaths++;
  if (m.sick > 0) { w.sick--; w.plagueDead++; }
  if (why !== 'eaten') {
    const total = 0.35 * (Math.max(0, m.e) + m.r * 7), n = 1 + Math.floor(m.r / 3.2);
    for (let i = 0; i < n; i++) spawnFood(w, m.x + gauss() * 4, m.y + gauss() * 4, 1, total / n);
  }
  if (m.fav) noteFavDead(w, m);
  fameUpdate(w, m);
  return true;
}
function noteFavDead(w, m) {
  const f = w.favs.find(f => f.id === m.id);
  if (f) { f.alive = false; f.why = m.why; f.age = m.age; f.kids = m.kids; f.gen = m.gen; f.t = w.t; }
  log(w, `★ ${m.name} has died (${m.why}) at age ${Math.round(m.age)}s with ${m.kids} children.`, 'fav');
}
function fameUpdate(w, m) {
  const f = w.fame;
  const rec = (key, val, label) => { if (!f[key] || val > f[key].val) f[key] = { val, name: m.name, sp: m.sp, label: label || '' , t: w.t }; };
  rec('oldest', m.age); rec('kids', m.kids); rec('kills', m.kills); rec('brain', m.net.nc + m.net.nh * 2); rec('gen', m.gen);
}

// ---------- the tick ----------
export function step(w, dt) {
  w.t += dt; w.tick++; w.deadN = 0;
  const motes = w.motes, food = w.food, H = w.hash;
  w.light = clamp(0.78 + 0.55 * Math.sin((w.t * 2 * Math.PI) / DAY - 1.2), 0.15, 1.4);
  const tempG = w.tempEv * (w.tempEvLeft > 0 ? Math.min(1, w.tempEvLeft / 15) : 0) + 0.12 * Math.sin((w.t * 2 * Math.PI) / DAY);
  w.tempG = tempG;
  if (w.tempEvLeft > 0) w.tempEvLeft -= dt;

  // hashes
  if (H.mn.length < motes.length + 64) H.mn = new Int32Array((motes.length + 64) * 2);
  if (H.fn.length < food.length + 64) H.fn = new Int32Array((food.length + 64) * 2);
  H.mh.fill(-1); H.fh.fill(-1);
  w.byId.clear();
  for (let i = 0; i < motes.length; i++) {
    const m = motes[i]; if (m.dead) continue;
    w.byId.set(m.id, m);
    const c = Math.floor((m.y + R) / HS) * HN + Math.floor((m.x + R) / HS);
    H.mn[i] = H.mh[c]; H.mh[c] = i;
  }
  for (let i = 0; i < food.length; i++) {
    const f = food[i]; if (f.dead) continue;
    const c = Math.floor((f.y + R) / HS) * HN + Math.floor((f.x + R) / HS);
    H.fn[i] = H.fh[c]; H.fh[c] = i;
  }

  const n = motes.length, mask = w.thinkMask;
  for (let i = 0; i < n; i++) {
    const m = motes[i]; if (m.dead) continue;
    m.age += dt;
    if (((w.tick + m.id) & mask) === 0) { const dtt = w.t - m.lt; m.lt = w.t; think(w, m, i, dtt > 0 ? dtt : dt); if (m.dead) continue; }
    body(w, m, dt, tempG);
  }

  // births / deaths bookkeeping
  if (w.deadN) { let j = 0; for (let i = 0; i < motes.length; i++) if (!motes[i].dead) motes[j++] = motes[i]; motes.length = j; }
  let fj = 0, fdead = 0;
  for (let i = 0; i < food.length; i++) { const f = food[i]; if (f.k === 1) { f.age += dt; f.e -= dt * 0.16; if (f.e <= 0.5) f.dead = true; } if (f.dead) fdead++; }
  if (fdead) { for (let i = 0; i < food.length; i++) if (!food[i].dead) food[fj++] = food[i]; food.length = fj; }

  // slow world systems
  w.tFood += dt; if (w.tFood >= 0.5) { growFood(w, w.tFood); w.tFood = 0; }
  w.tStruct += dt; if (w.tStruct >= 1) { structures(w, w.tStruct); w.tStruct = 0; }
  w.tField += dt; if (w.tField >= 0.25) { fields(w, w.tField); w.tField = 0; }
  w.tSample += dt; if (w.tSample >= 5) { sample(w); w.tSample = 0; }
  if (w.events) { w.evTimer -= dt; if (w.evTimer <= 0) { w.evTimer = 100 + rand() * 180; randomEvent(w); } }
  if (w.plagueOn && w.sick <= 0) { w.plagueOn = false; if (!w.noLog && w.plagueDead > 0) log(w, `The plague has burned out. ${w.plagueDead} motes died.`, 'event'); w.sick = 0; }
}

function body(w, m, dt, tempG) {
  const o = m.o;
  // steering and motion
  m.h += clamp(o[OUT.TURN] + m.rt, -1.5, 1.5) * m.turnRate * dt;
  const target = clamp(o[OUT.THRUST] + m.rth, 0, 1) * m.maxSp;
  m.v += (target - m.v) * Math.min(1, dt * 4);
  const ch = Math.cos(m.h), sh = Math.sin(m.h);
  let nx = m.x + ch * m.v * dt, ny = m.y + sh * m.v * dt;
  if (solidAt(w, nx, m.y)) nx = m.x;
  if (solidAt(w, nx, ny)) ny = m.y;
  const rr = nx * nx + ny * ny, lim = (R - m.r - 2);
  if (rr > lim * lim) { const k = lim / Math.sqrt(rr); nx *= k; ny *= k; m.h += 0.5; }
  if (solidAt(w, nx, ny)) {                  // a wall was built on top of us: step out
    for (let a = 0; a < 8; a++) { const px = nx + Math.cos(a * 0.785) * CELL, py = ny + Math.sin(a * 0.785) * CELL; if (!solidAt(w, px, py)) { nx = px; ny = py; break; } }
  }
  m.x = nx; m.y = ny;

  // metabolism
  const idx = cidx(m.x, m.y);
  let drain = m.basal + 0.00025 * m.v * m.v * m.r * m.mvMul + 0.0012 * m.senseR + m.bcost;
  if (o[OUT.BITE] > 0.3) drain += 0.3;
  const em = Math.max(0, o[OUT.EMIT_A]) + Math.max(0, o[OUT.EMIT_B]) + Math.max(0, o[OUT.EMIT_C]);
  drain += 0.12 * em;
  let gain = 0;
  if (m.photo > 0.05) gain += m.photo * w.light * m.r * m.r * 0.052;
  if (idx >= 0) {
    const tx = w.tox[idx];
    if (tx > 0.05) { drain += tx * 7 * (1 - m.toxr * 0.9); m.hurt = 1; m.why2 = 'toxin'; }
    const T = tempG + w.heat[idx], d = Math.abs(T - m.tpref) - m.ttol;
    if (d > 0) { drain += d * 6; m.why2 = T > m.tpref ? 'heat' : 'cold'; }
    if (w.st[idx] === 3) { gain += 0.75; drain *= 0.8; }
  }
  if (m.sick > 0) {
    drain += 1.5 * (1 - m.disr * 0.8); m.sick -= dt; m.why2 = 'plague';
    if (m.sick <= 0) { m.imm = 45; w.sick--; }
  } else if (m.imm > 0) m.imm -= dt;
  if (m.hurt > 0) m.hurt -= dt * 2;
  m.e += (gain - drain) * dt;
  if (m.e > m.cap) m.e = m.cap;
  if (m.e <= 0) { kill(w, m, m.why2 || 'starved'); if (!m.dead) m.why2 = ''; else return; }
  if (m.age > m.life) kill(w, m, 'old age');
}

function think(w, m, i, dtt) {
  const motes = w.motes, food = w.food, H = w.hash, inp = m.inp;
  inp.fill(0);
  const ch = Math.cos(m.h), sh = Math.sin(m.h), s = m.senseR, s2 = s * s;
  const sm = s * 1.5, sm2 = sm * sm;           // smell: food is noticed from further away than motes are seen
  const x0 = Math.max(0, Math.floor((m.x + R - sm) / HS)), x1 = Math.min(HN - 1, Math.floor((m.x + R + sm) / HS));
  const y0 = Math.max(0, Math.floor((m.y + R - sm) / HS)), y1 = Math.min(HN - 1, Math.floor((m.y + R + sm) / HS));
  let bp = -1, bpd = 1e9, bm = -1, bmd = 1e9, bn = -1, bnd = 1e9, bk = -1, bkd = 1e9, count = 0, kin = 0;
  const infectR = m.sick > 0 ? (m.r + 8) : 0;
  let bfm = -1, bfmd = 1e9, fam = 0, bfr = -1, bfrd = 1e9;
  const hasFr = m.fr.size > 0;
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
    const c = cy * HN + cx;
    for (let f = H.fh[c]; f >= 0; f = H.fn[f]) {
      const fo = food[f]; if (fo.dead) continue;
      const dx = fo.x - m.x, dy = fo.y - m.y, d2 = dx * dx + dy * dy; if (d2 > sm2) continue;
      if (fo.k === 0) { if (d2 < bpd) { bpd = d2; bp = f; } } else if (d2 < bmd) { bmd = d2; bm = f; }
    }
    for (let q = H.mh[c]; q >= 0; q = H.mn[q]) {
      if (q === i) continue;
      const o = motes[q]; if (o.dead) continue;
      const dx = o.x - m.x, dy = o.y - m.y, d2 = dx * dx + dy * dy; if (d2 > s2) continue;
      count++;
      const same = o.sp === m.sp;
      if (same) { kin++; if (d2 < bkd) { bkd = d2; bk = q; } }
      if (d2 < bnd) { bnd = d2; bn = q; }
      if (relOf(m, o) > 0) { fam++; if (d2 < bfmd) { bfmd = d2; bfm = q; } }
      if (hasFr) { const s = m.fr.get(o.id); if (s > 0.2 && d2 < bfrd) { bfrd = d2; bfr = q; } }
      if (infectR && d2 < (infectR + o.r) * (infectR + o.r) && rand() < 0.5 * dtt * (1 - o.disr * 0.85)) infect(w, o);
    }
  }
  // -- inputs
  inp[IN.BIAS] = 1;
  inp[IN.ENERGY] = m.e / m.cap; inp[IN.AGE] = m.age / m.life; inp[IN.SPEED] = m.v / m.maxSp;
  const polar = (ox, oy, d2, fi, si, rng) => {
    const d = Math.sqrt(d2) || 1, prox = 1 - d / (rng || s), dx = ox - m.x, dy = oy - m.y;
    inp[fi] = ((dx * ch + dy * sh) / d) * prox; inp[si] = ((dy * ch - dx * sh) / d) * prox;
    return prox;
  };
  if (bp >= 0) polar(food[bp].x, food[bp].y, bpd, IN.PLANT_F, IN.PLANT_S, sm);
  if (bm >= 0) polar(food[bm].x, food[bm].y, bmd, IN.MEAT_F, IN.MEAT_S, sm);
  let tgt = null, tgtD2 = 0;
  if (bn >= 0) {
    const o = motes[bn]; tgt = o; tgtD2 = bnd;
    inp[IN.MOTE_P] = polar(o.x, o.y, bnd, IN.MOTE_F, IN.MOTE_S);
    inp[IN.MOTE_SIZE] = clamp(o.r / m.r - 1, -1, 1);
    inp[IN.MOTE_KIN] = o.sp === m.sp ? 1 : -1;
    inp[IN.MOTE_DIET] = o.diet * 2 - 1;
    inp[IN.MOTE_E] = o.e / o.cap;
    inp[IN.MOTE_ARMOR] = o.armor;
    inp[IN.MOTE_BITE] = o.o[OUT.BITE] > 0.3 ? 1 : 0;
    if (bnd < (m.r + o.r + 3) * (m.r + o.r + 3)) inp[IN.CONTACT] = 1; else tgt = null;
  }
  if (bk >= 0) polar(motes[bk].x, motes[bk].y, bkd, IN.KIN_F, IN.KIN_S);
  if (bfm >= 0) polar(motes[bfm].x, motes[bfm].y, bfmd, IN.FAM_F, IN.FAM_S);
  if (bfr >= 0) polar(motes[bfr].x, motes[bfr].y, bfrd, IN.FRIEND_F, IN.FRIEND_S);
  inp[IN.FAMCOUNT] = Math.min(1, fam / 4);
  if (bn >= 0) { const o = motes[bn]; inp[IN.MOTE_REL] = relOf(m, o); inp[IN.MOTE_FRIEND] = m.fr.get(o.id) || 0; }
  inp[IN.DENS] = Math.min(1, count / 8); inp[IN.KINCOUNT] = Math.min(1, kin / 8);
  const ray = (a) => {
    const cx = Math.cos(m.h + a), cy = Math.sin(m.h + a);
    if (solidAt(w, m.x + cx * CELL, m.y + cy * CELL)) return 1;
    return solidAt(w, m.x + cx * CELL * 2.2, m.y + cy * CELL * 2.2) ? 0.5 : 0;
  };
  inp[IN.WALL_L] = ray(0.75); inp[IN.WALL_F] = ray(0); inp[IN.WALL_R] = ray(-0.75);
  const idx = cidx(m.x, m.y);
  const stHere = idx >= 0 ? w.st[idx] : 0;
  inp[IN.ON_FARM] = stHere === 2 ? 1 : 0; inp[IN.ON_NEST] = stHere === 3 ? 1 : 0; inp[IN.ON_GRAN] = stHere === 4 ? 1 : 0;
  if (stHere === 4) inp[IN.GRAN_STORE] = Math.min(1, w.store[idx] / 100);
  if (idx >= 0) {
    inp[IN.TEMP] = clamp((w.tempG + w.heat[idx] - m.tpref) / (m.ttol + 0.3), -1.5, 1.5);
    inp[IN.TOX] = w.tox[idx];
    for (let k = 0; k < 3; k++) {
      const arr = w.chem[k];
      inp[IN.CH_A + k] = Math.tanh(arr[idx] * 2);
      const fx = cidx(m.x + ch * 9, m.y + sh * 9), bx = cidx(m.x - ch * 9, m.y - sh * 9);
      const lx = cidx(m.x - sh * 9, m.y + ch * 9), rx = cidx(m.x + sh * 9, m.y - ch * 9);
      inp[IN.GA_F + k * 2] = Math.tanh(((fx >= 0 ? arr[fx] : 0) - (bx >= 0 ? arr[bx] : 0)) * 6);
      inp[IN.GA_S + k * 2] = Math.tanh(((lx >= 0 ? arr[lx] : 0) - (rx >= 0 ? arr[rx] : 0)) * 6);
    }
    // innate smell reflex (independent of the brain, added to steering): sniff three cells out and a bit further,
    // be drawn to scents it likes and pushed away from ones it dislikes; everybody flees toxin
    let rt = 0, rth = 0;
    const sniff = (arr, dist) => {
      const f = cidx(m.x + ch * dist, m.y + sh * dist), l = cidx(m.x - sh * dist, m.y + ch * dist), r = cidx(m.x + sh * dist, m.y - ch * dist);
      const here = arr[idx], ahead = f >= 0 ? arr[f] : 0;
      return [ahead - here, (l >= 0 ? arr[l] : 0) - (r >= 0 ? arr[r] : 0), here + ahead];
    };
    for (let k = 0; k < 3; k++) {
      const a = m.aff[k]; if (a > -0.12 && a < 0.12) continue;
      const arr = w.chem[k];
      let tf = 0, ts = 0, tot = 0;
      for (let q = 1; q <= 2; q++) { const [gf, gs, c] = sniff(arr, q * 26); tf += gf; ts += gs; tot += c; }
      if (tot < 0.01) continue;
      const side = Math.tanh(ts * 5), fwd = Math.tanh(tf * 5);
      // drawn: turn toward the stronger side, speed up while it gets stronger, turn around when it is behind
      // repelled: the opposite
      const bad = Math.max(0, a > 0 ? -fwd : fwd);
      rt += a * side * 1.9 + (m.id & 1 ? 1 : -1) * Math.abs(a) * bad * 1.2;
      rth += a * fwd * 1.2 + Math.abs(a) * 0.25 * Math.tanh(tot);
    }
    const tgx = sniff(w.tox, 26);
    if (tgx[2] > 0.01) {
      const fear = 1.4 * (1 - m.toxr * 0.6), side = Math.tanh(tgx[1] * 6), fwd = Math.tanh(tgx[0] * 6);
      rt += -fear * side * 1.4 + (fwd > 0 ? (m.id & 1 ? 1 : -1) * fwd * fear : 0);
      rth += fear * 0.5 - fear * fwd * 0.6;
    }
    // temperature: head toward the warmth or cold it prefers, shy away from what is too hot or too cold for it
    {
      const T = w.tempG - m.tpref, hv = w.heat, d = 26;
      const f = cidx(m.x + ch * d, m.y + sh * d), l = cidx(m.x - sh * d, m.y + ch * d), r = cidx(m.x + sh * d, m.y - ch * d);
      const bad0 = Math.abs(T + hv[idx]);
      const vf = f >= 0 ? Math.abs(T + hv[f]) : bad0, vl = l >= 0 ? Math.abs(T + hv[l]) : bad0, vr = r >= 0 ? Math.abs(T + hv[r]) : bad0;
      const dis = clamp((bad0 - m.ttol * 0.4) / 0.5, 0, 1), sc = 0.35 + 0.65 * dis;
      const fwd = Math.tanh((bad0 - vf) * 6), side = Math.tanh((vr - vl) * 6);
      if (Math.abs(fwd) + Math.abs(side) > 0.05 || dis > 0) {
        rt += sc * (side * 1.2 + (m.id & 1 ? 1 : -1) * Math.max(0, -fwd) * 0.9);
        rth += sc * fwd * 0.6 + dis * 0.3;
      }
    }
    m.rt = clamp(rt, -1.5, 1.5); m.rth = clamp(rth, -1, 1);
  } else { m.rt = 0; m.rth = 0; }
  inp[IN.LIGHT] = w.light - 0.6; inp[IN.SICK] = m.sick > 0 ? 1 : 0;
  inp[IN.CLOCK] = Math.sin(w.t * 0.9 + (m.id % 7)); inp[IN.NOISE] = rand() * 2 - 1;
  inp[IN.HURT] = m.hurt > 0 ? 1 : 0;

  runBrain(m.net, inp);
  const o = m.o;

  // -- friendships: spending time near a non-hostile mote builds a bond; being bitten or drained makes a grudge; bonds fade
  if (bn >= 0) {
    const o = motes[bn];
    if (bnd < (m.r + o.r + 24) * (m.r + o.r + 24) && m.fr.get(o.id) !== -1) {
      if (m.hurt > 0.3 && o.o[OUT.BITE] > 0.3 && inp[IN.CONTACT] === 1) grudge(w, m, o); else bump(w, m, o, 0.09 * dtt * (0.5 + 0.8 * m.g.b[B.BOND]));
    }
  }
  if (m.fr.size) for (const [id, s] of m.fr) {
    if (!w.byId.has(id)) { m.fr.delete(id); continue; }
    const ns = s * (1 - 0.012 * dtt) + (s < 0 ? 0.004 * dtt : 0);
    if (Math.abs(ns) < 0.05) m.fr.delete(id); else m.fr.set(id, ns);
  }
  // -- eating
  if (m.e < m.cap) {
    if (bp >= 0 && bpd < (m.r + 3) * (m.r + 3) && m.plantEff > 0.05) {
      const f = food[bp]; f.dead = true; m.e = Math.min(m.cap, m.e + f.e * m.intake * m.plantEff);
    }
    if (bm >= 0 && bmd < (m.r + 3) * (m.r + 3) && !food[bm].dead && m.meatEff > 0.1) {
      const f = food[bm]; f.dead = true; m.e = Math.min(m.cap, m.e + f.e * m.intake * m.meatEff);
    }
  }
  // -- bite
  if (tgt && o[OUT.BITE] > 0.3 && !tgt.dead) {
    const p = clamp(1.5 + (m.r - tgt.r) * 0.28 - tgt.armor * 2.2 + (m.maxSp - tgt.maxSp) / 45, 0, 3) * dtt;
    if (rand() < p) {
      const gainE = (tgt.e * 0.5 + tgt.r * 6) * Math.max(0.15, m.meatEff) * m.intake;
      m.e = Math.min(m.cap, m.e + gainE); m.kills++; w.counters.kills++;
      if (kill(w, tgt, 'eaten', m.id)) { milestone(w, 'kill', `First kill: ${m.name} caught ${tgt.name}.`); if (tgt.sp === m.sp) milestone(w, 'cannibal', `Cannibalism! ${m.name} ate one of its own kind.`); }
    } else { m.e -= 0.4; tgt.hurt = 1; grudge(w, tgt, m); }
  }
  if (m.dead) return;
  // -- give / take energy
  const xf = o[OUT.XFER];
  if (xf > 0.25 || xf < -0.25) {
    if (stHere === 4 && !tgt) {
      if (xf > 0) { const a = Math.min(Math.max(0, m.e - m.cap * 0.25), 8 * xf * dtt, 250 - w.store[idx]); if (a > 0) { w.store[idx] += a; m.e -= a; w.counters.stored += a; milestone(w, 'granary', `${m.name} stocked a granary: hoarding has begun.`); } }
      else { const a = Math.min(w.store[idx], 8 * -xf * dtt, m.cap - m.e); if (a > 0) { w.store[idx] -= a; m.e += a * 0.92; } }
    } else if (tgt) {
      if (xf > 0) { const a = Math.min(m.e * 0.5, 6 * xf * dtt); if (a > 0 && tgt.e < tgt.cap) { m.e -= a; tgt.e = Math.min(tgt.cap, tgt.e + a * 0.9); w.counters.shared += a; bump(w, m, tgt, 0.25); bump(w, tgt, m, 0.25); if (relOf(m, tgt) > 0) { w.counters.famGifts += a; milestone(w, 'family', `${m.name} fed a hungry relative (${tgt.name}). Family care has begun.`); } else if (tgt.sp === m.sp) milestone(w, 'share', `${m.name} shared energy with a neighbour: cooperation.`); } }
      else { const a = Math.min(tgt.e * 0.3, 2.6 * -xf * dtt * (1 - tgt.armor * 0.7), m.cap - m.e); if (a > 0) { tgt.e -= a; m.e += a * 0.5; m.e -= 0.35 * dtt; tgt.hurt = 1; grudge(w, tgt, m); w.counters.stolen += a; milestone(w, 'parasite', `${m.name} is draining a neighbour: a parasite.`); } }
    }
  }
  // -- chemistry
  if (idx >= 0) for (let k = 0; k < 3; k++) { const e = o[OUT.EMIT_A + k]; if (e > 0.05) w.chem[k][idx] = Math.min(3, w.chem[k][idx] + e * 1.2 * dtt); }
  // -- build and dig
  m.cdB -= dtt; m.cdD -= dtt;
  if (m.cdB <= 0 && idx >= 0 && w.stCount < 3200) {
    let bt = 0, best = 0.5;
    for (let k = 0; k < 4; k++) if (o[OUT.B_WALL + k] > best) { best = o[OUT.B_WALL + k]; bt = k + 1; }
    if (bt) {
      const cost = [0, 9, 13, 16, 12][bt];
      if (m.e > cost * 2.5) {
        let ti = idx;
        if (bt === 1) ti = cidx(m.x + ch * (m.r + CELL * 0.7), m.y + sh * (m.r + CELL * 0.7));
        if (ti >= 0) {
          const cur = w.st[ti];
          if (cur === bt && w.hp[ti] < 255 && w.hp[ti] > 0) { w.hp[ti] = Math.min(250, w.hp[ti] + 60); m.e -= cost * 0.4; m.cdB = 2; }
          else if (cur === 0) {
            w.st[ti] = bt; w.hp[ti] = 200; m.e -= cost; m.cdB = 3; w.counters.built++; w.stCount++;
            milestone(w, 'build' + bt, `First ${['', 'wall', 'farm', 'nest', 'granary'][bt]} built by ${m.name}.`);
          } else m.cdB = 1;
        }
      }
    }
  }
  if (m.cdD <= 0 && o[OUT.DIG] > 0.5 && idx >= 0) {
    const ti = cidx(m.x + ch * (m.r + CELL * 0.7), m.y + sh * (m.r + CELL * 0.7));
    if (ti >= 0 && w.st[ti] > 0 && w.st[ti] < 255) { w.st[ti] = 0; w.hp[ti] = 0; w.counters.dug++; m.e -= 1; m.cdD = 1.2; w.stCount--; milestone(w, 'dig', `${m.name} tore down a structure.`); }
  }
  // -- reproduction
  m.cdA -= dtt;
  if (o[OUT.MATE] > 0 && m.age > m.matureAge && m.e >= m.thr && w.motes.length < w.maxPop) {
    const t = bn >= 0 ? motes[bn] : null;
    if (t && !t.dead && t.id > m.id && t.sp === m.sp && inp[IN.CONTACT] === 1 && t.o[OUT.MATE] > 0 && t.age > t.matureAge && t.e >= t.thr * 0.9) {
      const ca = m.e * (0.25 + 0.5 * m.g.b[B.INVEST]) * 0.5, cb = t.e * (0.25 + 0.5 * t.g.b[B.INVEST]) * 0.5;
      m.e -= ca; t.e -= cb;
      birth(w, m, t, (ca + cb) * 0.85);
    } else if (o[OUT.MATE] > 0.8 && m.e >= m.cap * 0.92 && m.cdA <= 0) {
      const ca = m.e * m.invest * 0.6; m.e -= ca; m.cdA = 8 + rand() * 6;
      birth(w, m, null, ca * 0.8);
    }
  }
}

// ---------- families and friendships ----------
// relation: parent/child 1, sibling 0.5, otherwise 0. Friendship is each mote's own memory (max 4), strength +1 friend, -1 grudge.
export function relOf(m, o) {
  if (o.id === m.pa || o.id === m.pb || m.id === o.pa || m.id === o.pb) return 1;
  if ((m.pa && (m.pa === o.pa || m.pa === o.pb)) || (m.pb && (m.pb === o.pa || m.pb === o.pb))) return 0.5;
  return 0;
}
function bump(w, m, o, amt) {
  const cur = m.fr.get(o.id) || 0;
  if (cur < 0 && amt < 0.2) return;
  const ns = Math.min(1, cur + amt);
  if (!m.fr.has(o.id) && m.fr.size >= 4) {            // full address book: drop the weakest friend
    let wid = 0, wv = 9; for (const [id, s] of m.fr) { const v = s < 0 ? 5 + Math.abs(s) : s; if (v < wv) { wv = v; wid = id; } }
    if (wv >= ns) return; m.fr.delete(wid);
  }
  m.fr.set(o.id, ns);
  if (cur < 0.7 && ns >= 0.7) {
    w.counters.friends++;
    if (m.fr.get(o.id) >= 0.7 && o.fr.get(m.id) >= 0.7) milestone(w, 'friends', `${m.name} and ${o.name} have become best friends.`);
  }
}
function grudge(w, m, o) {
  if ((m.fr.get(o.id) || 0) < -0.5) { m.fr.set(o.id, -1); return; }
  if (!m.fr.has(o.id) && m.fr.size >= 4) { let wid = 0, wv = 9; for (const [id, s] of m.fr) { const v = s < 0 ? 5 + Math.abs(s) : s; if (v < wv) { wv = v; wid = id; } } m.fr.delete(wid); }
  if ((m.fr.get(o.id) || 0) >= 0) w.counters.grudges++;
  m.fr.set(o.id, -1);
  if (relOf(m, o) > 0) milestone(w, 'betray', `${o.name} hurt its own relative ${m.name}. Family betrayal.`);
}

function birth(w, pa, pb, energy) {
  const g = pb ? cross(pa.g, pb.g) : cloneG(pa.g);
  mutateG(g);
  const a = rand() * 6.283, d = pa.r + 3;
  let x = pa.x + Math.cos(a) * d, y = pa.y + Math.sin(a) * d;
  if (x * x + y * y > (R - 8) * (R - 8) || solidAt(w, x, y)) { x = pa.x; y = pa.y; }
  const idx = cidx(x, y);
  if (idx >= 0 && w.st[idx] === 3) energy *= 1.25;
  if (pb) {
    if (relOf(pa, pb) > 0) { energy *= 0.6; w.counters.inbred++; milestone(w, 'inbred', `${pa.name} mated with a close relative. The child is weak.`); }
    else if ((pa.fr.get(pb.id) || 0) > 0.5) { energy *= 1.15; w.counters.devoted++; milestone(w, 'pair', `${pa.name} and ${pb.name} are a bonded pair with a child.`); }
  }
  const c = makeMote(w, g, x, y, energy, Math.max(pa.gen, pb ? pb.gen : 0) + 1);
  c.par = pa.id; c.pa = pa.id; c.pb = pb ? pb.id : 0; c.anc = [pa.name].concat(pa.anc).slice(0, 3);
  c.fr.set(pa.id, 0.6); pa.fr.size < 4 && pa.fr.set(c.id, 0.6); if (pb) { c.fr.set(pb.id, 0.6); pb.fr.size < 4 && pb.fr.set(c.id, 0.6); }
  if (pb) pb.kids++; pa.kids++;
  assignSpecies(w, c, pa.sp);
  w.counters.births++; pb ? w.counters.sexual++ : w.counters.asexual++;
  if (pb) milestone(w, 'sex', 'The first mating: two parents, one child, mixed brains.');
  if (c.net.nh > 0) milestone(w, 'hidden', `A brain grew a new neuron (${c.name}). Brains are getting more complex.`);
}

// ---------- slow systems ----------
function growFood(w, dt) {
  const rate = 26 * w.fert * w.light * (w.bloom > 0 ? 3 : 1);
  const room = w.foodMax - w.food.length;
  if (w.bloom > 0) w.bloom -= dt;
  let n = rate * dt, k = 0;
  while (n > 0 && k < room) { if (n >= 1 || rand() < n) spawnFood(w, null, null, 0, 18); n -= 1; k++; }
}
function structures(w, dt) {
  const N = GN * GN, st = w.st, hp = w.hp;
  let count = 0;
  for (let i = 0; i < N; i++) {
    const t = st[i]; if (t === 0 || t === 255) continue;
    count++;
    if (hp[i] < 255) {
      const v = hp[i] - 2.2 * dt;
      if (v <= 0) { if (t === 4 && w.store[i] > 0) { const n = Math.min(10, Math.ceil(w.store[i] / 18)); for (let q = 0; q < n; q++) spawnFood(w, (i % GN + 0.5) * CELL - R + gauss() * 4, Math.floor(i / GN) * CELL + CELL / 2 - R + gauss() * 4, 0, 18); w.store[i] = 0; } st[i] = 0; hp[i] = 0; count--; }
      else hp[i] = v;
    }
    if (t === 2 && w.food.length < w.foodMax && rand() < 0.16 * w.light * dt) spawnFood(w, (i % GN + 0.5) * CELL - R + (rand() - 0.5) * CELL, Math.floor(i / GN) * CELL + CELL / 2 - R + (rand() - 0.5) * CELL, 0, 18);
  }
  w.stCount = count;
}
function fields(w, dt) {
  const N = GN * GN, heat = w.heat, tox = w.tox, ch = w.chem;
  const dh = Math.exp(-0.012 * dt), dtx = Math.exp(-0.03 * dt), dc = Math.exp(-0.16 * dt);
  for (let i = 0; i < N; i++) { heat[i] *= dh; tox[i] *= dtx; }
  for (let k = 0; k < 3; k++) {
    const a = ch[k]; let any = false;
    for (let i = 0; i < N; i++) { if (a[i] > 0.002) { any = true; break; } }
    if (!any) continue;
    const tmp = w.tmpArr || (w.tmpArr = new Float32Array(N));
    for (let y = 1; y < GN - 1; y++) for (let x = 1; x < GN - 1; x++) {
      const i = y * GN + x;
      tmp[i] = (a[i] * 0.5 + (a[i - 1] + a[i + 1] + a[i - GN] + a[i + GN]) * 0.125) * dc;
    }
    for (let i = 0; i < N; i++) a[i] = tmp[i] < 0.002 ? 0 : tmp[i];
  }
  // toxin spreads a little as well
  if (w.tick % 8 === 0) {
    const tmp = w.tmpArr || (w.tmpArr = new Float32Array(N));
    for (let y = 1; y < GN - 1; y++) for (let x = 1; x < GN - 1; x++) { const i = y * GN + x; tmp[i] = tox[i] * 0.6 + (tox[i - 1] + tox[i + 1] + tox[i - GN] + tox[i + GN]) * 0.1; }
    for (let i = 0; i < N; i++) tox[i] = tmp[i] < 0.01 ? 0 : tmp[i];
  }
}
function sample(w) {
  for (const s of w.species.values()) s.count = 0;
  let sumR = 0, sumDiet = 0, sumC = 0, sumH = 0, sumPhoto = 0, builders = 0;
  const ms = w.motes;
  for (const m of ms) {
    const s = w.species.get(m.sp); if (s) s.count++;
    sumR += m.r; sumDiet += m.diet; sumC += m.net.nc; sumH += m.net.nh; sumPhoto += m.photo;
    if (m.fav) { const f = w.favs.find(f => f.id === m.id); if (f) { f.age = m.age; f.kids = m.kids; f.gen = m.gen; } }
    const f = w.fame;
    const rec = (key, val) => { if (!f[key] || val > f[key].val) f[key] = { val, name: m.name, sp: m.sp, t: w.t }; };
    rec('oldest', m.age); rec('kids', m.kids); rec('kills', m.kills); rec('brain', m.net.nc + m.net.nh * 2); rec('gen', m.gen);
  }
  let alive = 0;
  for (const s of w.species.values()) {
    if (s.count > s.peak) s.peak = s.count;
    if (s.count > 0) { alive++; s.ext = 0; }
    else if (!s.ext && w.t - s.born > 20) { s.ext = w.t; w.counters.extinct++; if (!w.noLog) log(w, `Extinct: ${s.name} (peak ${s.peak}).`, 'species'); }
  }
  // prune very old extinct species
  if (w.species.size > 260) { for (const [id, s] of w.species) { if (s.ext && w.species.size > 200 && !ms.some(m => m.sp === id) && !isParent(w, id)) w.species.delete(id); } }
  const n = ms.length || 1;
  w.stats = { pop: ms.length, species: alive, food: w.food.length, r: sumR / n, diet: sumDiet / n, conns: sumC / n, hid: sumH / n, photo: sumPhoto / n, struct: w.stCount || 0, sick: w.sick };
  w.hist.push([w.t, ms.length, alive, sumC / n, sumDiet / n, w.stCount || 0]);
  const yr = Math.floor(w.t / YEAR);
  if (yr > w.lastYear) { w.lastYear = yr; if (!w.noLog) yearReview(w); }
  if (w.hist.length > 300) w.hist.shift();
}
function isParent(w, id) { for (const s of w.species.values()) if (s.par === id && !s.ext) return true; return false; }

function randomEvent(w) {
  const pick = rand();
  if (pick < 0.25) { w.bloom = 45; log(w, 'A bloom: food is booming.', 'event'); }
  else if (pick < 0.42) { w.tempEv = -0.8; w.tempEvLeft = 70; log(w, 'A cold snap.', 'event'); }
  else if (pick < 0.59) { w.tempEv = 0.8; w.tempEvLeft = 70; log(w, 'A heatwave.', 'event'); }
  else if (pick < 0.78) { if (w.motes.length > 40) { for (let i = 0; i < 4; i++) infect(w, w.motes[(rand() * w.motes.length) | 0]); w.counters.plagues++; log(w, 'A plague has started.', 'event'); } }
  else { const a = rand() * 6.283, d = Math.sqrt(rand()) * (R - 150); paint(w, 'toxin', Math.cos(a) * d, Math.sin(a) * d, 90, 1); log(w, 'A toxic spill.', 'event'); }
}

// ---------- player tools ----------
export function paint(w, tool, x, y, rad, dt) {
  const gx0 = Math.floor((x - rad + R) / CELL), gx1 = Math.floor((x + rad + R) / CELL);
  const gy0 = Math.floor((y - rad + R) / CELL), gy1 = Math.floor((y + rad + R) / CELL);
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    if (gx < 0 || gy < 0 || gx >= GN || gy >= GN) continue;
    const cx = (gx + 0.5) * CELL - R, cy = (gy + 0.5) * CELL - R, d = Math.hypot(cx - x, cy - y);
    if (d > rad) continue;
    const i = gy * GN + gx, f = 1 - d / rad;
    switch (tool) {
      case 'heat': w.heat[i] = Math.min(1.6, w.heat[i] + 1.2 * dt * f); break;
      case 'cold': w.heat[i] = Math.max(-1.6, w.heat[i] - 1.2 * dt * f); break;
      case 'toxin': w.tox[i] = Math.min(1, w.tox[i] + 2 * dt * f + (dt >= 1 ? 1 : 0)); break;
      case 'wall': case 'farm': case 'nest': case 'granary': {
        if (w.st[i] === 255) break;
        const t = { wall: 1, farm: 2, nest: 3, granary: 4 }[tool];
        if (w.st[i] === 0) w.stCount = (w.stCount || 0) + 1;
        w.st[i] = t; w.hp[i] = 255; break;
      }
      case 'erase': if (w.st[i] > 0 && w.st[i] < 255) { w.st[i] = 0; w.hp[i] = 0; w.store[i] = 0; w.stCount--; } w.tox[i] = 0; w.heat[i] = 0; for (let k = 0; k < 3; k++) w.chem[k][i] = 0; break;
      case 'chemA': w.chem[0][i] = Math.min(3, w.chem[0][i] + 3 * dt * f); break;
      case 'chemB': w.chem[1][i] = Math.min(3, w.chem[1][i] + 3 * dt * f); break;
      case 'chemC': w.chem[2][i] = Math.min(3, w.chem[2][i] + 3 * dt * f); break;
    }
  }
  if (tool === 'food') { const n = Math.max(1, Math.round(30 * dt * (rad / 40))); for (let i = 0; i < n; i++) { const a = rand() * 6.283, d = Math.sqrt(rand()) * rad; spawnFood(w, x + Math.cos(a) * d, y + Math.sin(a) * d, 0, 18); } }
  if (tool === 'erase') { for (const f of w.food) if (Math.hypot(f.x - x, f.y - y) < rad) f.dead = true; }
  if (tool === 'smite' || tool === 'plague') {
    for (const m of w.motes) if (!m.dead && Math.hypot(m.x - x, m.y - y) < rad) {
      if (tool === 'plague') { infect(w, m); if (!w.plagueTold) { w.plagueTold = true; w.counters.plagues++; } } else kill(w, m, 'smitten');
    }
    if (tool === 'smite' && w.deadN) { let j = 0; for (let i = 0; i < w.motes.length; i++) if (!w.motes[i].dead) w.motes[j++] = w.motes[i]; w.motes.length = j; w.deadN = 0; }
  }
}
export function cleanFood(w) { let j = 0; for (let i = 0; i < w.food.length; i++) if (!w.food[i].dead) w.food[j++] = w.food[i]; w.food.length = j; }
export function spark(w, x, y) {
  const g = rand() < 0.5 ? wild(rand()) : [grazer, hunter, weaver, scavenger, drifter][(rand() * 5) | 0](rand());
  const m = makeMote(w, g, x, y, 0, 0);
  const ns = newSpecies(w, g, 0); m.sp = ns.id; m.e = m.cap * 0.8;
  log(w, `A spark of new life: ${ns.name}.`, 'life');
  return m;
}
export function cloneMote(w, m) {
  const g = cloneG(m.g); mutateG(g);
  const c = makeMote(w, g, m.x + 8, m.y + 8, m.cap * 0.5, m.gen + 1);
  c.par = m.id; c.anc = [m.name].concat(m.anc).slice(0, 3); m.kids++; assignSpecies(w, c, m.sp);
  return c;
}
export function feedMote(m) { m.e = m.cap; }
export function toggleFav(w, m) {
  m.fav = !m.fav;
  if (m.fav) w.favs.push({ id: m.id, name: m.name, sp: m.sp, hue: m.hue, alive: true, age: m.age, kids: m.kids, gen: m.gen });
  else w.favs = w.favs.filter(f => f.id !== m.id);
}
export function startPlague(w, n = 5) { if (w.motes.length) { for (let i = 0; i < n; i++) infect(w, w.motes[(rand() * w.motes.length) | 0]); w.counters.plagues++; } }
export function triggerEvent(w, kind) {
  if (kind === 'bloom') { w.bloom = 45; log(w, 'You called a bloom.', 'event'); }
  if (kind === 'cold') { w.tempEv = -0.8; w.tempEvLeft = 70; log(w, 'You called a cold snap.', 'event'); }
  if (kind === 'heat') { w.tempEv = 0.8; w.tempEvLeft = 70; log(w, 'You called a heatwave.', 'event'); }
}

// ---------- seeing a brain ----------
export function brainView(m) {
  const g = m.g, nh = g.h.length, slot = new Map();
  const ins = new Set(), outs = new Set();
  for (const c of g.c) { if (c.s < NI) ins.add(c.s); if (c.d >= OUT_ID && c.d < 1000) outs.add(c.d - OUT_ID); }
  const nodes = [];
  for (const i of [...ins].sort((a, b) => a - b)) nodes.push({ id: i, kind: 'in', label: IN_NAMES[i], slot: i });
  g.h.forEach((h, j) => nodes.push({ id: h, kind: 'hid', label: 'h' + (j + 1), slot: NI + j }));
  for (const o of [...outs].sort((a, b) => a - b)) nodes.push({ id: OUT_ID + o, kind: 'out', label: OUT_NAMES[o], slot: NI + nh + o });
  nodes.forEach(n => slot.set(n.id, n));
  const edges = g.c.filter(c => slot.has(c.s) && slot.has(c.d)).map(c => ({ a: slot.get(c.s), b: slot.get(c.d), w: c.w }));
  return { nodes, edges, act: m.net.act };
}

// ---------- save / load ----------
function u8b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); }
function b64u8(s) { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
const q8 = (f, scale, off = 0) => { const u = new Uint8Array(f.length); for (let i = 0; i < f.length; i++) u[i] = clamp(Math.round(f[i] * scale + off), 0, 255); return u; };
const f8 = (u, scale, off = 0) => { const f = new Float32Array(u.length); for (let i = 0; i < u.length; i++) f[i] = (u[i] - off) / scale; return f; };
function packG(g) { return { b: u8b64(q8(g.b, 255)), h: g.h, c: g.c.map(c => [c.s, c.d, Math.round(c.w * 1000) / 1000]) }; }
function unpackG(p) { let b = f8(b64u8(p.b), 255); if (b.length < NB) { const nb = new Float32Array(NB).fill(0.5); nb.set(b); for (let i = b.length; i < NB; i++) nb[i] = i >= B.SC_A ? 0.5 + (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.25) : 0.2 + ((i * 37) % 60) / 100; b = nb; } return { b, h: p.h.slice(), c: p.c.map(([s, d, w]) => ({ k: ckey(s, d), s, d, w })) }; }

export function serialize(w) {
  return JSON.stringify({
    v: 1, t: w.t, tick: w.tick, rng: RS, innov: INNOV, nextId: w.nextId, nextSp: w.nextSp,
    light: w.light, tempEv: w.tempEv, tempEvLeft: w.tempEvLeft, evTimer: w.evTimer, bloom: w.bloom,
    maxPop: w.maxPop, foodMax: w.foodMax, fert: w.fert, events: w.events,
    counters: w.counters, milestones: w.milestones, fame: w.fame, favs: w.favs, log: w.log.slice(-120), keep: w.keep.slice(-300), lastYear: w.lastYear, snap: w.snap, hist: w.hist,
    sick: w.sick, plagueOn: w.plagueOn, plagueDead: w.plagueDead,
    st: u8b64(w.st), hp: u8b64(w.hp), store: u8b64(q8(w.store, 1)), heat: u8b64(q8(w.heat, 100, 128)), tox: u8b64(q8(w.tox, 255)),
    chem: w.chem.map(c => u8b64(q8(c, 80))),
    food: w.food.map(f => [Math.round(f.x), Math.round(f.y), f.k, Math.round(f.e)]),
    species: [...w.species.values()].map(s => ({ id: s.id, name: s.name, hue: s.hue, rep: packG(s.rep), peak: s.peak, born: s.born, ext: s.ext, par: s.par })),
    motes: w.motes.map(m => ({ i: m.id, n: m.name, g: packG(m.g), x: Math.round(m.x * 10) / 10, y: Math.round(m.y * 10) / 10, h: Math.round(m.h * 100) / 100, e: Math.round(m.e * 10) / 10, a: Math.round(m.age * 10) / 10, gen: m.gen, sp: m.sp, p: m.par, pa: m.pa, pb: m.pb, fr: [...m.fr].map(([id, s]) => [id, Math.round(s * 100) / 100]), an: m.anc, k: m.kids, kl: m.kills, f: m.fav ? 1 : 0, sk: Math.round(m.sick * 10) / 10, im: Math.round(m.imm) })),
  });
}
export function deserialize(str) {
  const d = JSON.parse(str);
  const w = createWorld(1);                     // allocates grids; then we overwrite everything
  w.motes.length = 0; w.food.length = 0; w.species.clear(); w.log.length = 0;
  RS = d.rng | 0 || 1; INNOV = d.innov || 1000;
  Object.assign(w, { t: d.t, tick: d.tick, nextId: d.nextId, nextSp: d.nextSp, light: d.light, tempEv: d.tempEv, tempEvLeft: d.tempEvLeft, evTimer: d.evTimer, bloom: d.bloom, maxPop: d.maxPop, foodMax: d.foodMax, fert: d.fert, events: d.events, counters: Object.assign(w.counters, d.counters), milestones: d.milestones, fame: d.fame, favs: d.favs, log: d.log, keep: d.keep || [], lastYear: d.lastYear != null ? d.lastYear : Math.floor(d.t / YEAR), snap: d.snap || null, hist: d.hist, sick: d.sick, plagueOn: d.plagueOn, plagueDead: d.plagueDead });
  w.st.set(b64u8(d.st)); w.hp.set(b64u8(d.hp)); w.store.set(f8(b64u8(d.store), 1));
  w.heat.set(f8(b64u8(d.heat), 100, 128)); w.tox.set(f8(b64u8(d.tox), 255));
  d.chem.forEach((c, k) => w.chem[k].set(f8(b64u8(c), 80)));
  let sc = 0; for (let i = 0; i < w.st.length; i++) if (w.st[i] > 0 && w.st[i] < 255) sc++;
  w.stCount = sc;
  for (const f of d.food) w.food.push({ x: f[0], y: f[1], k: f[2], e: f[3], dead: false, age: 0 });
  for (const s of d.species) w.species.set(s.id, { id: s.id, name: s.name, hue: s.hue, rep: unpackG(s.rep), count: 0, peak: s.peak, born: s.born, ext: s.ext, par: s.par });
  for (const p of d.motes) {
    const m = makeMote(w, unpackG(p.g), p.x, p.y, p.e, p.gen);
    m.id = p.i; m.name = p.n; m.h = p.h; m.age = p.a; m.sp = p.sp; m.par = p.p; m.pa = p.pa || 0; m.pb = p.pb || 0; m.fr = new Map(p.fr || []); m.anc = p.an; m.kids = p.k; m.kills = p.kl; m.fav = !!p.f; m.sick = p.sk; m.imm = p.im; m.e = p.e; m.lt = w.t;
  }
  w.nextId = Math.max(w.nextId, d.nextId);
  w.deadN = 0; sample(w);
  return w;
}

// ---------- offline catch-up (called by UI in slices) ----------
export function beginCatchUp(w, awaySec) {
  const simSec = Math.min(awaySec * 0.25, 2400);
  const dt = 0.5, ticks = Math.floor(simSec / dt);
  return { w, ticks, done: 0, dt, simSec, before: { pop: w.motes.length, species: new Set(w.motes.map(m => m.sp)), counters: Object.assign({}, w.counters), speciesIds: new Set(w.species.keys()), extinct: w.counters.extinct } };
}
export function runCatchUp(cu, budgetMs) {
  const w = cu.w, t0 = Date.now();
  w.mercy = true; w.noLog = false; w.thinkMask = 0;
  while (cu.done < cu.ticks && Date.now() - t0 < budgetMs) { step(w, cu.dt); cu.done++; if (!w.motes.length) { cu.done = cu.ticks; break; } }
  w.mercy = false; w.thinkMask = 1;
  return cu.done >= cu.ticks;
}
export function catchUpReport(cu) {
  const w = cu.w, b = cu.before, c = w.counters, bc = b.counters;
  let newSp = 0; for (const id of w.species.keys()) if (!b.speciesIds.has(id)) newSp++;
  return { simSec: cu.simSec, popBefore: b.pop, popAfter: w.motes.length, births: c.births - bc.births, deaths: c.deaths - bc.deaths, kills: c.kills - bc.kills, built: c.built - bc.built, newSp, extinct: c.extinct - b.extinct };
}
