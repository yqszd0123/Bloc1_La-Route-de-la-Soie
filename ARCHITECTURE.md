# Architecture technique

## Source de vérité unique

Les trois modes d’entrée convergent vers le même objet `ProjectInput`, puis vers le générateur du système choisi (acier ou bois). Visualisation, BOM, métriques, comparaison et exports consomment exactement les mêmes composants ; aucune maquette de démonstration parallèle n’est maintenue.

```text
IFC ── parseur sémantique ─┐
STEP ─ Open CASCADE + axes ├─ ProjectInput ─ validation ─ jusqu’à 9 candidats distincts ─ classement ─ paquet Bloc 2
Manuel ─ formulaire ───────┘
```

## Frontières des modules

| Dossier | Responsabilité |
|---|---|
| `domain` | normalisation, identité, configuration et provenance |
| `ifc` | entités STEP physiques IFC, unités, placements et relations |
| `step` | enveloppe du maillage Open CASCADE et mapping d’axes |
| `generation` | création des composants acier ou bois sémantiques |
| `rules` | validation des entrées et des candidats |
| `optimization` | espace exhaustif, métriques, Pareto, classement |
| `export` | CSV/JSON/SVG/DXF/STL/STEP/ZIP et contrats inter-blocs |
| `apps/web` | interaction, rendu, import local et téléchargement |

## Décisions d’architecture

- modules courts par responsabilité, sans framework obligatoire ni compilation ;
- données d’ingénierie générées depuis un JSON autoritatif unique ;
- dépendance externe STEP isolée dans `third_party`, version et licences figées ;
- sémantique d’ouverture générique : porte et fenêtre utilisent le même modèle ;
- coûts découplés de la géométrie ;
- champs industriels inconnus conservés à `null` et libération machine bloquée ;
- identifiants déterministes issus du projet, mur, version et rôle géométrique ;
- toute extension modifie la source de vérité et ses consommateurs, sans chaîne historique parallèle.

## STEP versus IFC

IFC fournit des relations de bâtiment et d’ouverture ; STEP fournit une géométrie CAO. L’adaptateur STEP calcule seulement l’enveloppe X/Y/Z et exige un mapping explicite des axes. Cette séparation empêche une géométrie STEP d’être présentée à tort comme un modèle BIM sémantique.

L’export STEP suit le chemin inverse à partir du même candidat : chaque enveloppe de composant devient un solide BRep fermé `MANIFOLD_SOLID_BREP` AP203 en millimètres, avec arêtes et faces planes explicites. Le test d’intégration relit ensuite ce fichier avec Open CASCADE et compare son enveloppe globale au modèle source. Aucune seconde géométrie parallèle n’est maintenue.

## Contrat Bloc 1 → Bloc 2

Le paquet contient un JSON `avelis.production.wall-handover.v2`, une BOM et des listes unitaires. Les composants ont le même ID partout. La séquence d’assemblage référence ces IDs et déclare ses dépendances. Les tolérances, outils, fixations et formats natifs restent absents jusqu’à confirmation ; le statut reste `BLOCKED_PENDING_AVELIS_CAPABILITY_CONFIRMATION`.
