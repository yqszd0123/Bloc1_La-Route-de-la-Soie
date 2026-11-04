# Avelis Wall Flow 2.3 — acier et bois


Le quatrième exemple « Référence Avelis — mur bois avec porte » apparaît seulement
pour le bois. Il charge une reconstruction de travail : enveloppe confirmée
2720 × 2963 mm, bois principal 45 × 145 mm ; baie provisoire 1610 × 2000 mm,
X = 565 mm, niveau bas = 302 mm. **La hauteur nette 2000 mm est un défaut de
conception autorisé par l’utilisateur, pas une cote officielle lisible.** Le dessin
contient des pièces basses dont le rôle reste à confirmer. La mention de référence
reste provisoire et devient « paramètres modifiés » après changement de géométrie.

Les encadrements de porte (king/jack, linteaux, montants courts et traverse basse
éventuelle) emploient 45 × 160 mm ; le reste conserve la section sélectionnée.
Le nouvel entraxe 625 mm vient du message Avelis du 4 novembre 2026. Les fenêtres
conservent leurs propres traverses et ont des montants courts au-dessus et au-dessous,
avec un montant centré de secours si la trame ne traverse pas la petite baie.

Pour le bois, la vue en couches propose les cinq familles Avelis : bardage ventilé,
pare-pluie rigide, isolant biosourcé, ossature bois et menuiseries sur mesure.
Quatre vues et des cases par composant permettent de les explorer. Les épaisseurs
21 mm (bardage), 22 mm (pare-pluie) et la lame d’air minimale 20 mm proviennent de
produits/détails publics de référence ; Avelis ne les a pas validées. Les menuiseries
sont des enveloppes de réservation sans épaisseur, jeu de pose ou performances inventés.
Les matériaux figurent dans `06_wall_materials/` du ZIP et dans un BOM distinct.
Le budget, le débit, les STEP et les STL restent limités à l’ossature.
Les originaux privés du dessin et du schéma ne sont pas distribués.

Le sélecteur « Ossature » est disponible sur toutes les pages. Choisir « Bois C24 »
active des pièces pleines, doubles lisses hautes, montants principaux/d’appui,
linteaux conceptuels et interruptions de lisse à chaque porte. Section par défaut :
45 × 145 mm ; alternatives 45 × 95 et 45 × 120 mm, ou comparaison des trois.
Les entraxes 400/450/500/600/625 mm sont des paramètres géométriques à valider.

Les entrées manuelles, IFC et STEP utilisent le matériau choisi. Le bois conserve
les vues 3D, couches, comparaison, BOM, débit, STEP/DXF/STL et ZIP ; ses quantités
sont en m³, sa masse est estimée avec 420 kg/m³ et son budget en €/m³.
Le prix initial de 620 €/m³ est une hypothèse de démonstration, pas un tarif vérifié.
Les sections, linteaux, assemblages et capacités de fabrication ne sont pas certifiés.
Le catalogue et le comportement acier restent disponibles.

Application Bloc 1 de continuité numérique pour panneaux muraux en acier formé à froid ou à ossature bois. Elle accepte une configuration manuelle, un vrai fichier IFC ou une géométrie STEP/STP, génère plusieurs variantes traçables, compare leurs métrés et prépare un paquet neutre pour le Bloc 2.

> Statut : démonstrateur d’ingénierie, pas certificat structurel et pas programme machine. Les charges, assemblages, tolérances, capacités de Torcy et produits réellement employés par Avelis restent à confirmer.

## Utilisation

1. Double-cliquer sur `START_APP.bat`.
2. Choisir l’ossature (acier ou bois) et l’entrée : IFC, STEP/STP ou configuration manuelle.
3. Pour STEP, confirmer les axes longueur/hauteur/épaisseur ; pour IFC, choisir le mur extrait.
4. Activer ou désactiver fenêtre et porte en mode manuel.
5. Après la conception, ouvrir « Maquette en couches » pour montrer le même mur en quatre états : ossature, isolation, parois puis mur assemblé.
6. Passer ensuite à la fabrication et télécharger le paquet ZIP.

