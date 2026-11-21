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
