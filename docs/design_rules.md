# Design rules

## Rule classification

Each rule belongs to one of four categories:

- **Source geometry rule**: derived from IFC or manual project geometry.
- **Reference product rule**: based on a named public product, not Avelis confirmation.
- **Software integrity rule**: protects identifiers, units and data consistency.
- **Release gate**: blocks structural or machine claims when required data is missing.

## Implemented geometry rules

1. Wall and opening dimensions must be finite and positive.
2. Openings must remain within the wall envelope.
3. Openings may not overlap in X/Z.
4. Door openings start at the panel base in this workflow.
5. Top and bottom tracks follow the panel envelope; the bottom track is split at doors.
6. Each opening receives two full-height jamb studs and one header track.
7. Each window receives one sill track.
8. Grid studs that cross a clear opening are replaced by upper/lower cripple studs as applicable.
9. No generated component may cross a clear opening or leave the wall envelope.
10. IDs must be unique and every profile must resolve to a sourced catalog row.

## Reference rules

The working grid is 600 mm because the Metsec SFS 2024 brochure illustrates typical studs at 600 mm centres. The same manufacturer states that stud size, gauge and centres are determined by design. Therefore 600 mm is a candidate-generation reference, never a verified load-bearing spacing.

The application warns when a manually entered door width is below the conditional 900 mm nominal French accessibility reference. It does not decide regulatory applicability.

## Rules deliberately not implemented

- Eurocode load combinations and member resistance;
- global and local buckling;
- deflection and vibration;
- diaphragm/bracing design;
- screw, bolt, weld and anchor resistance;
- fire, acoustic, thermal and moisture performance;
- execution classes and manufacturing tolerances;
- machine stock lengths, tool paths or NC instructions.

These omissions result in `ENGINEERING_REVIEW_REQUIRED` and `BLOCKED_PENDING_AVELIS_CAPABILITY_CONFIRMATION`.
