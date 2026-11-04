# System architecture

## Objective

Avelis Wall Flow 2.2 is a dependency-light, browser-first reference implementation of the Bloc 1 chain:

`IFC or manual geometry → semantic wall → steel panel candidates → checks → quantities and budget → neutral manufacturing package`.

The application does not duplicate the workflow for IFC and manual input. Both adapters create the same `WallInput`; every downstream calculation is shared.

## Repository structure

```text
apps/web/                       browser user interface
data/engineering_sources.json  authoritative engineering data and provenance
packages/core/src/
  data/                         generated browser copy of the source JSON
  domain/                       project, source catalog and rule-profile model
  ifc/                          ISO 10303-21 parser and IFC semantic adapter
  generation/                   steel panel and component generation
  manufacturing/                source-backed component loading/assembly priority
  rules/                        geometry and release gates
  optimization/                 search, metrics, Pareto and ranking
  export/                       CSV, JSON, SVG, DXF, STL, STEP and ZIP
  prototype/                    layered-prototype geometry, quantities and dedicated CSV
schemas/                        proposed inter-block JSON contracts
test-data/ifc/                  real buildingSMART IFC fixture
tests/                          deterministic automated verification
docs/                           engineering and interface documentation
experiments/results/            generated reference cases
```

## Dependency direction

```text
engineering_sources.json
          ↓ sync-data
engineering-catalog.js → domain → IFC/manual adapters
                                    ↓
                              shared WallInput
                                    ↓
                     steel candidate generation
                                    ↓
              assembly priority → checks → metrics → ranking
                                    ↓
             UI + BOM + cutting list + neutral package
              ↓ read-only steel candidate
       cavity/panel part calculator → dedicated prototype CSV
```

No UI module performs an engineering calculation. The UI reads objects returned by `packages/core`; exports are also generated from those same objects.

## Main invariants

1. Every profile carries its manufacturer reference, source ID and kg/m.
2. Member mass is always `length × manufacturer kg/m`; display-envelope volume is never used.
3. Stable component IDs depend on semantic role, profile, position and length, not array order.
4. IFC and manual inputs call the same candidate generator.
5. Missing Avelis machine data produces a release block, not a guessed value.
6. Every exported package includes the engineering data snapshot used for the calculation.
7. Insulation is derived from the free X/Z space between generated steel envelopes and openings; other layers are one logical wall contour with opening cutouts.
8. Prototype-layer parts cannot mutate a steel candidate or enter IFC, STEP, steel BOM, steel cutting list or the manufacturing ZIP; their only export is a dedicated CSV.
9. Steel developed area is always marked approximate because bend radii are not represented.
10. Assembly order is calculated once in `manufacturing/assembly-priority.js`, remains continuous from 1 to the component count, and is reused by the UI and every manufacturing export.

## Browser visualisation boundary

`canvas-geometry.js` owns the shared projection and compound-polygon renderer, including opening holes. The steel viewer and layered-prototype viewer both consume it, so the project has one rendering foundation instead of duplicated 3D maths. `prototype-view.js` reads the selected steel candidate through `prototype/layered-wall-model.js`; the model calculates cavity rectangles, logical sheet contours, areas, volumes and the dedicated CSV without changing the steel package builder.

## Runtime

`START_APP.bat` starts the local static server and opens `http://127.0.0.1:8765/`. A local server is used so the official IFC fixture can be loaded by the browser without weakening browser file-security rules.

## Security and privacy

Uploaded IFC files are parsed in the browser and are not sent to a server by this application. The public Site is static. The repository contains only the buildingSMART test fixture, never a private Avelis IFC model.
