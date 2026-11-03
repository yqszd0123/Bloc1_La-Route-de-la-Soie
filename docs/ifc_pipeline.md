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
6. Select each wall Body representation and derive length, height and thickness.
7. Resolve wall → opening through `IfcRelVoidsElement`.
8. Resolve opening → door/window through `IfcRelFillsElement`.
9. Express opening coordinates in the local coordinate system of the wall.
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

## Supported and unsupported geometry

The parser intentionally supports a documented subset that is sufficient for standard extruded walls and openings. It rejects files with no supported wall Body instead of inventing dimensions. Advanced BRep, mapped, tessellated, curved and boolean geometry should be delegated to a full geometry kernel in a later industrial version.

## Consistency checks

- declared unit exists and is supported;
- referenced entities exist;
- placement cycles are rejected;
- wall Body and opening Body are present;
- opening coordinates are compared to the wall envelope downstream;
- the filler entity class determines `DOOR`, `WINDOW` or unfilled `OPENING`;
- the source fingerprint and IFC entity IDs are retained in exports.
