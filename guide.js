// The in-app guide. Sense and action lists are built from the engine's own names so they can't go stale.
import { IN_NAMES, OUT_NAMES } from './sim.js';

const SENSE = {
  bias: 'a constant 1, so a neuron can have a built-in lean',
  energy: 'how full its energy tank is', age: 'how close it is to old age', speed: 'how fast it is moving right now',
  plant_f: 'plant food: how far ahead (+) or behind (−) the nearest pellet is, stronger when closer',
  plant_s: 'plant food: how far to the left (+) or right (−)',
  meat_f: 'meat (corpse bits): ahead or behind', meat_s: 'meat: left or right',
  mote_f: 'nearest other mote: ahead or behind', mote_s: 'nearest other mote: left or right', mote_p: 'nearest other mote: how close it is',
  mote_size: 'that mote is bigger (+) or smaller (−) than me', mote_kin: '+1 if it is my species, −1 if not',
  mote_diet: 'that mote is a hunter (+) or a grazer (−)', mote_e: 'how full its energy tank is',
  kin_f: 'nearest member of my own species: ahead or behind', kin_s: 'nearest member of my own species: left or right',
  dens: 'how crowded it is around me', kincount: 'how many of my own species are near',
  wall_l: 'a wall or the dish edge close on my left', wall_f: 'a wall straight ahead', wall_r: 'a wall on my right',
  on_farm: 'standing on a farm', on_nest: 'standing on a nest', on_gran: 'standing on a granary', gran_store: 'how much energy is stored in the granary I stand on',
  temp: 'too hot (+) or too cold (−) for my body', tox: 'toxin under me', light: 'daylight', sick: 'I am infected',
  ch_a: 'Scent A strength here', ch_b: 'Scent B strength here', ch_c: 'Scent C strength here',
  ga_f: 'Scent A is stronger ahead (+) or behind (−)', ga_s: 'Scent A is stronger to the left (+) or right (−)',
  gb_f: 'Scent B ahead/behind', gb_s: 'Scent B left/right', gc_f: 'Scent C ahead/behind', gc_s: 'Scent C left/right',
  clock: 'an internal ticking clock (lets a brain pulse, zigzag or time things)', noise: 'random static (lets a brain wander and try things)',
  hurt: 'I was just bitten, drained or poisoned', contact: 'something is touching me',
  mote_armor: 'how armored the nearest mote is', mote_bite: 'the nearest mote is biting right now (a danger signal)',
  mote_rel: 'is the nearest mote family? +1 parent or child, +0.5 sibling, 0 not related',
  mote_friend: 'how much I like the nearest mote: up to +1 for a close friend, −1 for a grudge',
  friend_f: 'my nearest friend: ahead or behind', friend_s: 'my nearest friend: left or right',
  nut: 'how rich the soil is under me (+ rich, − poor)', mem_food_f: 'remembered food: ahead (+) or behind (−), fading over ~15s', mem_food_s: 'remembered food: left (+) or right (−)', mem_food_t: 'how fresh the food memory is (1 = just seen, 0 = forgotten)',
  mem_foe_f: 'where I last got hurt: ahead or behind', mem_foe_s: 'where I last got hurt: left or right', mem_foe_t: 'how fresh that memory is', mood: 'slow mood: fed and content (+) or hungry (−)',
  prey_f: 'the nearest creature of another kind that I could eat: ahead or behind', prey_s: 'that prey: left or right', prey_p: 'that prey: how close',
  threat_f: 'the nearest creature that bites and is not tiny: ahead or behind', threat_s: 'that threat: left or right', threat_p: 'that threat: how close',
  fooddens: 'how much food lies all around me (a rich place or a poor one)', crowd_f: 'the middle of the crowd around me: ahead or behind', crowd_s: 'the middle of the crowd: left or right',
  fam_f: 'my nearest relative: ahead or behind', fam_s: 'my nearest relative: left or right', famcount: 'how many relatives are near me',
};
// short plain names for the brain panel. [low or negative, high or positive]; one entry means "how strong".
export const IN_LABEL = {
  bias: ['Always on'], energy: ['Low on energy', 'Full of energy'], age: ['Young', 'Getting old'], speed: ['Speed'],
  plant_f: ['Plant food behind', 'Plant food ahead'], plant_s: ['Plant food on the right', 'Plant food on the left'],
  meat_f: ['Meat behind', 'Meat ahead'], meat_s: ['Meat on the right', 'Meat on the left'],
  mote_f: ['Creature behind', 'Creature ahead'], mote_s: ['Creature on the right', 'Creature on the left'], mote_p: ['A creature is close'],
  mote_size: ['Neighbour is smaller', 'Neighbour is bigger'], mote_kin: ['Neighbour is another kind', 'Neighbour is my kind'], mote_diet: ['Neighbour eats plants', 'Neighbour eats meat'], mote_e: ['Neighbour is full of energy'],
  kin_f: ['My kind behind', 'My kind ahead'], kin_s: ['My kind on the right', 'My kind on the left'], dens: ['Crowded around me'], kincount: ['Many of my kind near'],
  wall_l: ['Wall on my left'], wall_f: ['Wall ahead'], wall_r: ['Wall on my right'],
  on_farm: ['Standing on a farm'], on_nest: ['Standing on a nest'], on_gran: ['Standing on a granary'], gran_store: ['Granary is stocked'],
  temp: ['Too cold', 'Too hot'], tox: ['Poison here'], light: ['Dark', 'Daylight'], sick: ['I am sick'],
  ch_a: ['Red smell here'], ch_b: ['Green smell here'], ch_c: ['Blue smell here'],
  ga_f: ['Red smell behind', 'Red smell ahead'], ga_s: ['Red smell on the right', 'Red smell on the left'],
  gb_f: ['Green smell behind', 'Green smell ahead'], gb_s: ['Green smell on the right', 'Green smell on the left'],
  gc_f: ['Blue smell behind', 'Blue smell ahead'], gc_s: ['Blue smell on the right', 'Blue smell on the left'],
  clock: ['Inner clock'], noise: ['Random urge'], hurt: ['Just got hurt'], contact: ['Touching something'], mote_armor: ['Neighbour is armored'], mote_bite: ['Neighbour is biting'],
  mote_rel: ['Neighbour is family'], mote_friend: ['Neighbour is an enemy', 'Neighbour is a friend'],
  friend_f: ['Friend behind', 'Friend ahead'], friend_s: ['Friend on the right', 'Friend on the left'], fam_f: ['Relative behind', 'Relative ahead'], fam_s: ['Relative on the right', 'Relative on the left'], famcount: ['Relatives near'],
  mem_food_f: ['Remembered food behind', 'Remembered food ahead'], mem_food_s: ['Remembered food on the right', 'Remembered food on the left'], mem_food_t: ['Food memory is fresh'],
  mem_foe_f: ['Danger spot behind', 'Danger spot ahead'], mem_foe_s: ['Danger spot on the right', 'Danger spot on the left'], mem_foe_t: ['Danger memory is fresh'],
  mood: ['Gloomy', 'Content'], nut: ['Poor soil', 'Rich soil'],
  prey_f: ['Prey behind', 'Prey ahead'], prey_s: ['Prey on the right', 'Prey on the left'], prey_p: ['Prey is close'],
  threat_f: ['Threat behind', 'Threat ahead'], threat_s: ['Threat on the right', 'Threat on the left'], threat_p: ['Threat is close'],
  fooddens: ['Plenty of food around'], crowd_f: ['Crowd behind', 'Crowd ahead'], crowd_s: ['Crowd on the right', 'Crowd on the left'],
};
export const OUT_LABEL = {
  thrust: ['Stop', 'Swim forward'], turn: ['Turn right', 'Turn left'], bite: ['Bite'], emit_a: ['Release red smell'], emit_b: ['Release green smell'], emit_c: ['Release blue smell'],
  b_wall: ['Build a wall'], b_farm: ['Build a farm'], b_nest: ['Build a nest'], b_gran: ['Build a granary'], dig: ['Dig out a structure'], xfer: ['Steal energy', 'Give energy'], mate: ['Want to mate'],
};
const pick = (L, v) => (L.length === 2 ? (v < 0 ? L[0] : L[1]) : L[0]);
export const hasSign = (table, name) => (table[name] || []).length === 2;
export const senseText = (name, v) => pick(IN_LABEL[name] || [name], v);
export const actionText = (name, v) => pick(OUT_LABEL[name] || [name], v);
const ACTION = {
  thrust: 'how hard to swim forward', turn: 'steer left (+) or right (−)', bite: 'bite whatever is touching me (eat it if the bite lands)',
  emit_a: 'release Scent A (costs a little energy)', emit_b: 'release Scent B', emit_c: 'release Scent C',
  b_wall: 'build a wall in front of me', b_farm: 'build a farm under me', b_nest: 'build a nest under me', b_gran: 'build a granary under me',
  dig: 'tear down the structure in front of me',
  xfer: 'positive: give energy to whoever is touching me, or stock the granary I stand on. Negative: steal from whoever is touching me, or withdraw from the granary',
  mate: 'willing to mate (positive). Very high with nobody around means budding a clone',
};
const li = (o, k) => `<li><b>${k}</b> — ${o[k] || ''}</li>`;

