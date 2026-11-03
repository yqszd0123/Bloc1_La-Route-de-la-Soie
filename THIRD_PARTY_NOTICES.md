# Third-party notices

## Logiciel redistribué

### occt-import-js 0.0.23

- Projet : https://github.com/kovacsv/occt-import-js/tree/0.0.23
- Usage : lecture STEP/STP dans le navigateur et dans le test d’intégration Node.
- Licence du wrapper : LGPL-2.1 ; texte conservé dans `third_party/occt-import-js/dist/license.occt-import-js.txt`.
- Open CASCADE Technology : conditions et exception conservées dans `third_party/occt-import-js/dist/license.occt.txt`.
- Fichiers redistribués sans modification fonctionnelle : JavaScript, WebAssembly, worker et licences du paquet npm officiel 0.0.23.

## Données de test externes

- IFC : exemple buildingSMART `wall-with-opening-and-window.ifc`, source et URL dans `data/engineering_sources.json`.
- STEP : fixture `simple-basic-cube/cube.stp` de `occt-import-js` 0.0.23.

## Références sans code copié

La structure du projet suit des principes usuels de logiciels BIM/CAO open source — adaptateurs d’entrée, modèle métier commun, sorties dérivées — mais le domaine Avelis, la génération acier, les contrôles, l’optimisation et les exports ont été écrits dans ce dépôt. Les références de données techniques sont traçables dans `docs/engineering_references.md`.
