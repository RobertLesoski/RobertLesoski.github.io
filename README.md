# robertlesoski.github.io

Personal research site for **Robert G. Lesoski**: meteorology, CM1 severe-storm modeling and neural emulators, a GPU flood model of Warren County, KY, weather software, and the path toward emergency-management decision support.

Live site: https://robertlesoski.github.io/

## Pages

| Page | What it covers |
|---|---|
| `index.html` | Overview, filterable featured work, in-motion clips, dated timeline, off-the-grid corner, contact |
| `flood.html` | Flood-model deep dive: pipeline, solver math, rainfall design, calculators, verification, validation, gallery, karst and infrastructure roadmap |
| `nwp-lab.html` | The real CM1 supercell run, the `cm1lab` emulator toolkit, measured results with failures, and the HSLC / ZDR research plan with its planner and namelist explorer |
| `emergency-management.html` | Readiness ladder (L1-L8), NWP and flood tracks, field operations, guardrails per output, validation-data wish-list |

## Notes on the content

- Flood depths are research-model output and are **not validated**. Nothing here is for safety, insurance, engineering or emergency decisions.
- Items marked "plan" are intentions, not results. Emulator results come from **one** CM1 storm and do not show generalization or a speed-up.
- Conceptual schematics (ZDR column, HSLC regime map) are illustrations, not data.
- Videos in `assets/video/`: `ev6-tour.mp4` is a cinematic export from my desktop flood viewer (county domain, event 6, hour 24; unvalidated; the not-validated line is burned into every frame). `cm1-supercell.mp4` is real CM1 output and `emulator-vs-cm1.mp4` compares an emulator rollout with CM1 on held-out times (emulator output is **not** a CM1 simulation). `solver.mp4` (local-inertial scheme on **synthetic** terrain), `bubble.mp4` (2-D warm-bubble toy, **not CM1 output**) and `ensemble.mp4` (**invented** numbers) are my own illustrations and are labelled as such in-page.
- Screenshots come from the `bg-flood-map` desktop viewer. Terrain: USGS 3DEP and KyFromAbove. Contains data © OpenStreetMap contributors (ODbL).
- The three photography slots on the home page (`assets/img/photo-*.webp`) currently hold credited open-license stand-ins. To use my own photos, overwrite those files and update the captions in `index.html`.

## Image credits

- Placeholder photos on the home page (replace with my own): bridges at Ashland by Antony-22 (CC BY-SA 4.0), a thunderstorm over eastern Kentucky by Ken Lund (CC BY-SA 2.0), WKU campus by Bbadgett (CC BY-SA 3.0); all via Wikimedia Commons, resized.
- NWS / NOAA graphics on the flood page (Barren River hydrograph, April 2025 and May 2010 rainfall maps) are US government works.
- Everything else is my own work or output of my own models; see captions.

## Tech

Static HTML, CSS and vanilla JavaScript. No framework, no build step, no tracking. Inter and JetBrains Mono are self-hosted (`assets/fonts`, SIL OFL). Dark by default with a light-theme toggle. Math is rendered with KaTeX from cdnjs on the flood page (optional: the page stays readable without it). Charts are small SVG/JS modules in `assets/js/tools.js` and `assets/js/emu.js`; emulator numbers live in `assets/js/emu-data.js`.

## Local preview

```bash
python -m http.server 8000
# open http://localhost:8000
```

Built with [Claude Code](https://claude.com/claude-code).
