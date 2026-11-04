# Avelis Wall Flow 2.2

Application Bloc 1 de continuité numérique pour panneaux muraux en acier formé à froid. Elle accepte une configuration manuelle, un vrai fichier IFC ou une géométrie STEP/STP, génère plusieurs variantes traçables, compare leurs métrés et prépare un paquet neutre pour le Bloc 2.

> Statut : démonstrateur d’ingénierie, pas certificat structurel et pas programme machine. Les charges, assemblages, tolérances, capacités de Torcy et produits réellement employés par Avelis restent à confirmer.

## Utilisation

1. Double-cliquer sur `START_APP.bat`.
2. Choisir l’entrée : IFC, STEP/STP ou configuration manuelle.
3. Pour STEP, confirmer les axes longueur/hauteur/épaisseur ; pour IFC, choisir le mur extrait.
4. Activer ou désactiver fenêtre et porte en mode manuel.
5. Après la conception, ouvrir « Maquette en couches » pour montrer le même mur en quatre états : ossature, isolation, parois puis mur assemblé.
6. Passer ensuite à la fabrication et télécharger le paquet ZIP.

La maquette en couches est une visualisation pédagogique séparée du modèle de fabrication. Les deux vues 3D disposent d’une rotation complète sur 360° ; la maquette permet en plus un éclatement renforcé de 0 à 200. Les échantillons d’isolation, panneaux et finitions ne sont ajoutés ni aux IFC/STEP, ni à la BOM, ni à la liste de débit, ni au ZIP.

Le prix matière est facultatif. Si les champs restent vides, le calcul emploie le proxy Hauts-de-France documenté de 3,09 €/kg HT, avec une fourchette de 1,82 à 4,12 €/kg. Une valeur saisie remplace uniquement le scénario budgétaire, jamais la géométrie.

## Ce que le logiciel calcule réellement

- géométrie de l’enveloppe et des ouvertures ;
- lisses, montants et cadres d’ouverture avec identifiants stables ;
- jusqu’à neuf candidats distincts : trois couples de profils Metsec publics × module symétrique, travées uniformes et zones d’ouvertures ;
- longueur, masse par `longueur × kg/m fabricant`, BOM, débit et coût matière ;
- comparaison normalisée et Pareto sur les métriques disponibles ;
- contrôles de collision, enveloppe, cohérence BOM/géométrie et traçabilité ;
- exports CSV, JSON, SVG, DXF, STL, STEP AP203 et ZIP ;
- contrat proposé Bloc 1 → Bloc 2 avec composants, positions, dépendances et statut de libération bloqué.
- démonstration interactive du montage par couches, avec vues assemblée et éclatée, sans altérer les données de fabrication.

## Entrées

- `IFC` : analyse ISO 10303-21, unités, placements, hiérarchie, murs, vides et remplissages ; profils centrés et murs orientés X/Y normalisés ; fixtures IFC4 buildingSMART et quatre-murs incluses.
- `STEP/STP` en entrée : lecture réelle par `occt-import-js 0.0.23` et Open CASCADE ; conversion explicite de l’enveloppe 3D, sans inventer de sémantique de porte/fenêtre.
- `STEP` en sortie : un solide BRep analytique `MANIFOLD_SOLID_BREP` nommé par composant, en millimètres, regroupé dans un vrai fichier ISO 10303-21/AP203 relu automatiquement par Open CASCADE. Il s’agit d’enveloppes de coordination, pas des sections C/U détaillées ni d’un programme machine.
- `MANUAL` : dimensions et ouvertures paramétrables, porte et fenêtre activables indépendamment.

## Résultat de référence reproductible

Pour le mur IFC buildingSMART 3000 × 2000 × 300 mm avec fenêtre 1000 × 1000 mm, le moteur explore neuf combinaisons distinctes. Le recommandé est recalculé par les tests et les expériences à partir des mêmes composants, métriques et prix sourcés ; aucun résultat d’affichage n’est codé en dur.

## Structure

```text
apps/web/               interface, import IFC/STEP, visualisation, téléchargements
packages/core/src/      domaine, parseur IFC, adaptateur STEP, génération, règles, optimisation, exports, modèle pédagogique isolé
data/                   source de vérité des données et références d’ingénierie
schemas/                contrats JSON proposés entre blocs
test-data/              vrais fichiers IFC et STEP de vérification
third_party/            occt-import-js et licences redistribuées
tests/                   tests unitaires et intégration Open CASCADE
docs/                    méthode, interfaces, fabrication, limites et sources
scripts/                 synchronisation, expériences, paquet du site
```

## Vérification

Avec Node.js 18 ou plus récent :

```bash
npm test
npm run experiments
```

Les tests couvrent les sources, profils, masses, porte, collisions, IDs, budget, classement, vrai IFC, import STEP réel, export STEP relu par Open CASCADE, autres exports et blocage de la libération machine.

Le contrat documenté Bloc 1 → Bloc 2 est `docs/Bloc1_Bloc2_Interface_Schema.md`. La même version est intégrée automatiquement au paquet ZIP téléchargé.

## Références et licences

Les paramètres techniques sont dans `data/engineering_sources.json` et expliqués dans `docs/engineering_references.md`. Le parseur STEP redistribué conserve ses licences dans `third_party/occt-import-js/dist`. Le code propre au projet est sous licence MIT.