// Install steps for every common device. `dev` is the detected device so we can mark and open "your" section.
export function installHTML(dev, standalone) {
  const mark = d => (d === dev ? ' <span style="color:#58c08a">← this is you</span>' : '');
  const open = d => (d === dev ? ' open' : '');
  const S = (d, title, steps, note = '') => `<details${open(d)}><summary>${title}${mark(d)}</summary><ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol>${note ? `<p class="dim">${note}</p>` : ''}</details>`;
  return `
${standalone ? '<p style="color:#58c08a"><b>✔ You are already using the installed app.</b> Nothing more to do.</p>' : '<p>Motes is a <b>web app</b>: there is nothing to download from a store. Open the link in your phone\'s browser, then add it to your home screen. It then opens full-screen like any app, has its own icon, and <b>works offline</b>. It is free and nothing is uploaded anywhere.</p>'}
<div id="installNative"></div>
${S('android', 'Android phones (Pixel, OnePlus, Motorola… using Chrome)', [
    'Open <b>https://capsail.github.io/motes/</b> in <b>Chrome</b>.',
    'Tap the <b>⋮</b> menu (top right).',
    'Tap <b>Install app</b> (or <b>Add to Home screen</b>).',
    'Tap <b>Install</b>, then <b>Add</b> if it asks. The Motes icon appears on your home screen.',
  ], 'If you do not see Install, reload the page once and wait a few seconds, then try the ⋮ menu again.')}
${S('samsung', 'Samsung Galaxy (Samsung Internet)', [
    'Open the link in <b>Samsung Internet</b>.',
    'Tap the <b>≡</b> menu (bottom right).',
    'Tap <b>Add page to</b>, then <b>Home screen</b>.',
    'Tap <b>Add</b>.',
  ], 'On a Galaxy you can also use Chrome: follow the Android steps above.')}
${S('ios', 'iPhone and iPad (Safari)', [
    'Open the link in <b>Safari</b> (the blue compass icon).',
    'Tap the <b>Share</b> button: the square with an arrow pointing up (bottom middle on iPhone, top right on iPad).',
    'Scroll down and tap <b>Add to Home Screen</b>.',
    'Tap <b>Add</b> (top right). The icon appears on your home screen.',
  ], 'Heads up: an iPhone keeps the home-screen app\'s saves <b>separate</b> from the Safari tab. Start from the home-screen icon and stay there. To move a dish between them, use Menu → Dish → Copy dish code, and paste it into the other one. On newer iOS you can also add from Chrome or Edge using their Share menu.')}
${S('firefox', 'Firefox on Android', [
    'Open the link in <b>Firefox</b>.',
    'Tap the <b>⋮</b> menu.',
    'Tap <b>Install</b>, then confirm.',
  ])}
${S('desktop', 'Computer (Chrome, Edge, Brave)', [
    'Open the link in your browser.',
    'Click the <b>install icon</b> at the right end of the address bar (a monitor with a down arrow), or open <b>⋮ → Cast, save and share → Install page as app</b> (Edge: <b>… → Apps → Install this site as an app</b>).',
    'Click <b>Install</b>. It opens in its own window and gets a shortcut.',
  ], 'On a Mac in Safari: File → Add to Dock.')}
<h4>Sharing it</h4>
<p>Send people the link <b>https://capsail.github.io/motes/</b> and point them to <b>☰ Menu → How it works</b> or <b>☰ Menu → Put it on your phone</b>. Everyone gets their own dish that lives on their own device.</p>
<h4>Trouble?</h4>
<ul><li><b>No install option:</b> make sure you are in the browser itself (not inside another app's built-in browser such as Facebook or Messenger). Use "Open in browser" first.</li>
<li><b>Saves are separate per device and per install.</b> Menu → Dish has Download dish file and Copy dish code to move one.</li>
<li><b>Update the app:</b> just open it while online; it refreshes itself the next time you launch.</li>
<li><b>Remove it:</b> press and hold the icon, then Uninstall / Remove. The dish on that device goes with it, so copy the dish code first if you care.</li></ul>`;
}

