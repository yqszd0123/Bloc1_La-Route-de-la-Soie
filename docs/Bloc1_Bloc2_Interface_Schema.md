# Bloc 1 → Bloc 2 — contrat d’échange proposé v2.0

**Projet :** Imagine & Make 2026 — Avelis  
**Périmètre :** panneaux muraux à ossature acier ou bois (extension §9)
**Statut :** proposition générée par le logiciel, à valider avec Avelis et Bloc 2.

## 1. Objectif

Transmettre au Bloc 2 une configuration versionnée, des composants unitaires traçables, leurs dimensions/positions, une séquence proposée et les limites connues. Le paquet n’est pas directement exécutable par un robot.

## 2. Fichiers remis

- `bom.csv` : références groupées, quantité, longueur totale et masse ;
- `cutting_list.csv` : une ligne par composant dans l’ordre de chargement, coupe, section, épaisseur nominale, surface développée approximative, masse, opérations et statut ;
- `machine_neutral_members.csv` : ordre de chargement, positions X/Y/Z, axe et QR ;
- `component_labels.csv` : ordre de chargement, identifiants et QR ;
- `manufacturing_handover.json` : contrat complet ci-dessous ;
- `model_3d_profile_envelopes.step` : assemblage CAO STEP AP203 en millimètres, composé de solides BRep `MANIFOLD_SOLID_BREP` nommés par identifiant de composant ;
- `model_3d_profile_envelopes.dxf` : géométrie neutre de coordination ;
- `validation_report.json` : contrôles et exclusions.

CSV : UTF-8, séparateur point-virgule, ligne d’en-tête. Longueurs et épaisseurs en mm, surfaces en m², masses en kg.

Le module « Maquette en couches » fournit séparément `LAYER_PARTS.csv` avec les rectangles d’isolant et les contours logiques des autres couches. Ce fichier de prototype n’est pas inclus dans le paquet acier et ne constitue pas une libération industrielle.

Le STEP est un vrai fichier ISO 10303-21 relu automatiquement par Open CASCADE pendant les tests. Il représente les enveloppes externes des profils et non leur section C/U détaillée, les perçages, fixations ou trajectoires machine.

## 3. JSON réellement généré

Le schéma logique est `avelis.production.wall-handover.v2`. Exemple abrégé :

```json
{
  "schema": "avelis.production.wall-handover.v2",
  "schemaVersion": "2.0",
  "releaseStatus": "BLOCKED_PENDING_AVELIS_CAPABILITY_CONFIRMATION",
  "configurationId": "AVELIS-BLOC1-REF-WALL-001",
  "revision": "2.0",
  "units": { "length": "mm", "area": "m2", "mass": "kg" },
  "candidateId": "CAND-02",
  "components": [
    {
      "partId": "AVELIS-BLOC1-REF-WALL-001-V2-0-C-…",
      "partType": "common_stud",
      "assemblyOrder": 5,
      "assemblyPriorityGroup": "OPENING_1_CENTER_STUDS",
      "materialId": "REF-METSEC-Z275-FY450",
      "profileId": "100MF12-50",
      "manufacturerReference": "100MF12/50",
      "dimensionsMm": { "length": 2000, "sectionDepth": 100, "flange1": 50, "flange2": 50, "lip": 14, "nominalThickness": 1.2, "developedWidthApprox": 228 },
      "developedAreaApproxM2": 0.456,
      "calculatedMassKg": 4.22,
      "positionMm": { "x": 600, "y": 0, "z": 0 },
      "axis": "Z",
      "operations": ["CUT_TO_LENGTH"],
      "toleranceMm": null,
      "qrPayload": "…"
    }
  ],
  "assemblySequence": [
    {
      "stepId": "STICK-001",
      "order": 1,
      "operation": "ROLLFORM_AND_LOAD_IN_ASSEMBLY_ORDER",
      "partIds": ["…"],
      "dependsOn": [],
      "status": "PROPOSED_PENDING_BLOC2_VALIDATION"
    }
  ]
}
```

Les données d’exemple ci-dessus illustrent la forme ; le fichier téléchargé contient les valeurs générées du candidat choisi. `null` signifie « donnée non confirmée ».

## 4. Dictionnaire des champs

| Champ | Type | Rôle | Règle |
|---|---|---|---|
| `schema` | chaîne | nom du contrat | valeur fixe v2 |
| `configurationId` | chaîne | projet + mur | identique pour tout le lot |
| `revision` | chaîne | version de conception | nouvelle valeur après modification validée |
| `candidateId` | chaîne | variante sélectionnée | existe dans la comparaison qualité |
| `partId` | chaîne | composant unitaire | unique dans la révision |
| `partType` | chaîne | rôle constructif | issu du générateur commun |
| `assemblyOrder` | entier | ordre de sortie/chargement proposé | continu de 1 au nombre total de pièces |
| `assemblyPriorityGroup` | chaîne | groupe de priorité FRAMECAD adapté | traçable vers le type de mur et l’ouverture |
| `materialId` | chaîne | matière de référence | à remplacer/confirmer par Avelis |
| `profileId` | chaîne | profil catalogue interne | relié à la référence fabricant |
| `dimensionsMm` | objet | coupe/section | valeurs positives en mm |
| `positionMm` | objet | origine composant | coordonnées du panneau |
| `axis` | chaîne | direction principale | X ou Z dans le modèle actuel |
| `operations` | tableau | opérations neutres | non traduites en code machine |
| `toleranceMm` | nul | tolérance | reste nul jusqu’à validation |
| `stepId` | chaîne | étape de séquence | unique |
| `partIds` | tableau | composants de l’étape | tous doivent exister |
| `dependsOn` | tableau | précédences | sans cycle |

