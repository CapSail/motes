# MOTES: running log (newest at the bottom)

## 2026-11-20: first build
- Cap asked for a micro-organism sandbox for phone and PC. His answers: top-down petri dish; everything (evolution, raising favourites, building the world, ecosystem drama); the dish catches up while he is away; its own standalone app. Then: visuals do not need polish, the **engine/possibilities** do. "Over the top".
- Built: `sim.js` engine (see README), plain UI in `ui.js`, PWA files. Headless tests (`scripts/sim-test.mjs`, seeds 1-3, 12-45 sim-minutes): boom/bust cycles, brains grow (avg 5 hidden neurons by minute 30), species split and go extinct, parasitism, cooperation, hoarding, building, plagues all appear on their own. Save is about 450 KB; round trip tested. UI checked in the browser pane (render, inspector with live brain, all menu tabs, catch-up overlay). Not yet tried on Cap's real phone.
- Local git repo only. **Not deployed, no remote.** Hosting needs Cap's OK (GitHub Pages would be public; nothing private is in this app).
- Not added to `PHONE_APPS.md` (the PM keeps that file).
- Ideas not built yet: sound, a lineage tree view, symbiosis/colony bodies, player-bred "pets" that stay across dishes, nicer art, haptics, IndexedDB save (localStorage is fine at ~450 KB but a big dish could hit the limit).
- `.claude/launch.json` in the ON SHIFT folder has a `motes-dev` entry (node serve.mjs 5200) used for previews.