export function guideHTML() {
  return `
<p>Welcome to <b>Motes</b>: a petri dish of tiny digital creatures that live, eat, breed, build, fight, cooperate and evolve on their own. You are not the boss of them. You are the weather, the gardener and the meddling giant hand. Nothing in here is scripted past a few starting instincts; everything you see them do was discovered by evolution.</p>

<details><summary>🆕 What is new</summary>
<p><b>Latest</b></p>
<ul>
<li><b>New stingers</b>: jointed scorpion-like tails with a venom sac and a hooked barb.</li>
<li><b>Smoother touch</b>: two fingers only move and zoom, and never set off a tool.</li>
<li><b>Food fixed and redrawn</b>: plants are leaf sprigs, meat is soft chunks. Farms now grow even when the dish is full of food, and pellets no longer flash and vanish.</li>
<li><b>A richer look</b>: rounded, wet-looking bodies with shadows, a head for each body plan, eyes that look and blink, and a textured dish floor.</li>
<li><b>Absolute killers</b>: about one New life in three drops three true predators. Nothing can be dropped outside the dish.</li>
</ul>
<p><b>Also recent</b></p>
<ul>
<li><b>The god rule</b>: any creature you ☆ star is immortal and never grows old.</li>
<li><b>📔 Immortal journals</b>: a detailed life story for every starred creature.</li>
<li><b>Survival comes first</b> for every creature.</li>
<li>Three parts that may or may not evolve: <b>stinger</b>, <b>camouflage</b>, <b>jet</b>.</li>
<li><b>Rebalanced powers</b>: poison, plague, meteor and heat hit harder; ice age, drought, bloom and your farms are gentler.</li>
<li><b>Creepy grabby arms</b> with tools, six body plans in natural colours, visible eating and biting, solid bodies and walls.</li>
<li>A <b>brain panel in plain words</b>, and senses for prey, threats, food and crowds.</li>
</ul></details>

<details open><summary>The 30-second version</summary>
<ul>
<li>Every squiggle is a <b>mote</b>. It has a <b>body</b> (shape, size, speed, diet…) and a <b>brain</b> (a tiny neural network).</li>
<li>Motes eat <b>plants</b> (green leaf sprigs) or <b>meat</b> (red chunks), burn energy to move and think, and when they have spare energy they <b>mate</b> or bud. Children inherit a mix of the parents' bodies and brains, plus random <b>mutations</b>.</li>
<li>Motes that do well leave more children, so over time the population changes. That is evolution. Let it run, then come back.</li>
<li>Tap a mote with <b>👆 Look</b> to see its stats, what it is doing and feeling, and (under More details) its <b>🧠 brain in plain words</b>. The <b>☰ Menu</b> button (top right) opens species, the family tree, the diary, stats and this guide.</li>
</ul></details>

<details><summary>Buttons and controls</summary>
<ul>
<li><b>Top left:</b> <b>⏸</b> pauses (Space on a computer). <b>1×</b> changes speed: 1×, 3×, 8× and slow-motion 0.4×. <b>👁</b> chooses what the dish shows: everything at once, or just one smell, heat and cold, or poison. <b>☰ Menu</b> (top right) opens everything else.</li>
<li><b>Bottom row</b> has four big buttons. <b>👆 Look</b> is the normal mode: drag to move the map, pinch (or mouse wheel) to zoom, tap a mote to inspect it. <b>🌱 Build</b>, <b>🌡️ Climate</b> and <b>⚡ Powers</b> each open a panel of tools. Every tool says in plain words what it does. Tap one to pick it, then touch the dish.</li>
<li>With a tool picked, a bar appears above the buttons with its name, what it does, the brush size (<b>S / M / L</b>) and a green <b>✔ Done</b> that takes you back to Look. <b>Two fingers</b> always move and zoom the map, even with a tool picked, and never set the tool off. Brushes start as you touch; <b>New life</b> and <b>Meteor</b> go off as you lift a single finger (drag first to cancel). If one finger stays down after pinching, it moves the map.</li>
<li><b>↶ Undo</b> appears after you paint with a Build or Climate tool (walls, farms, heat, poison, smells, food, erase). It undoes your last brush stroke, up to ten in a row. Powers like Smite and Meteor cannot be undone.</li>
<li>When you use a power, you get a message saying what happened (for example “Infected 3 motes”) and a ring flashes where it hit.</li>
<li>The first time you open the app you get a short tour of these buttons. Menu → 🎓 Show me around replays it.</li>
<li><b>The little icon over a creature's head</b> (when you zoom in) shows what it is doing right now: 💢 hurt or attacked, ☠️ poisoned, 🤢 sick, 😈 hunting, 😠 stealing energy, 💛 giving energy, ❤️ looking for a mate, 🔨 building, 🍽️ hungry, 🤝 in a pod with a friend. ★ means you starred it. Tap a creature and its panel says in words what it is <b>doing</b> and how it is <b>feeling</b>; its best friend (💚), rival (💢) and nearest relatives (🏠) get a name tag and a line.</li>
<li>Selected mote buttons: <b>👁 Follow</b> (camera tracks it), <b>☆ Star</b> (makes it <b>immortal</b>, and keeps its story), <b>🍎 Feed</b>, <b>🧬 Clone</b> (a mutated copy), <b>✏️ Rename</b>. Under <b>More details</b>: <b>🧠 Show brain</b> lists what it senses and decides right now and why, with an optional wiring map.</li>
</ul></details>

<details><summary>The tools, one by one</summary>
<p><b>🌱 Build</b></p>
<ul>
<li><b>🍃 Food</b>: sprinkle plant pellets.</li>
<li><b>🧱 Wall</b>: a permanent wall. Nothing swims, sees or smells through it. Fence off a species, build mazes, protect a nest.</li>
<li><b>🌱 Farm</b>: soil that grows plants on itself, even when the rest of the dish is full of food. Each tile of yours holds about two plants and regrows them as they are eaten (creature-built farms can pile higher, but crumble). Growth slows at night.</li>
<li><b>🪺 Nest</b>: heals motes standing on it, slows their energy drain, and gives newborns a boost.</li>
<li><b>🏺 Granary</b>: stores energy. Motes can learn to put some in and take some out.</li>
<li><b>🧹 Erase</b>: clears structures, food, smells, heat and poison.</li>
</ul>
<p><b>🌡️ Climate</b></p>
<ul>
<li><b>🔥 Heat / ❄️ Cold</b>: warm or chilly patches. A short stroke is enough to be felt. Every kind has a favourite temperature and a tolerance, so some shrug off cold and others heat. They steer toward what they like and away from what is too hot or cold, and evolution adapts to your climate.</li>
<li><b>☠️ Poison</b>: a purple cloud that lingers, spreading and fading slowly. It is deadly to stay in. Everything flees it; motes caught in it lose energy fast (zoom in to see ☠️ over their heads). Resistance costs energy but evolves.</li>
<li><b>🔴🟢🔵 Red / Green / Blue smell</b>: every mote has an inherited like or dislike for each smell. Some kinds are drawn to a smell and some run from it, and that taste evolves. Brains can also sense and release smells, and what that <i>means</i> is up to evolution.</li>
</ul>
<p><b>⚡ Powers</b></p>
<ul>
<li><b>🦠 Plague</b>: touch motes to infect them. Sick motes come out in yellow-green spots, lose energy fast, and pass the sickness to motes they touch, so it can sweep through a crowd. The weak often die of it. It wears off after about half a minute and leaves survivors briefly immune. Touch <i>right on</i> some motes. If you miss you get a message saying so.</li>
<li><b>⚡ Smite</b>: kills the motes under your finger.</li>
<li><b>☄️ Meteor</b>: tap to drop one. It kills everything in its wide crater, burns the ground bare and leaves it hot and poisoned, then plants spring up around the rim.</li>
<li><b>✨ New life</b>: tap inside the dish to drop in a new kind with its own look and a working brain. Usually it is a family of four. About <b>one time in three</b> it is three <b>absolute killers</b>: big, fast, far-sighted, meat-eating, armed with weapons, sometimes with a jet, stinger or camouflage. Born killers hunt by instinct and cruise slowly to save energy when no prey is in sight. Nothing can be dropped outside the dish or inside a wall.</li>
</ul>
<p>The one-tap events: <b>Food bloom</b> is a short boost, <b>Drought</b> makes food scarce for a couple of minutes, <b>Ice age</b> is the harshest (three minutes of deep cold with thin food), and cold snaps and heatwaves pass in about a minute. The 🆘 Help button for a species on the edge gives food and short-lived nests.</p>
<p>Walls, farms, nests and granaries you paint are permanent. Structures built by motes decay unless motes keep repairing them.</p></details>

<details><summary>Bodies, and the squiggles</summary>
<p>Each mote's body is <b>generated from its genes</b>, so every shape you see was grown, not drawn. The shape genes are:</p>
<ul>
<li><b>Segments</b> (2–9) and <b>length</b> — how long and chunky the spine is.</li>
<li><b>Taper</b> — how much it narrows toward the tail. <b>Curl</b> — how tightly it can turn (a curled body turns sharply but runs slower).</li>
<li><b>Wiggle strength</b> and <b>wiggle speed</b> — how much it undulates while swimming.</li>
<li><b>Limbs</b> (0–4 pairs of legs) and <b>limb length</b>.</li>
<li><b>Arms</b> (0–2 pairs) with a <b>tool</b> on the end: claw, spear, club, pincer, scoop or rake (see Arms and tools below).</li>
<li><b>Skin markings</b>: plain, freckles, crosswise bands or lopsided blotches, in a second evolving <b>colour</b>.</li>
<li><b>Feelers</b> (0–3, some forked) and a <b>tail</b> (forked, a ribbed fan or a leaf paddle). Antennae see a little further but cost a little to keep; a big fin makes swimming cheaper.</li>
</ul>
<p>Shape is not just looks:</p>
<ul>
<li>Long bodies run <b>faster</b> but <b>turn slowly</b>.</li>
<li>Limbs help <b>turning</b> but add <b>drag</b> (more energy to move).</li>
<li>A strong wiggle makes swimming <b>cheaper</b>. Thick bodies store more energy; streamlined ones swim cheaper.</li>
<li>Shape counts toward species: when bodies drift far enough apart a new species appears, and it looks different from its parent.</li>
</ul>
<p>Other body genes: <b>size</b> (big = more energy storage and wins fights, but costs more to run), <b>speed</b>, <b>senses</b> (how far it sees; costs energy), <b>diet</b> (plants ↔ meat; plant-eaters digest meat badly and the reverse), <b>armor</b> (harder to bite or drain, but costs energy), <b>sunlight</b> (makes energy from daylight like a plant, at the price of digesting less food), <b>metabolism efficiency</b>, <b>fat</b>, <b>temperature range</b>, <b>toxin resistance</b>, <b>disease resistance</b>, <b>lifespan</b>, <b>maturity age</b>, <b>how much to invest in children</b>, and two <b>mutation rates</b> (one for body, one for brain) that evolve too.</p>
<p>Look for trade-offs: nothing is free. A tough, fast, far-seeing, disease-proof mote burns energy so quickly that it starves. Evolution finds the balance that fits the dish you built.</p></details>

<details><summary>Survival, arms, special parts and walls</summary>
<ul>
<li><b>Survival comes first.</b> A hungry creature turns to food and eases off sprinting when nothing is in sight. It stops building, smelling and giving away when it runs low, unarmed plant-eaters run from things that bite, and nobody breeds into a famine: they need food around or a very full belly. These are body instincts; nothing in the app ever rescues a dish.</li>
<li><b>Arms and tools.</b> Some creatures grow one or two pairs of little grabby arms out of their sides, in their own colour, and every tool is part of the body. <b>Weapons</b> are bone: <i>claws</i> (hooked talons) make bites land, a <i>spear</i> (barbed bone spike) reaches further, a <i>club</i> (knobbed fist) gets through armor. <b>Gathering hands</b>: <i>pincers</i> (snapping jaws) make each pellet worth more, a <i>scoop</i> (webbed hand with pale fingertips) and a <i>rake</i> (long spindly fingers) bring in food from further away. Arms cost energy and slow a creature a little, so they only pay off if the hand fits the way it lives. Zoom in to see them twitch, reach, snatch food into the mouth and jab at victims. Tap a creature to read its hands.</li>
<li><b>Optional parts.</b> Three parts that a creature grows only if evolution takes it there. A <b>stinger</b> (a jointed scorpion-like tail with a venom sac and a hooked barb) poisons whatever bites it, and whatever it bites. <b>Camouflage</b> (murky mottled skin) means a slow-moving creature is only noticed from much closer. A <b>jet</b> (two grey nozzles) gives a burst of speed to escape or to catch prey, with a spray behind, and burns a lot of energy. Each costs energy to keep, so it only spreads where it pays off. Tap a creature to see what it has.</li>
<li><b>Eating and biting show.</b> A creature with arms reaches out, grabs the food and carries it to its mouth. Without arms the food is slurped in. Jaws open and snap when biting, meat-eaters show teeth, and a bite leaves tooth marks and a flash on the victim, with a red burst when it is killed.</li>
<li><b>Body shape matters.</b> Every part of a body has a price and a payoff. <b>Long, thin</b> bodies run fast and swim cheaply but turn slowly. <b>Thick, short</b> bodies store more energy and turn fast. <b>Curled</b> bodies turn tightly but run slower. <b>More segments</b> mean more stored energy and a longer bite reach, but a heavier body. Limbs help turning, fins and wiggle make swimming cheaper. Natural selection weighs it all, so shapes drift toward what works in that dish.</li>
<li><b>Prey, threats and crowds.</b> Besides the nearest creature, every brain can sense the nearest <i>prey</i> (another kind it could eat), the nearest <i>threat</i> (something that bites and is not tiny), how rich the food is all around, and which way the crowd is. Creatures also keep a little personal space: they drift away from a crowd, and crowding costs energy, so food does not pile everyone into one clump. Tap a creature, More details, Show brain to read what it senses and decides in plain words.</li>
<li><b>Solid bodies and walls.</b> Creatures cannot walk through each other. They bump and push apart, and the only way to overlap is a bite: a creature that is biting its victim can close in on it. Walls stop whole bodies, even fast ones. Walls you draw cannot be torn down by creatures. Walls that creatures built themselves can still be dug out by a creature that learns to dig.</li>
<li><b>Meat is a trade-off.</b> The more a creature leans toward meat, the worse it digests plants, but a small taste for meat costs almost nothing. So a small taste is cheap and pays off when prey is around, and a true specialist has to give up a lot. Over the years dishes grow meat-leaning omnivores. Check the 🧬 Stats chip for the average diet.</li>
</ul></details>

<details><summary>Brains: what motes sense and do</summary>
<p>Every mote's brain is a small <b>recurrent neural network</b>. Senses go in on the left, actions come out on the right, and in between are <b>hidden neurons</b> that can hold memory. Tap a mote to watch its brain fire live. Under More details, Show brain gives a plain-words panel: the strongest senses, the decisions and why. The optional wiring map shows the network itself: green lines excite, red lines suppress, thicker means stronger.</p>
<p>Brains <b>evolve their own structure</b>: mutations re-weight links, add links, remove links and split a link to insert a new hidden neuron. When two motes mate, their brains are combined link by link. Brains that cost more to run drain more energy, so they only grow when the extra thinking pays off. A brain can grow up to <b>48 hidden neurons and 420 connections</b>, and a hidden neuron can connect to itself, which gives it a short memory.</p>
<p>The founders carry brains evolved for years on the developer's computer plus a few built-in instincts (steer toward liked scents, flee toxin and threats, keep a little personal space, stay away from walls). Everything beyond that is discovered. Nobody told them what a scent means, that hoarding is possible, that stealing works, or that a wall protects you.</p>
<h4>Senses</h4><ul>${IN_NAMES.map(k => li(SENSE, k)).join('')}</ul>
<h4>Actions</h4><ul>${OUT_NAMES.map(k => li(ACTION, k)).join('')}</ul></details>

<details><summary>Friendships and families</summary>
<p><b>Families are real.</b> Every mote remembers its parents. A mote can tell <b>parent/child</b> (relation 1) and <b>siblings</b> (0.5) apart from strangers, and it senses where its relatives are. When you select a mote, gold lines connect it to its family and the text shows who they are.</p>
<p><b>Friendships are earned.</b> Each mote keeps a little address book of up to <b>4</b> bonds:</p>
<ul>
<li>Spending time close to a mote that is not hostile builds a bond, faster for motes with a high <b>bond gene</b>. Sharing energy builds it fast. Children start with a bond to their parents.</li>
<li>Being <b>bitten or drained</b> by someone makes a <b>grudge</b> (red lines). A grudge fades only slowly. Betraying a relative is logged in the Diary.</li>
<li>Bonds fade if you drift apart, and vanish when the friend dies. A full address book drops its weakest friend to make room.</li>
<li>A mote with a bonded mate has a <b>devoted</b> child (starts with extra energy). Mating with a close relative (parent, child, sibling) gives a <b>weak, inbred</b> child (starts with much less energy), so evolution has a reason to learn to avoid it.</li>
</ul>
<p>Nothing says what to <i>do</i> about friends and family except a few starter instincts in the founders: drift toward friends and relatives, and feed a hungry relative who is touching you when you are full. After that, brains can learn to hunt in packs, guard children, never bite relatives, share only with friends, take revenge on grudges, or ignore all of it if it doesn't pay. Watch the Stats page for friendships formed, grudges, family feedings and inbred births.</p></details>

<details><summary>The world</summary>
<ul>
<li><b>Day and night:</b> daylight rises and falls over a 200-second day. Plants grow faster in daylight, and sun-feeding motes only earn energy by day.</li>
<li><b>Food:</b> plants grow in clumps where the soil is good, so some places are rich and some are deserts. Farms add their own on top. Nothing grows inside walls or outside the dish. When a mote dies it leaves <b>meat</b> that rots away in about a minute. Hunters and scavengers digest meat well.</li>
<li><b>Temperature, toxin and scents</b> are fields you can see with the <b>👁</b> button. Toxin spreads slowly. Scents spread and fade over about half a minute, so they work like messages and trails. If you want to see creatures releasing smells, turn on “Show smell ripples” in the 👁 panel.</li>
<li><b>Structures</b> motes can build: walls (block movement), farms (grow food), nests (heal and boost babies), granaries (store energy). They decay unless motes repair them by building the same thing again on them. A mote can also dig down structures that motes built, so raiders are possible. Walls you draw cannot be dug out.</li>
<li><b>Random events</b> (optional, on by default): blooms of food, cold snaps, heatwaves, plagues and toxic spills. Random events can also bring droughts and the odd meteor. You can call events yourself from the ⚡ Powers panel or ☰ Menu → Dish and saving.</li>
</ul></details>

<details><summary>Drama you may see (none of it is scripted)</summary>
<ul>
<li><b>Predators and prey</b>: hunters chase and bite. Prey evolve to flee, to armor up, or to out-run them. Watch for jaws snapping, tooth marks on the victim and a red burst when a kill lands.</li>
<li><b>Cannibals</b>: nothing stops a mote biting its own species. Sometimes it pays off.</li>
<li><b>Parasites</b>: a mote that learns to steal energy from a neighbour without killing it. Hosts answer with armor, distance or kicking them out.</li>
<li><b>Altruism and cooperation</b>: motes that give energy to neighbours. It tends to spread when relatives help each other.</li>
<li><b>Hoarders and economies</b>: granaries stocked in good times and drawn on in bad times.</li>
<li><b>Builders and raiders</b>: walls, farm plots, nest clusters, and motes that evolve to tear them down.</li>
<li><b>Communicators</b>: a mote that sprays a scent when it is bitten or when it finds food, and neighbours that learn to follow or avoid it. Try painting a scent yourself to see who reacts.</li>
<li><b>Plague</b>: spreads when motes touch. Disease resistance evolves, and crowding makes it worse.</li>
<li><b>Boom and bust</b>: populations crash and rebuild in cycles. That is normal and healthy.</li>
<li><b>Speciation and extinction</b>: species split on their own when genes or brains drift apart; names are generated. Extinct species stay in the list.</li>
</ul>
<p>The <b>Diary</b> records the big firsts (the first kill, first mating, first granary, first parasite, first neuron added) and every speciation and extinction. <b>Stats</b> shows population, species and brain-size history, plus all-time records.</p></details>

<details><summary>Species, favorites and records</summary>
<p>In <b>Species</b> tap 🔦 to spotlight a species on the dish, or tap its name to follow one of its motes. <b>🌳 Tree</b> draws the whole family tree of species. In <b>Dish</b> you can turn on sound, buzz and save a picture of the dish.</p>
<ul>
<li><b>Diary</b> (menu): the journal of the dish, stamped with the dish year and day. Filter it by Years (an "in review" entry is written at the end of every dish-year), Firsts (first kill, first granary, first best friends…), Species, Events and Stars. Firsts, year reviews and star stories are never pushed out; smaller news scrolls away.</li>
<li><b>Species</b> (menu): everyone alive and extinct, with population, peak, birth day and parent species. Tap one to jump to a member.</li>
<li><b>📔 Immortal journals</b>: from the moment you star it, a creature's life is written down: who it was that day, every child and grandchild, meals, hunts and attacks on it, every death it cheated, friends made and lost, grudges, pods, gifts, thefts, buildings, sickness, the big events it lived through, and a review of every dish-day. Open it from the creature's panel or ☰ Menu → Immortal journals. Filter it, copy it, or save it as a text file. Removing the star keeps the journal.</li>
<li><b>Stars, the god rule</b>: a starred creature is <b>immortal</b>. Hunger, old age, teeth, plague, poison, heat, cold, Smite and Meteor cannot kill it, and nothing can eat it or steal from it. It still lives, eats, breeds and fights as normal; its children are ordinary mortals. It <b>never grows old</b>: its brain always feels in its prime, however many days it has lived. Tap the star again to make it mortal; it goes back to ageing from its prime. Starting a new dish removes everything, stars included.</li>
<li><b>Stats → Records</b>: oldest, most children, most kills, biggest brain, deepest generation.</li>
</ul></details>

<details><summary>While you are away, saving, and moving dishes</summary>
<ul>
<li>Your dish <b>saves itself</b> on this device every 45 seconds and whenever you leave.</li>
<li>When you come back after a while, the dish <b>fast-forwards</b>: 1 second away is 0.25 seconds of dish time, up to about 40 dish-minutes, and you get a welcome-back report (births, deaths, new species, structures). The last dozen motes are protected during the fast-forward so you never return to an empty dish. You can tap <b>Skip ahead</b> to stop early.</li>
<li><b>Phone ↔ PC:</b> Menu → Dish → <b>Download dish file</b> or <b>Copy dish code</b>, then <b>Load</b> it on the other device. Each device keeps its own copy.</li>
<li><b>Dish settings:</b> max population (lower on slow phones), food abundance, random events on or off, and a New dish button (erases the current one).</li>
<li><b>Everyone has an American name</b> (like Jake Miller), and children carry their parent's last name, so you can spot families. The icons and the panel use first names.</li>
<li><b>A new game starts at Day 1, generation 0.</b> The five founding lineages (one of them meat-eating) carry brains that were evolved for years on the developer's computer, so a fresh dish is smart enough to survive on its own, but everything after Day 1 is still evolution. In ☰ Menu → Dish and saving you can start another fresh dish, or load a world that was fast-forwarded for several dish-years (a dish-year is 365 days of 200 seconds).</li>
<li>Install: open the site in Chrome, choose <b>Add to Home screen</b>. It then works offline.</li>
</ul></details>

<details><summary>Sight, smell, memory, walls and pods</summary>
<ul>
<li><b>Sight and smell have range.</b> A mote sees other motes out to 50–240 units depending on its sense gene (hunters see a bit further). It smells <i>food</i> up to 1.5× that far. Antennae add a little more.</li>
<li><b>Walls block everything.</b> Nothing sees, smells or walks through a wall. Food or prey on the far side is simply not noticed, so motes have to go around. Scents and toxin also spread around walls, not through them. Motes steer away from walls on instinct, and turn when they bump one.</li>
<li><b>Short-term memory.</b> Each mote remembers where it last saw food and where it last got hurt. The memory fades over about 15 seconds and clears when it gets there. Brains can read these memories as senses (<i>mem_food_f/s/t</i>, <i>mem_foe_f/s/t</i>) plus a slow <i>mood</i> (fed versus hungry). Tap a mote to see the green dotted line to the food it remembers and a red ring where it was hurt.</li>
<li><b>Instincts you can see.</b> Everything has an inherited like or dislike for each scent. Everything flees toxin. Everything steers toward its favourite temperature. Everything keeps a little personal space.</li>
<li><b>Pods.</b> Two motes with a strong two-way friendship stay close and even out their energy, so the fed one feeds the hungry one. With “Show smell ripples” on in the 👁 panel, a gold line joins podmates. Pods ride out famine together.</li>
<li><b>Looks.</b> There are six body plans: <b>ringed worm</b>, <b>smooth slug</b> with a back stripe, <b>plated crawler</b> with little legs under its shields, <b>see-through microbe</b> full of tiny organs, <b>bristle worm</b>, and <b>flatworm</b> with a rippling edge and veins. Add thorns, ruffled hems, see-through bellies, and eyes: none, one big one, two beads, a spider cluster or stalks (meat-eaters get amber slit eyes). Colours stay natural and muted. Thorns, ruffles and see-through bellies are for looks and cost a little energy. All of it is inherited and mutates, and big differences make new species.</li>
<li><b>Stories.</b> The Diary now tells you: <b>rivalries</b> (two creatures that each hold a grudge against the other), <b>family lines</b> (“The Hill family has grown to 60 creatures”), <b>records</b> (oldest, most children, deadliest), <b>obituaries</b> for starred and very successful creatures, <b>“last of their kind”</b> alerts (tap 🆘 Help next to the species to give them food, nests and energy), and <b>firsts for each species</b> (“Moskiqui Leafling learned to hunt”). You can rename a species with ✏️ in the Species list.</li>
<li><b>The plague mutates.</b> Every sickness has a strain. It changes a little each time it spreads, and each creature has an inherited immune type: hosts whose type is close to the strain barely catch it. So a plague sweeps through, survivors become resistant, the strain drifts to get past them, and the cycle repeats.</li>
<li><b>Soil minerals: sunlight is not a free lunch.</b> Sunlight here is weak, like the real thing: a small still body can live on it, but an active one cannot. Living on sunlight also needs minerals from the ground under you, and it uses them up. Soil slowly recovers by itself, and gets minerals back whenever anything eats (waste) and from every body that dies. Poor soil means weak sun-eaters and slow plant growth, so a clump of still sun-eaters starves its own patch. Eating other creatures needs no soil. That is why hunting and scavenging pay off. Choose 👁 → Soil richness to see it: green is rich, brown is poor.</li>
<li><b>Geography.</b> The dish is always a little cooler at the top and warmer at the bottom, on top of the weather and anything you paint. Kinds that like cool and kinds that like warm can each own a region, which helps new species appear.</li>
<li><b>Crowding and rarity.</b> Standing in a crowd (more than about 4 others within a short distance) costs energy, creatures drift away from crowds, and the more of your own kind there are, the harder it is to find enough food. These stop everything balling up into one clump and help several species survive together.</li>
<li><b>Disasters.</b> Ice age, Drought, Food bloom, Cold snap and Heatwave are one-tap tiles at the bottom of the ⚡ Powers panel, the ☄️ Meteor tool drops a crater anywhere, and random events now include rare meteors and droughts too (only when the dish is healthy).</li>
</ul></details>

<details><summary>Things to try</summary>
<ul>
<li>Pause, tap a hunter, hit <b>Follow</b>, and watch its brain while it hunts.</li>
<li>Wall off half the dish for ten minutes (use 8×), then remove the wall and see which side evolved differently.</li>
<li>Paint a ring of cold around one species' home. Do they evolve fat and armor, or migrate?</li>
<li>Release a plague into the biggest herd. Who survives?</li>
<li>Spotlight a species (☰ Menu → The creatures → 🔦) and watch where its motes live and travel. Open 🌳 Tree to see how every species is related.</li>
<li>Build a wall with a gap and drop food behind it. Do they find the gap?</li>
<li>Put a red smell patch near food over and over. Does anyone start following it?</li>
<li>Use <b>✨ New life</b> in a quiet corner a few times and watch the newcomers either take over or get eaten.</li>
<li>Turn food abundance down to 0.4 and see which body plan wins when times are hard.</li>
<li>Star a mote, leave for a day, and read its descendants' story in the Diary.</li>
</ul></details>

<details><summary>Plain-English glossary</summary>
<ul>
<li><b>Gene</b>: a number that shapes the body (size, speed, shape…). <b>Genome</b>: all of them plus the brain wiring.</li>
<li><b>Mutation</b>: a small random change to a child's genes or brain.</li>
<li><b>Crossover</b>: mixing two parents' genes and brain links to make a child.</li>
<li><b>Species</b>: a group whose genes and brains are similar enough to breed with each other. Motes only mate within their species.</li>
<li><b>Neuron / hidden neuron</b>: a node in the brain that adds up its inputs. Hidden neurons sit between senses and actions and can hold a bit of memory.</li>
<li><b>Generation</b>: how many parents-to-child steps from a founder.</li>
<li><b>Budding</b>: reproducing alone, making a mutated clone. Costs more.</li>
</ul></details>
<p class="dim">Motes keeps all of this on your device. Nothing is sent anywhere.</p>`;
}
