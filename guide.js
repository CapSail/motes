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
  mem_food_f: 'remembered food: ahead (+) or behind (−), fading over ~15s', mem_food_s: 'remembered food: left (+) or right (−)', mem_food_t: 'how fresh the food memory is (1 = just seen, 0 = forgotten)',
  mem_foe_f: 'where I last got hurt: ahead or behind', mem_foe_s: 'where I last got hurt: left or right', mem_foe_t: 'how fresh that memory is', mood: 'slow mood: fed and content (+) or hungry (−)',
  fam_f: 'my nearest relative: ahead or behind', fam_s: 'my nearest relative: left or right', famcount: 'how many relatives are near me',
};
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
<p>Send people the link <b>https://capsail.github.io/motes/</b> and point them to <b>? → Guide</b> or <b>☰ → 📲 Install</b>. Everyone gets their own dish that lives on their own device.</p>
<h4>Trouble?</h4>
<ul><li><b>No install option:</b> make sure you are in the browser itself (not inside another app's built-in browser such as Facebook or Messenger). Use "Open in browser" first.</li>
<li><b>Saves are separate per device and per install.</b> Menu → Dish has Download dish file and Copy dish code to move one.</li>
<li><b>Update the app:</b> just open it while online; it refreshes itself the next time you launch.</li>
<li><b>Remove it:</b> press and hold the icon, then Uninstall / Remove. The dish on that device goes with it, so copy the dish code first if you care.</li></ul>`;
}

export function guideHTML() {
  return `
<p>Welcome to <b>Motes</b>: a petri dish of tiny digital creatures that live, eat, breed, build, fight, cooperate and evolve on their own. You are not the boss of them. You are the weather, the gardener and the meddling giant hand. Nothing in here is scripted past the first six founders; everything you see them do was discovered by evolution.</p>

<details open><summary>The 30-second version</summary>
<ul>
<li>Every squiggle is a <b>mote</b>. It has a <b>body</b> (shape, size, speed, diet…) and a <b>brain</b> (a tiny neural network).</li>
<li>Motes eat green <b>plant pellets</b> or red <b>meat</b>, burn energy to move and think, and when they have spare energy they <b>mate</b> or bud. Children inherit a mix of the parents' bodies and brains, plus random <b>mutations</b>.</li>
<li>Motes that do well leave more children, so over time the population changes. That is evolution. Let it run, then come back.</li>
<li>Tap a mote to see its stats and its <b>live brain</b>. Open <b>☰</b> for species, the diary, stats and this guide.</li>
</ul></details>

<details><summary>Controls (phone and PC)</summary>
<ul>
<li><b>Look</b> tool: drag to pan, tap a mote to select it. <b>Pinch</b> (phone) or <b>mouse wheel</b> (PC) to zoom.</li>
<li>Any other tool: drag on the dish to paint it. With a paint tool active, use <b>two fingers</b> to pan/zoom (PC: right or middle mouse drag to pan).</li>
<li>Top bar: <b>⏸</b> pause (Space on PC), the speed button cycles 1× / 3× / 8× / 0.4×, <b>View</b> cycles overlays (everything at once, then each scent, heat, toxin alone). Scents, heat and toxin always show on the dish, <b>?</b> opens this guide, <b>☰</b> opens the menu.</li>
<li><b>◯ S/M/L</b> at the end of the tool bar changes brush size.</li>
<li>Selected mote buttons: <b>Follow</b> (camera tracks it), <b>☆ Star</b> (keep its story forever), <b>Feed</b>, <b>Clone</b> (a mutated copy), <b>Rename</b>.</li>
</ul></details>

<details><summary>The tools</summary>
<ul>
<li><b>🍃 Food</b> — sprinkle plant pellets.</li>
<li><b>🧱 Wall</b> — permanent wall; motes cannot swim through it. Fence off a species, build mazes, protect a nest.</li>
<li><b>🌱 Farm</b> — a tile that keeps growing food (a permanent one, unlike motes' own).</li>
<li><b>🪺 Nest</b> — heals motes standing on it, slows their energy drain, and gives newborns a boost.</li>
<li><b>🏺 Granary</b> — stores energy. Motes can learn to deposit and withdraw.</li>
<li><b>🔥 Heat / ❄️ Cold</b> — paint warm or cold zones. Every kind has a favourite temperature and a tolerance. They steer toward the warmth or chill they like and away from what is too hot or cold, and evolution adapts to your climate.</li>
<li><b>☠️ Toxin</b> — poison (purple) that slowly spreads and fades. Everything flees it, motes standing in it get a purple ring and lose energy fast. Resistance costs energy but evolves.</li>
<li><b>🔴🟢🔵 Scent A/B/C</b> — paint chemical signals. Every mote has an inherited like or dislike for each scent: some kinds are drawn to a scent and some run from it, and that taste evolves. Brains can also sense and release them, and what that <i>means</i> is up to evolution (see below).</li>
<li><b>🦠 Plague</b> — infect motes you touch. It spreads on contact, drains energy, and then fades, leaving survivors briefly immune.</li>
<li><b>⚡ Smite</b> — kill motes under the brush. <b>☄️ Meteor</b> — tap to drop one: it kills everything in the crater, burns the ground bare and leaves it hot and poisoned, then plants spring up around the rim. <b>✨ Spark</b> — tap to drop in a new founder. <b>🧹 Erase</b> — clears structures, food, toxin, heat and scents.</li>
</ul>
<p>Player-built structures are permanent. Structures built by motes decay unless motes keep repairing them.</p></details>

<details><summary>Bodies, and the squiggles</summary>
<p>Each mote's body is <b>generated from its genes</b>, so every shape you see was grown, not drawn. The shape genes are:</p>
<ul>
<li><b>Segments</b> (2–9) and <b>length</b> — how long and chunky the spine is.</li>
<li><b>Taper</b> — how much it narrows toward the tail. <b>Curl</b> — how much the spine bends at rest.</li>
<li><b>Wiggle strength</b> and <b>wiggle speed</b> — how much it undulates while swimming.</li>
<li><b>Limbs</b> (0–4 pairs) and <b>limb length</b>.</li>
<li><b>Skin pattern</b>: plain, spots, stripes or rainbow bands, with an evolving <b>accent colour</b>.</li>
<li><b>Antennae</b> (0–3, with glowing tips) and a <b>tail fin</b> (a translucent fan). Antennae see a little further but cost a little to keep; a big fin makes swimming cheaper.</li>
</ul>
<p>Shape is not just looks:</p>
<ul>
<li>Long bodies run <b>faster</b> but <b>turn slowly</b>.</li>
<li>Limbs help <b>turning</b> but add <b>drag</b> (more energy to move).</li>
<li>A strong wiggle makes swimming <b>cheaper</b>.</li>
<li>Shape counts toward species: when bodies drift far enough apart a new species appears, and it looks different from its parent.</li>
</ul>
<p>Other body genes: <b>size</b> (big = more energy storage and wins fights, but costs more to run), <b>speed</b>, <b>senses</b> (how far it sees; costs energy), <b>diet</b> (plants ↔ meat; plant-eaters digest meat badly and the reverse), <b>armor</b> (harder to bite or drain, but costs energy), <b>sunlight</b> (makes energy from daylight like a plant, at the price of digesting less food), <b>metabolism efficiency</b>, <b>fat</b>, <b>temperature range</b>, <b>toxin resistance</b>, <b>disease resistance</b>, <b>lifespan</b>, <b>maturity age</b>, <b>how much to invest in children</b>, and two <b>mutation rates</b> (one for body, one for brain) that evolve too.</p>
<p>Look for trade-offs: nothing is free. A tough, fast, far-seeing, disease-proof mote burns energy so quickly that it starves. Evolution finds the balance that fits the dish you built.</p></details>

<details><summary>Brains: what motes sense and do</summary>
<p>Every mote's brain is a small <b>recurrent neural network</b>. Senses go in on the left, actions come out on the right, and in between are <b>hidden neurons</b> that can hold memory. Tap a mote to watch its brain fire live. Green lines excite, red lines suppress; thicker means stronger.</p>
<p>Brains <b>evolve their own structure</b>: mutations re-weight links, add links, remove links and split a link to insert a new hidden neuron. When two motes mate, their brains are combined link by link. Brains that cost more to run drain more energy, so they only grow when the extra thinking pays off. A brain can grow up to <b>48 hidden neurons and 420 connections</b>, and a hidden neuron can connect to itself, which gives it a short memory.</p>
<p>The six founders start with simple built-in instincts (a grazer walks toward plants and flees hunters, a hunter chases and bites, and so on). Everything beyond that is discovered. Nobody told them what a scent means, that hoarding is possible, that stealing works, or that a wall protects you.</p>
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
<li><b>Food:</b> plant pellets grow in clumps, so some places are rich and some are deserts. When a mote dies it leaves <b>meat</b> that rots away in about a minute. Hunters and scavengers digest meat well.</li>
<li><b>Temperature, toxin and scents</b> are fields you can see with the <b>View</b> button. Toxin spreads slowly. Scents spread and fade over about half a minute, so they work like messages and trails. Motes that are releasing a scent show a coloured ripple.</li>
<li><b>Structures</b> motes can build: walls (block movement), farms (grow food), nests (heal and boost babies), granaries (store energy). They decay unless motes repair them by building the same thing again on them. A mote can also dig them down, so raiders are possible.</li>
<li><b>Random events</b> (optional, on by default): blooms of food, cold snaps, heatwaves, plagues and toxic spills. You can also call them yourself from Menu → Dish.</li>
</ul></details>

<details><summary>Drama you may see (none of it is scripted)</summary>
<ul>
<li><b>Predators and prey</b>: hunters chase and bite. Prey evolve to flee, to armor up, or to out-run them. Notice the yellow flash above a mote that is biting.</li>
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
<li><b>Stars</b>: star any mote and its story is kept even after it dies (age, children, how it died).</li>
<li><b>Stats → Records</b>: oldest, most children, most kills, biggest brain, deepest generation.</li>
</ul></details>

<details><summary>While you are away, saving, and moving dishes</summary>
<ul>
<li>Your dish <b>saves itself</b> on this device every 15 seconds and whenever you leave.</li>
<li>When you come back after a while, the dish <b>fast-forwards</b>: 1 second away is 0.25 seconds of dish time, up to about 40 dish-minutes, and you get a welcome-back report (births, deaths, new species, structures). The last dozen motes are protected during the fast-forward so you never return to an empty dish. You can tap <b>Skip ahead</b> to stop early.</li>
<li><b>Phone ↔ PC:</b> Menu → Dish → <b>Download dish file</b> or <b>Copy dish code</b>, then <b>Load</b> it on the other device. Each device keeps its own copy.</li>
<li><b>Dish settings:</b> max population (lower on slow phones), food abundance, random events on or off, and a New dish button (erases the current one).</li>
<li><b>The first dish you see is not new.</b> Before shipping, it was fast-forwarded on the developer's PC for several dish-years (a dish-year is 365 days of 200 seconds, about 20 hours) so the motes had already evolved. Its Diary holds those years. You can start over from the first six founders any time (Menu → Dish) or reload the pre-evolved dish.</li>
<li>Install: open the site in Chrome, choose <b>Add to Home screen</b>. It then works offline.</li>
</ul></details>

<details><summary>Sight, smell, memory, walls and pods</summary>
<ul>
<li><b>Sight and smell have range.</b> A mote sees other motes out to 50–240 units depending on its sense gene (hunters see a bit further). It smells <i>food</i> up to 1.5× that far. Antennae add a little more.</li>
<li><b>Walls block everything.</b> Nothing sees, smells or walks through a wall. Food or prey on the far side is simply not noticed, so motes have to go around. Scents and toxin also spread around walls, not through them. Motes steer away from walls on instinct, and turn when they bump one.</li>
<li><b>Short-term memory.</b> Each mote remembers where it last saw food and where it last got hurt. The memory fades over about 15 seconds and clears when it gets there. Brains can read these memories as senses (<i>mem_food_f/s/t</i>, <i>mem_foe_f/s/t</i>) plus a slow <i>mood</i> (fed versus hungry). Tap a mote to see the green dotted line to the food it remembers and a red ring where it was hurt.</li>
<li><b>Instincts you can see.</b> Everything has an inherited like or dislike for each scent. Everything flees toxin. Everything steers toward its favourite temperature.</li>
<li><b>Pods.</b> Two motes with a strong two-way friendship stay close and even out their energy, so the fed one feeds the hungry one. A gold line joins podmates. Pods ride out famine together.</li>
<li><b>Looks.</b> Bodies come in six styles (beads, smooth tubes, diamonds, stars, rings, leaves) with spikes, one to four eyes or none, dorsal frills and bioluminescent glow. Spikes add a little armour, and frills and glow cost a little energy. All of it is inherited and mutates, and big differences make new species.</li>
<li><b>Disasters.</b> Menu → Dish has Ice age and Drought, the ☄️ Meteor tool drops a crater anywhere, and random events now include rare meteors and droughts too (only when the dish is healthy).</li>
</ul></details>

<details><summary>Things to try</summary>
<ul>
<li>Pause, tap a hunter, hit <b>Follow</b>, and watch its brain while it hunts.</li>
<li>Wall off half the dish for ten minutes (use 8×), then remove the wall and see which side evolved differently.</li>
<li>Paint a ring of cold around one species' home. Do they evolve fat and armor, or migrate?</li>
<li>Release a plague into the biggest herd. Who survives?</li>
<li>Spotlight a species (Menu → Species → 🔦) and watch where its motes live and travel. Open 🌳 Tree to see how every species is related.</li>
<li>Build a wall with a gap and drop food behind it. Do they find the gap?</li>
<li>Put a Scent A patch near food over and over. Does anyone start following it?</li>
<li>Press <b>Spark</b> in a quiet corner a few times and watch the newcomers either take over or get eaten.</li>
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