Le schéma vérifiable est `schemas/production-handover.schema.json`.

## 5. Séquence proposée

Chaque composant reçoit un numéro unique continu. Pour un mur plein, les groupes suivent : rail haut, montant gauche, montant droit, éventuelles entretoises, montants centraux/contreventements, rail bas. Pour un mur avec ouvertures : rail haut, montant gauche, puis pour chaque ouverture de gauche à droite jambage gauche, éventuelles entretoises et montants de remplissage, jambage droit, linteau, appui s’il existe ; viennent ensuite le montant droit, les pièces centrales restantes et le rail bas.

Cette adaptation provient de « FRAMECAD Detailer — Stick Order Assembly Priority », octobre 2025, sections 1.3–1.4. Les types de pièces absents du modèle sont sautés sans créer de trou de numérotation. La séquence exprime un ordre de sortie/chargement proposé, pas un RFY, un temps de cycle ni une trajectoire robot validée par Avelis.

## 6. Validations automatiques

- IDs uniques ;
- tous les `partIds` de séquence existent ;
- ordre continu de 1 à N, sans doublon et couvrant chaque composant exactement une fois ;
- dimensions positives ;
- BOM et masse des composants concordent ;
- composants hors enveloppe ou dans un vide clair refusés ;
- `configurationId`, révision, candidat et unités propagés ;
- tolérances et libération machine jamais inventées.

## 7. Responsabilités

| Acteur | Responsabilité |
|---|---|
| Bloc 1 | générer géométrie, IDs, métrés, composants, position et séquence proposée ; vérifier la cohérence |
| Bloc 2 | confirmer opérations, cellule, outils, précision, tolérances, fixation, stock et format machine |
| Avelis | confirmer produit, catalogue, règles, équipements de Torcy et autorisation de libération |

## 8. Questions à valider avec Bloc 2

1. Le JSON v2 et les quatre CSV sont-ils acceptables comme contrat amont ?
2. Le STEP AP203 d’enveloppes BRep planes suffit-il pour la coordination, ou le Bloc 2 exige-t-il des sections C/U détaillées et leurs rayons de pliage ?
3. Quelles machines, longueurs de stock, outils et opérations sont réellement disponibles ?
4. Quelles tolérances de coupe, position et assemblage faut-il appliquer ?
5. Quels perçages, fixations et contrôles qualité sont obligatoires ?
6. Quel format natif et quel mécanisme d’accusé réception doivent être ajoutés ?

Ce document reprend la structure du modèle fourni par l’équipe, mais remplace entièrement les données fictives historiques par le contrat acier réellement généré par Avelis Wall Flow 2.2. Le schéma d’échange reste versionné `v2.0` tant que ses champs n’ont pas subi de rupture de compatibilité.

## 9. Extension bois — logiciel 2.3

Le contrat v2 accepte également une ossature bois, distinguée par le champ additif
`frameMaterial: TIMBER`. Les anciens champs acier restent présents pour STEEL.

- Bois : dimensionsMm contient length, sectionWidth et sectionDepth en mm ; timberVolumeM3 et referenceDensityKgM3 accompagnent la masse estimée.
- La masse bois est le volume rectangulaire multiplié par la densité moyenne de référence 420 kg/m³ (Södra C24).
- Les dimensions 45 × 95 / 120 / 145 mm proviennent de la fiche Schilliger C24. Ce choix ne dimensionne pas une structure.
- Pas de tôle, revêtement, épaisseur nominale ni surface développée pour le bois.
- La source de séquence est TIMBER_POC_ASSEMBLY ; l’opération proposée est CUT_AND_PREPARE_TIMBER_ASSEMBLY. FRAMECAD reste réservé à STEEL.
- Le budget bois utilise des €/m³. Les 620 €/m³ par défaut sont une hypothèse POC, remplaçable par un devis.
- Les deux lisses hautes et deux couches de linteau de 45 mm décrivent uniquement une géométrie conceptuelle : charges, portée, contreventement et assemblages restent à dimensionner.
- Les jeux réservés (135 mm aux rives, 180 mm entre cadres et au-dessus des ouvertures) sont dérivés des pièces de ce modèle, pas des prescriptions réglementaires.
- La libération machine reste bloquée pour les deux matériaux.


### Complément bois Avelis (2026-11-04)

Le bois peut mélanger des sections : la section effective est portée par chaque
composant (`profileId`, `dimensionsMm.sectionWidth`, `dimensionsMm.sectionDepth`).
Les pièces autour d’une porte utilisent 45 × 160 mm ; le bois principal conserve
la section choisie. Le ZIP ajoute `06_wall_materials/materials_bom.csv`,
`material_parts.csv`, `wall_assembly.json` et `avelis_reference_status.json`.
Ces composants hors ossature ne font pas partie de la liste de débit ou des STL bois.
La menuiserie est une enveloppe de réservation ; épaisseur, jeu de pose et performances
restent null. Le cas Avelis possède toujours `exactReproduction: false` tant que
les cotes et les pièces basses ne sont pas confirmées. Ses valeurs de travail ne
sont pas des cotes officielles. Le contrat et les sorties opérationnelles acier
restent inchangés.
