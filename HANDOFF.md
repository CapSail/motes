# MOTES: running log (newest at the bottom)

## 2026-11-20: first build
- Cap asked for a micro-organism sandbox for phone and PC. His answers: top-down petri dish; everything (evolution, raising favourites, building the world, ecosystem drama); the dish catches up while he is away; its own standalone app. Then: visuals do not need polish, the **engine/possibilities** do. "Over the top".
- Built: `sim.js` engine (see README), plain UI in `ui.js`, PWA files. Headless tests (`scripts/sim-test.mjs`, seeds 1-3, 12-45 sim-minutes): boom/bust cycles, brains grow (avg 5 hidden neurons by minute 30), species split and go extinct, parasitism, cooperation, hoarding, building, plagues all appear on their own. Save is about 450 KB; round trip tested. UI checked in the browser pane (render, inspector with live brain, all menu tabs, catch-up overlay). Not yet tried on Cap's real phone.
- **Deployed 2026-11-20 with Cap's OK**: repo https://github.com/CapSail/motes (public), GitHub Pages from `main` root, live at https://capsail.github.io/motes/ (checked live: loads, sim runs, service worker active, no console errors). Deploy = `git push` to `main` (no build step); Pages takes about a minute. Nothing private is in this app.
- Not added to `PHONE_APPS.md` (the PM keeps that file).
- Ideas not built yet: sound, a lineage tree view, symbiosis/colony bodies, player-bred "pets" that stay across dishes, nicer art, haptics, IndexedDB save (localStorage is fine at ~450 KB but a big dish could hit the limit).
- `.claude/launch.json` in the ON SHIFT folder has a `motes-dev` entry (node serve.mjs 5200) used for previews.

## 2026-11-20 (later): evolving squiggle bodies
- Cap asked for procedurally generated squiggle shapes that evolve. Added 8 shape genes (segments, length, taper, curl, wiggle amplitude and frequency, limb count and length). Bodies are drawn as a curling, wiggling spine of segments with limbs and eyes. Shape also changes physics: long bodies run faster but turn slowly, limbs turn better but cost drag, strong wiggle swims cheaper. Shape genes count toward speciation, so new species look different. Old saves load with neutral padded shape genes (a New dish gives the varied founders). Headless run still stable; checked in the browser pane, no console errors. Pushed to main (live site updates in about a minute).

## 2026-11-20 (later still): friendships and families, bigger brains, in-app Guide
- Cap asked for friendships and families. Added: parent/child/sibling recognition, 4-slot friend/grudge address book per mote (bonds grow from proximity and sharing, grudges from bites and stealing, fade over time), 7 new brain senses (mote_rel, mote_friend, friend_f/s, fam_f/s, famcount; NI is now 52, old saves still load), a bond gene (NB=29), starter instincts (drift toward friends/relatives, feed a hungry relative), devoted-pair bonus, inbreeding penalty, diary firsts, Stats counters, inspector text and friend (green) / family (gold) / grudge (red) lines for the selected mote.
- Brain limits raised to 48 hidden neurons / 420 connections; hidden self-loops (memory) allowed.
- Added `guide.js`: in-app Guide tab (opens on first run, `?` button) built from the engine's own sense/action names.
- Headless runs (seeds 1-3, 24-30 min) stay healthy: boom/bust, 4-10 species, family feeding, bonded pairs and inbreeding all occur.
- Not done: the wild-founder random hidden-neuron seeding was dropped when Cap redirected; no analysis yet of whether scent communication evolves; sound still missing.

## 2026-11-20 (night): evolved starter dish, look varieties, yearly journal, follow mode
- **Pre-evolved dish**: `scripts/evolve.mjs <seed> <years> <out>` fast-forwards a dish headless (1 dish-year = 365 days x 200 s; about 4 min of PC time per year at pop 500; mercy floor on). Three 3-year runs (seeds 21-23, `scripts/pick.mjs` scores them): seed 22 won (9 species, 80 hunters, 254 structures, ~33 hidden neurons per mote on average). Shipped as `starter/dish.json` (1.3 MB). First visit offers "Watch it" or "Start a fresh dish"; Menu -> Dish can reload it. Log of the run: `scripts/evolve-seed22.log`.
- Honest finding: every long run lost diversity with time (2-9 species after 3 years from 68 at year 0.25), and species churn is very high (about 1800 tiny species born and gone per year) because SPLIT is low. Not tuned yet; raising `SPLIT` in `sim.js` is the first thing to try.
- Stealing was nerfed (rate 2.6, efficiency 0.5, thief pays upkeep).
- **Look genes** (NB=33): pattern (plain/spots/stripes/bands), accent colour, antennae, tail fin; fin and antennae have small trade-offs.
- **Journal**: year stamps, "Year N in review" entries every dish-year, filters, permanent `w.keep` log for firsts/years/stars.
- **Follow mode**: Follow hides the info panel and leaves a "Following ... info / stop" chip; tapping empty water or pinching keeps following; dragging the map stops it.
- Test tip: the app saves on page leave, so to test the first-visit flow in a browser run `localStorage.clear(); Storage.prototype.setItem=()=>{}` before reloading.
- `prompt()` (Rename) does not work in the Claude browser pane but is fine in real browsers.

## 2026-11-20 (late): install instructions for every phone type
- Cap wanted instructions for new users on making it an app for each phone type. Added a **📲 Install** menu tab (detects Android Chrome, Samsung Internet, iPhone/iPad Safari, Firefox Android, desktop; opens and marks the visitor's own section; shows a one-tap "Install Motes now" button when the browser fires `beforeinstallprompt`; says "already installed" in standalone mode), an "Install it as an app" button on the first-visit screen, and an Install section in `README.md`. Checked with Android emulation in the browser pane. iOS and Samsung steps are written from known behaviour, not tested on those devices.
