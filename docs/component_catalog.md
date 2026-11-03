# Component catalog

## Reference product boundary

The catalog uses public voestalpine Metsec Metframe data to prove that the software can consume real manufacturer data. It is not a statement that Avelis uses Metsec products.

All selected structural components are described by Metsec as pre-hot-dip galvanized Z275 steel with minimum yield strength 450 N/mm². C sections are described for wall studs; tracks are described for the top and bottom of wall panels.

## Sourced profiles

| Runtime ID | Manufacturer reference | Family | Web (mm) | Flange (mm) | Lip (mm) | Nominal t (mm) | kg/m |
|---|---|---|---:|---:|---:|---:|---:|
| 100MF12-50 | 100MF12/50 | lipped C stud | 100 | 50 | 14 | 1.2 | 2.11 |
| 100MF12-70 | 100MF12/70 | lipped C stud | 100 | 70 | 15 | 1.2 | 2.44 |
| 100MF14-70 | 100MF14/70 | lipped C stud | 100 | 70 | 15 | 1.4 | 2.85 |
| 104MF12 | 104MF12 | U track | 104 | 62 | 0 | 1.2 | 2.11 |
| 104MF14 | 104MF14 | U track | 104 | 65 | 0 | 1.4 | 2.46 |

Source: [Metframe Components](https://www.metsec.com/products/metframe/components/), rows named above, retrieved 2026-11-03.

## Compatible reference sets

- `MF-12-50`: 100MF12/50 stud + 104MF12 track.
- `MF-12-70`: 100MF12/70 stud + 104MF12 track.
- `MF-14-70`: 100MF14/70 stud + 104MF14 track.

These pairings are geometric reference sets for the concept workflow. Structural suitability and connection compatibility must be approved by the system supplier and structural engineer.

## Display geometry versus calculation geometry

The canvas, DXF and STL show the external bounding envelope of a C or U section. This keeps the coordination and FabLab model robust. The envelope volume is never interpreted as steel volume. Quantities use manufacturer kg/m.

## Independent mass check

The program computes a separate approximation:

`m' = developed flat width × nominal thickness × 7850 kg/m³`.

The check is intentionally approximate because bend radii, corner development and detailed coating geometry are omitted. It is used to detect transcription errors, not to replace manufacturer data.