La maquette en couches possède son propre calcul de pièces et son CSV. Les deux vues 3D disposent d’une rotation complète sur 360° ; la maquette permet en plus un éclatement renforcé de 0 à 200. L’isolant est découpé en rectangles correspondant aux vides réels entre les profilés ; les autres couches sont des contours muraux logiques dont les portes et fenêtres sont déduites. Elles ne sont ajoutées ni aux IFC/STEP, ni à la BOM acier, ni à la liste de débit acier, ni au ZIP.

Le prix matière est facultatif. Pour l’acier, si les champs restent vides, le calcul emploie le proxy Hauts-de-France documenté de 3,09 €/kg HT, avec une fourchette de 1,82 à 4,12 €/kg. Pour le bois, il utilise l’hypothèse de 620 €/m³ HT. Les prix acier et bois sont indépendants. Une valeur saisie remplace uniquement le scénario budgétaire, jamais la géométrie.

## Ce que le logiciel calcule réellement

- géométrie de l’enveloppe et des ouvertures ;
- lisses, montants et cadres d’ouverture avec identifiants stables ;
- jusqu’à neuf candidats distincts : trois couples de profils Metsec publics × module symétrique, travées uniformes et zones d’ouvertures ;
- longueur, épaisseur nominale, section, surface développée approximative, masse par `longueur × kg/m fabricant`, BOM, débit et coût matière pour chaque profilé acier ;
- pour le bois : sections pleines, volume par `largeur × profondeur × longueur`, masse indicative par `volume × 420 kg/m³`, BOM, débit et coût par m³ ;
- ordre de chargement continu `1…N` pour chaque pièce, dérivé de la priorité FRAMECAD selon le type de mur et étendu aux ouvertures multiples de gauche à droite ;
- comparaison normalisée et Pareto sur les métriques disponibles ;
- contrôles de collision, enveloppe, cohérence BOM/géométrie et traçabilité ;
- exports CSV, JSON, SVG, DXF, STL, STEP AP203 et ZIP ;
- contrat proposé Bloc 1 → Bloc 2 avec composants, positions, dépendances et statut de libération bloqué.
- calcul des pièces de maquette : rectangles d’isolant ajustés aux cavités, panneaux avec évidements, épaisseur, surface nette, volume et CSV sans prix ;
- démonstration interactive du montage par couches, avec vues assemblée et éclatée, sans altérer les données de fabrication acier.

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

Les tests couvrent les deux matériaux : sources, profils, volumes et masses, portes, collisions, IDs, budgets indépendants, classement, vrai IFC, import STEP réel, export STEP relu par Open CASCADE, autres exports et blocage de la libération machine. Les expériences génèrent trois cas acier, trois cas bois et le cas Avelis provisoire. Sans npm, utiliser `node tests/run-tests.js`, `node tests/timber-tests.js`, `node tests/step-integration.js` et `node scripts/generate-experiments.js`.

Le contrat documenté Bloc 1 → Bloc 2 est `docs/Bloc1_Bloc2_Interface_Schema.md`. La même version est intégrée automatiquement au paquet ZIP téléchargé.

## Références et licences

Les paramètres techniques sont dans `data/engineering_sources.json` et expliqués dans `docs/engineering_references.md`. Le parseur STEP redistribué conserve ses licences dans `third_party/occt-import-js/dist`. Le code propre au projet est sous licence MIT.


Régression Avelis : `node tests/avelis-timber-tests.js` et
`node tests/steel-baseline.js`. La base acier a été figée avant modification au
commit dd3627f : sept entrées, tous candidats et tous fichiers opérationnels
(y compris BOM, STEP, STL unitaires et contrats), ainsi que les couches acier.
La bibliographie commune et le document d’interface sont exclus de la comparaison
binaire car ils peuvent recevoir des informations bois. Les calculs et fichiers
opérationnels acier doivent rester identiques.
