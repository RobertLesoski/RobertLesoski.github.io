# robertlesoski.github.io

Personal research site for **Robert G. Lesoski**: meteorology, CM1 severe-storm modeling, a GPU flood model of Warren County, KY, and the path toward emergency-management decision support.

Live site: https://robertlesoski.github.io/

## Pages

| Page | What it covers |
|---|---|
| `index.html` | Overview, projects, dated timeline, principles |
| `flood.html` | Flood-model deep dive: pipeline, solver math, rainfall design, calculators, verification, validation, gallery |
| `nwp-lab.html` | CM1 research plan: HSLC / ZDR-column questions, experiment design, config sketch, grid planner, namelist explorer |
| `emergency-management.html` | Readiness ladder (L1-L8), guardrails per output, validation-data wish-list, proposed next steps |
| `knowledge-base.html` | The 324-note meteorology vault: structure, link graph, convective-parameter reference |

## Notes on the content

- Flood depths are research-model output and are **not validated**. Nothing here is for safety, insurance, engineering or emergency decisions.
- Items marked "plan" are intentions, not results.
- Conceptual schematics (ZDR column, HSLC regime map) are illustrations, not data.
- Videos in `assets/video/`: `tour.mp4` is a cropped screen capture sequence from the real desktop viewer (unvalidated depths). The other three are my own small simulations and are labelled as such in-page: `solver.mp4` (local-inertial shallow-water scheme on **synthetic** terrain), `bubble.mp4` (2-D Boussinesq warm-bubble toy, **not CM1 output**) and `ensemble.mp4` (**invented** numbers illustrating exceedance probability).
- Screenshots come from the `bg-flood-map` desktop viewer. Terrain: USGS 3DEP and KyFromAbove. Contains data © OpenStreetMap contributors (ODbL).

## Tech

Static HTML, CSS and vanilla JavaScript. No build step, no tracking. Math rendered with KaTeX from cdnjs (optional: pages remain readable without it). Charts and calculators are small SVG/JS modules in `assets/js/tools.js`.

## Local preview

```bash
python -m http.server 8000
# open http://localhost:8000
```

Built with [Claude Code](https://claude.com/claude-code).
