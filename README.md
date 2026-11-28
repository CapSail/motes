# Motes

A petri dish of tiny evolving digital organisms. Runs in any browser, installs to the phone home screen (PWA), works on PC too. No build step, no dependencies.

## Run it
```powershell
node serve.mjs 5200      # then open http://127.0.0.1:5200
node scripts/sim-test.mjs 1 30   # headless engine run: seed 1, 30 sim-minutes
```
Files: `sim.js` (the engine, pure JS), `ui.js` + `index.html` (plain UI), `sw.js` + `manifest.webmanifest` + icons (PWA).

## What the engine does
- **Every mote has an evolving brain**: a small recurrent neural net (NEAT-style). Neurons get added, connections get added/removed/re-weighted, crossover matches connections by innovation id. 69 senses in, 13 actions out, up to 48 hidden neurons and 420 connections.
- **Senses** (sight 50-240 units, smell of food 1.5x further; plus an innate reflex that follows liked scents, flees toxin and seeks a favourite temperature): food (plant and meat) and how rich it is around, nearest mote (size, kinship, diet, energy, armor, whether it is biting), nearest prey, nearest threat, direction of the crowd, nearest kin, family and friends, food and danger memory, soil richness, walls on three rays, what tile it stands on, granary stock, temperature, toxin, light, sickness, three chemical channels with gradients, a clock, noise, pain, touch.
- **Actions**: thrust, turn, bite, emit scent A/B/C, build wall/farm/nest/granary, dig, give-or-take energy (altruism, trade, parasitism, hoarding), mate willingness.
- Nobody scripted what scents mean, whether to hoard, steal, build walls or hunt kin. Founders carry evolved brains plus a few instincts; everything after is evolution.
- **Body genes**: a procedural squiggle shape (segments, length, taper, curl, wiggle, limbs; the body trails the head like a snake and every part has a cost and a payoff), **arms with a tool** (claw, spear, club = weapons; pincer, scoop, rake = gathering tools), size, speed, senses, diet, armor, photosynthesis, metabolism efficiency, fat, temperature range, toxin and disease resistance, lifespan, maturity age, mutation rates (that evolve too), colour.
- **World**: day/night light, temperature fields you can paint, toxin that diffuses, three diffusing scent channels, food that grows in clumps, corpses that become meat, farms (grow food), nests (heal, boost newborns), granaries (stored energy), decaying structures that builders repair.
- **Drama**: predators, cannibals, parasites, plague (spreads on contact, resistance evolves), altruists, builders, species that split on their own (names generated), extinctions, random blooms / cold snaps / heatwaves / toxic spills.
- **Diary** logs firsts (first kill, first mating, first granary, first parasite, a brain growing its first neuron) and every speciation and extinction. **Stats** shows population / species / brain-size history and records.
- **Short-term memory**: each mote remembers where it last saw food and where it was last hurt (fades over ~15 s), readable by its brain as senses.
- **Walls and bodies are solid**: walls stop whole bodies, sight, smell and scents; creatures push each other apart, except a biter closing on its victim; nothing spawns inside a wall; drawn walls cannot be dug out by creatures. **Pods**: strongly bonded friends stay together and share energy. **Disasters**: meteors, ice age, drought, plus the older events.
- **Looks**: rounded, shadowed, wet-looking bodies with a head per body plan and eyes that look and blink, over a textured dish floor; muted natural palette, six body plans (ringed worm, slug, plated crawler, see-through microbe, bristle worm, flatworm), three tail types, five eye types, skin markings, thorns, ruffled hems; no glow. Pebble walls, soil farms, woven nests, clay-pot granaries, algae and scrap food. All drawn in code, no image assets.
- **Controls**: built for thumbs. Four big buttons at the bottom (Look, Build, Climate, Powers) open panels of tools that each explain themselves; the active tool shows a bar with brush size and a Done button; powers report what they did (for example Infected 3 motes). The Menu is a home screen of big cards with a Back button.
- **Tools for you**: spotlight a species, family tree of species (🌳), save a picture, optional sound and haptics, backup storage for big dishes.
- **A new game starts at Day 1, generation 0**, from five lineages (one of them meat-eating) whose brains were evolved on a computer, so a fresh dish survives on its own (`founders.js`, built by `scripts/pool.mjs` and `scripts/make-founders.mjs`). Nothing rescues a dish that is dying. Creatures have American names and children carry their parent's last name.
- **Sunlight is not free**: it is weak (`SUN.k` in sim.js) and needs soil minerals that sun-eaters use up; minerals return from waste and from every body that dies (`NUT` in sim.js, 👁 → Soil richness shows it). Eating needs no soil.
- **Brain viewer**: More details, Show brain gives a plain-words panel (what it senses, what it decides, why) and an optional live wiring map.
- **Eating and biting show**: arms reach, grab a pellet and carry it to the mouth; jaws snap, meat-eaters show teeth, bites leave tooth marks and a red burst on a kill.
- **Meat-eaters evolve**: a small taste for meat is cheap, a specialist pays a lot; dishes grow meat-leaning omnivores.
- **Optional parts** that only some lineages grow: stinger (poisons through a bite), camouflage (noticed only up close while slow), water jet (burst of speed). Each costs upkeep.
- **Survival first**: hunger steers to food, no sprinting with nothing in sight, no building or gifts when low, unarmed plant-eaters flee biters, no breeding into a famine.
- **Immortals and their journals**: a starred creature cannot die and keeps a detailed life journal (`journal.js`): portrait, family, friends, grudges, fights, deeds, every cheated death, world events and a daily review; filter, copy or save as text.
- **Killers**: New life drops three purpose-built predators about one time in ten; carnivores hunt by instinct, rest when full and stay rare.
- **Personal space**: creatures drift away from crowds so food does not pile everyone into one clump.
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
Finished and live at https://capsail.github.io/motes/ (GitHub Pages from `main`). To restart every device's dish after a big change, bump `WORLD_VER` in `ui.js`. Tests: `scripts/solid-test.mjs`, `churn-test`, `events-test`, `wall-test`, `ext-test` (survival), `clump-test`. Full history in `HANDOFF.md`.
