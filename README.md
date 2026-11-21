# Motes

A petri dish of tiny evolving digital organisms. Runs in any browser, installs to the phone home screen (PWA), works on PC too. No build step, no dependencies.

## Run it
```powershell
node serve.mjs 5200      # then open http://127.0.0.1:5200
node scripts/sim-test.mjs 1 30   # headless engine run: seed 1, 30 sim-minutes
```
Files: `sim.js` (the engine, pure JS), `ui.js` + `index.html` (plain UI), `sw.js` + `manifest.webmanifest` + icons (PWA).

## What the engine does
- **Every mote has an evolving brain**: a small recurrent neural net (NEAT-style). Neurons get added, connections get added/removed/re-weighted, crossover matches connections by innovation id. 52 senses in, 13 actions out, up to 48 hidden neurons and 420 connections.
- **Senses** (sight 50-240 units, smell of food 1.5x further; plus an innate reflex that follows liked scents, flees toxin and seeks a favourite temperature): food (plant and meat), nearest mote (size, kinship, diet, energy, armor, whether it is biting), nearest kin, walls on three rays, what tile it stands on, granary stock, temperature, toxin, light, sickness, three chemical channels with gradients, a clock, noise, pain, touch.
- **Actions**: thrust, turn, bite, emit scent A/B/C, build wall/farm/nest/granary, dig, give-or-take energy (altruism, trade, parasitism, hoarding), mate willingness.
- Nobody scripted what scents mean, whether to hoard, steal, build walls or hunt kin. Founders have simple hand-wired instincts; everything after is evolution.
- **Body genes**: a procedural squiggle shape (segments, length, taper, curl, wiggle, limbs; drawn as a wiggling creature and it changes how the body moves), size, speed, senses, diet, armor, photosynthesis, metabolism efficiency, fat, temperature range, toxin and disease resistance, lifespan, maturity age, mutation rates (that evolve too), colour.
- **World**: day/night light, temperature fields you can paint, toxin that diffuses, three diffusing scent channels, food that grows in clumps, corpses that become meat, farms (grow food), nests (heal, boost newborns), granaries (stored energy), decaying structures that builders repair.
- **Drama**: predators, cannibals, parasites, plague (spreads on contact, resistance evolves), altruists, builders, species that split on their own (names generated), extinctions, random blooms / cold snaps / heatwaves / toxic spills.
- **Diary** logs firsts (first kill, first mating, first granary, first parasite, a brain growing its first neuron) and every speciation and extinction. **Stats** shows population / species / brain-size history and records.
- **Short-term memory**: each mote remembers where it last saw food and where it was last hurt (fades over ~15 s), readable by its brain as senses.
- **Walls are solid**: they block movement, sight, smell and the spread of scents. **Pods**: strongly bonded friends stay together and share energy. **Disasters**: meteors, ice age, drought, plus the older events.
- **Looks**: six body styles, spikes, eyes, frills, glow (all inherited).
- **Controls**: built for thumbs. Four big buttons at the bottom (Look, Build, Climate, Powers) open panels of tools that each explain themselves; the active tool shows a bar with brush size and a Done button; powers report what they did (for example Infected 3 motes). The Menu is a home screen of big cards with a Back button.
- **Tools for you**: spotlight a species, family tree of species (🌳), save a picture, optional sound and haptics, backup storage for big dishes.
- **A new game starts at Day 1, generation 0**, from five lineages whose brains were evolved on a computer plus one hand-wired hunter lineage, so a fresh dish survives on its own (`founders.js`, built by `scripts/pool.mjs` and `scripts/make-founders.mjs`). Nothing rescues a dish that is dying. Creatures have American names and children carry their parent's last name.
- **Brain viewer**: tap a mote to see its actual network, live, with activations.
- **While you are away** the dish keeps living (1 away-second = 0.25 dish-seconds, capped at 40 dish-minutes), with a welcome-back report. The last few motes are protected during catch-up.
- Dish is saved on the device. Export/import a dish file or code to move it between phone and PC.

## Install it as an app
Open https://capsail.github.io/motes/ and add it to your home screen. It then runs full-screen and offline. The app also has these steps built in (☰ → 📲 Install), and shows a one-tap Install button where the browser allows it.
- **Android (Chrome):** ⋮ menu → Install app (or Add to Home screen) → Install.
- **Samsung Galaxy (Samsung Internet):** ≡ menu → Add page to → Home screen → Add.
- **iPhone / iPad (Safari):** Share button (square with up arrow) → Add to Home Screen → Add. The home-screen app keeps saves separate from the Safari tab; use Menu → Dish → Copy dish code to move a dish.
- **Firefox Android:** ⋮ menu → Install.
- **Computer (Chrome / Edge):** install icon at the right end of the address bar, or ⋮ → Cast, save and share → Install page as app.

## Status
Local only. Nothing is deployed or pushed. See `HANDOFF.md`.
