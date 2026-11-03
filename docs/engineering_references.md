# Références d’ingénierie et traçabilité

Date de vérification : 3 novembre 2026. La source machine autoritative est `data/engineering_sources.json`; ce document en expose la portée humaine.

## Niveaux de preuve

1. Documents Avelis fournis : besoin Bloc 1, continuité numérique et contexte industriel.
2. ISO/buildingSMART : modèle IFC et relations sémantiques.
3. AFNOR/Eurocode : domaine normatif identifié, sans prétendre avoir lu les clauses payantes non accessibles.
4. Fabricants : géométrie, masse linéique et propriétés déclarées des produits publics de référence.
5. Open source versionné : parseur STEP et vrais fichiers d’intégration.
6. Marché public : proxy budgétaire transparent, jamais assimilé à un devis Avelis.

## Normes et spécifications

| Référence | Usage effectif | Limite |
|---|---|---|
| ISO 16739-1:2024 | référence de schéma IFC | catalogue/public preview ; pas de revendication de conformité exhaustive |
| buildingSMART IFC 4.3.2.0 | murs, vides, remplissages, placements et unités | le parseur cible les représentations extrudées standard |
| NF EN 1993-1-3/NA | domaine français des éléments minces formés à froid | texte complet payant non consulté ; aucun calcul de résistance déclaré |
| NF EN 1090-2+A1, mai 2024 | domaine d’exécution acier | aucune tolérance extraite sans accès aux clauses applicables |
| ISO 10303-21 STEP | format physique des entrées IFC/STEP et de la sortie CAO neutre | STEP CAO ne porte pas à lui seul la sémantique BIM |

## Produits acier publics de référence

Les produits sont issus de la table « Metframe Components » de voestalpine Metsec. Ils servent au calcul conceptuel, sans affirmer qu’Avelis les achète.

| ID logiciel | Référence fabricant | Famille | Masse kg/m | Web mm | Semelles mm | Lèvre mm | Épaisseur nominale mm |
|---|---|---|---:|---:|---:|---:|---:|
| 100MF12-50 | 100MF12/50 | montant C | 2,11 | 100 | 50/50 | 14 | 1,2 |
| 100MF12-70 | 100MF12/70 | montant C | 2,44 | 100 | 70/70 | 15 | 1,2 |
| 100MF14-70 | 100MF14/70 | montant C | 2,85 | 100 | 70/70 | 15 | 1,4 |
| 104MF12 | 104MF12 | rail U | 2,11 | 104 | 62/62 | 0 | 1,2 |
| 104MF14 | 104MF14 | rail U | 2,46 | 104 | 65/65 | 0 | 1,4 |

Produit de référence : acier galvanisé Z275, limite d’élasticité minimale annoncée 450 N/mm². Densité de recoupement : 7 850 kg/m³ selon l’Orange Book ArcelorMittal. La masse fabricant reste la valeur de calcul principale.

## Calculs

### Masse d’une pièce

`masse_kg = longueur_mm / 1000 × masse_fabricant_kg_par_m`

Chaque pièce conserve le profil et la source. La somme des pièces est recoupée avec la BOM groupée. Pour le cas IFC de référence : 46,176 kg dans les deux chemins, écart d’arrondi absolu 0,0004 kg, statut `MATCH`.

### Contrôle indépendant de la masse linéique

`masse_approchée_kg/m = largeur_développée_mm × épaisseur_mm × 10⁻⁶ × 7850`

Ce contrôle n’est qu’un test de plausibilité : rayons de pliage et géométrie détaillée du revêtement ne sont pas modélisés. Les tests exigent un écart relatif inférieur à 5 % pour les profils du catalogue.

### Coût matière

`coût_HT = masse_acier_kg × prix_scénario_€/kg_HT`

Valeur par défaut : 3,09 €/kg HT. Elle est la moyenne arithmétique de 3,32 €/kg (base construction française Z275), 1,82 €/kg (prix M48 à Wavrin normalisé par 0,55 kg/m) et 4,12 €/kg (M100 français normalisé par sa masse nette). Fourchette : 1,82–4,12 €/kg. Limites : matière seulement, hors livraison, minimum de commande, chute, fixations, façonnage, main-d’œuvre et pose. Il ne s’agit ni d’une moyenne statistique officielle ni d’un devis fournisseur.

## Règles géométriques

- entraxe 600 mm : configuration typique illustrée dans la brochure Metsec SFS 2024, à recalculer selon charges et système retenu ;
- porte 900 mm nominale : référence française conditionnelle d’accessibilité ; l’applicabilité et le passage utile doivent être vérifiés ;
- hauteur de porte 2 000 mm : exemple d’implémentation buildingSMART, pas exigence réglementaire.

## IFC

Le fixture `test-data/ifc/wall-with-opening-and-window.ifc` est un vrai fichier IFC4. Le test vérifie : signature ISO 10303-21, unité mm, bâtiment, étage, mur 3000 × 2000 × 300 mm, ouverture x=1000/sill=500/1000 × 1000 mm et lien `IfcRelVoidsElement`/`IfcRelFillsElement` vers `IfcWindow`.

## STEP

`occt-import-js 0.0.23` et Open CASCADE lisent le fichier réel `test-data/step/cube.stp`. Le test obtient un maillage, 24 sommets et une enveloppe 300 × 300 × 300 mm. Le logiciel ne transforme pas cette enveloppe en sémantique IFC : l’utilisateur assigne explicitement les axes longueur, hauteur et épaisseur.

Pour la sortie, le logiciel écrit un échange clair ISO 10303-21 avec schéma AP203 `CONFIG_CONTROL_DESIGN`. Chaque composant généré devient un solide BRep fermé `MANIFOLD_SOLID_BREP` à six faces planes et douze arêtes explicites, nommé par son ID stable et exprimé en millimètres. Le même test recharge le STEP produit avec Open CASCADE, exige une géométrie positive et compare l’enveloppe globale à celle du candidat. Cette validation prouve la lisibilité géométrique du fichier ; elle ne transforme pas les enveloppes rectangulaires en sections C/U détaillées et ne vaut pas validation industrielle.

## Données encore nécessaires

Catalogue de profils Avelis, cas de charges, conditions d’appui et de contreventement, bibliothèque d’assemblages, tolérances, longueurs de stock, capacités machines de Torcy, prix datés, EPD applicable et contrat Noov officiel. Tant qu’elles manquent, le logiciel affiche `ENGINEERING_REVIEW_REQUIRED` et bloque la libération machine.

## URLs principales

- ISO IFC : https://www.iso.org/standard/84123.html
- buildingSMART IFC : https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/
- Metsec : https://www.metsec.com/products/metframe/components/
- ArcelorMittal : https://orangebook.arcelormittal.com/explanatory-notes/cold-formed-sections/dimensions-of-sections
- occt-import-js : https://github.com/kovacsv/occt-import-js/tree/0.0.23
- NIST STEP : https://www.nist.gov/ctl/smart-connected-systems-division/smart-connected-manufacturing-systems-group/step-nist
- Open CASCADE, entités STEP de forme : https://dev.opencascade.org/doc/occt-7.4.0/refman/html/package_rwstepshape.html

Les URLs, dates, chapitres et données brutes supplémentaires sont conservés dans le JSON autoritatif.
