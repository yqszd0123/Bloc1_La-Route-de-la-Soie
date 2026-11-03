# IFC pipeline

## Standards basis

The importer follows the public buildingSMART IFC documentation and identifies the current international data-schema reference as ISO 16739-1:2024. The paid ISO text was not accessed; no ISO certification claim is made.

The implementation reads the ISO 10303-21 physical file, including:

- `FILE_SCHEMA`;
- `IfcProject` and `IfcUnitAssignment`;
- `IfcBuilding`, `IfcBuildingStorey`, `IfcRelAggregates`;
- `IfcRelContainedInSpatialStructure`;
- `IfcWall`, `IfcWallStandardCase`, `IfcWallElementedCase`;
- `IfcOpeningElement` and `IfcRelVoidsElement`;
- `IfcDoor` / `IfcWindow` and `IfcRelFillsElement`;
- nested `IfcLocalPlacement` and `IfcAxis2Placement2D/3D`;
- Body representations using `IfcExtrudedAreaSolid` with polyline or rectangular profiles.

## Processing stages

1. Verify the `ISO-10303-21` signature and declared IFC schema.
2. Tokenize STEP entities while preserving nested lists and quoted strings.
3. Resolve the project length unit and convert once to millimetres.
4. Reconstruct the project → building → storey containment graph.
5. Compose nested local-placement matrices into world coordinates.
6. Select each wall Body representation, project its eight solid corners, then normalize the dominant horizontal profile axis to panel X (length), the other horizontal axis to panel Y (thickness), and the extrusion axis to panel Z (height).
7. Resolve wall → opening through `IfcRelVoidsElement`.
8. Resolve opening → door/window through `IfcRelFillsElement`.
9. Project every opening solid into the same normalized panel coordinate system; this removes the IFC profile-origin convention from door/window positions.
10. Convert the chosen wall to the shared `WallInput` and run the normal steel-panel chain.

## Verified fixture

`test-data/ifc/wall-with-opening-and-window.ifc` is a real IFC4 file from the buildingSMART specification examples. Its parsed reference values are:

| Item | Program result |
|---|---:|
| Length unit | millimetre |
| Wall | 3000 × 300 × 2000 mm |
| Window opening X | 1000 mm |
| Window sill | 500 mm |
| Window opening | 1000 × 1000 mm |
| Spatial container | `IfcBuildingStorey #38` |

Automated tests also modify the fixture placement to verify a 100/200 mm translation and 90° rotation.

`test-data/ifc/partie1-four-walls.ifc` is the four-wall IFC4 model supplied by the team. It verifies two interoperability cases that the single-wall fixture does not cover: centred rectangular profiles and wall length carried by either local profile X or local profile Y.

| Wall | Program result | Source length axis | Openings |
|---|---:|---:|---|
| Mur Sud | 10000 × 300 × 2500 mm | X | window x=1750/sill=500/1500 × 1500 mm; door x=7100/sill=0/800 × 1750 mm |
| Mur Nord | 10000 × 300 × 2500 mm | X | none |
| Mur Ouest | 1900 × 300 × 2500 mm | Y | none |
| Mur Est | 1900 × 300 × 2500 mm | Y | none |

All four walls are passed independently through the same variant generator; the regression test requires six valid candidates for each wall. This fixture is an internal verification model, not an engineering-data or standards source.

## Supported and unsupported geometry

The parser intentionally supports a documented subset that is sufficient for standard extruded walls and openings. It rejects files with no supported wall Body instead of inventing dimensions. Advanced BRep, mapped, tessellated, curved and boolean geometry should be delegated to a full geometry kernel in a later industrial version.

## Consistency checks

- declared unit exists and is supported;
- referenced entities exist;
- placement cycles are rejected;
- wall Body and opening Body are present;
- opening coordinates are compared to the wall envelope downstream;
- the filler entity class determines `DOOR`, `WINDOW` or unfilled `OPENING`;
- centred or offset profile origins and local X/Y wall orientations produce the same lower-left panel convention;
- the source fingerprint and IFC entity IDs are retained in exports.
