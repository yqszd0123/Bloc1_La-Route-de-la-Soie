# Références d’ingénierie et traçabilité

Date de vérification : 4 novembre 2026. La source machine autoritative est `data/engineering_sources.json`; ce document en expose la portée humaine.

## Niveaux de preuve

1. Documents Avelis fournis : besoin Bloc 1, continuité numérique et contexte industriel.
2. ISO/buildingSMART : modèle IFC et relations sémantiques.
3. AFNOR/Eurocode : domaine normatif identifié, sans prétendre avoir lu les clauses payantes non accessibles.
4. Fabricants : géométrie, masse linéique et propriétés déclarées des produits publics de référence.
5. Open source versionné : parseur STEP et vrais fichiers d’intégration.
6. Marché public : proxy budgétaire transparent, jamais assimilé à un devis Avelis.
7. Documentation fabricant fournie : priorité d’ordre FRAMECAD, utilisée comme règle de séquencement et non comme preuve de compatibilité machine Avelis.

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

## Produits publics de référence pour la maquette en couches

Ces produits servent uniquement à fournir des épaisseurs traçables au calcul de pièces. Ils ne représentent pas une composition de mur confirmée par Avelis.

| Couche | Référence publique | Épaisseur utilisée | Géométrie calculée |
|---|---|---:|---|
| isolant biosourcé | STEICOflex 036 | 100 mm, automatiquement égale au web du montant sélectionné | un rectangle par cavité libre entre acier et ouvertures |
| panneau extérieur | Knauf AQUAPANEL Cement Board Outdoor | 12,5 mm | un contour logique du mur avec portes/fenêtres déduites |
| parement intérieur | Placoplatre BA 13 | 12,5 mm | un contour logique du mur avec portes/fenêtres déduites |
| finition extérieure | EQUITONE tectiva | 8 mm | un contour logique du mur avec portes/fenêtres déduites |
| finition intérieure | Placomix PRO Finition | 1 mm | une zone continue avec portes/fenêtres déduites |

Le logiciel ne prétend pas qu’un contour logique de grande taille peut être acheté ou posé en une seule plaque. Formats commerciaux, joints, fixations, jeux, compression d’isolant et chutes ne sont pas optimisés.

## Calculs

### Masse d’une pièce

`masse_kg = longueur_mm / 1000 × masse_fabricant_kg_par_m`

Chaque pièce conserve le profil et la source. La somme des pièces est recoupée avec la BOM groupée. Pour le cas IFC de référence : 46,176 kg dans les deux chemins, écart d’arrondi absolu 0,0004 kg, statut `MATCH`.

### Contrôle indépendant de la masse linéique

`masse_approchée_kg/m = largeur_développée_mm × épaisseur_mm × 10⁻⁶ × 7850`

Ce contrôle n’est qu’un test de plausibilité : rayons de pliage et géométrie détaillée du revêtement ne sont pas modélisés. Les tests exigent un écart relatif inférieur à 5 % pour les profils du catalogue.

### Surface développée approximative d’un profilé acier

`surface_m² = (web_mm + semelle_1_mm + semelle_2_mm + 2 × lèvre_mm) × longueur_mm ÷ 10⁶`

Cette information est ajoutée à chaque ligne de fabrication avec l’épaisseur nominale. Elle exclut les rayons de pliage et ne remplace pas un développé de tôlerie détaillé.

### Pièces d’isolant et panneaux de maquette

Le domaine X/Z du mur est découpé par toutes les limites des enveloppes acier et des ouvertures. Les cellules libres adjacentes ayant la même largeur sont fusionnées verticalement ; chaque rectangle restant devient une pièce d’isolant. Les tests interdisent tout recouvrement positif entre une pièce d’isolant et un profilé ou une ouverture.

Pour les autres couches : `surface_nette = longueur_mur × hauteur_mur − somme(surface_portes_et_fenêtres)`. Le volume est `surface_nette_m² × épaisseur_mm ÷ 1000`. Le CSV conserve tous les intrants, les évidements et la source d’épaisseur ; il ne contient aucun prix.

### Ordre de chargement / assemblage des profilés

Le document fourni « FRAMECAD Detailer — Stick Order Assembly Priority », octobre 2025, donne deux règles : pour un mur plein, rail haut, montant gauche, montant droit, entretoises, montants centraux/contreventements, puis rail bas ; pour un mur avec ouverture, il insère les jambages, montants de remplissage, linteau et appui avant le montant droit, les autres montants et le rail bas.

Le programme applique ces priorités uniquement aux composants réellement générés. Les types absents, notamment les entretoises non modélisées, sont ignorés. Pour plusieurs portes ou fenêtres, l’extension explicite traite les ouvertures de gauche à droite, puis renumérote chaque pièce sans trou de `1` à `N`. La même valeur est affichée dans Fabrication et exportée dans les trois CSV de composants ainsi que dans `manufacturing_handover.json`. Il s’agit d’un ordre de référence ; aucun RFY, temps de cycle ou accord machine Avelis/Torcy n’est revendiqué.

### Coût matière

`coût_HT = masse_acier_kg × prix_scénario_€/kg_HT`

Valeur par défaut : 3,09 €/kg HT. Elle est la moyenne arithmétique de 3,32 €/kg (base construction française Z275), 1,82 €/kg (prix M48 à Wavrin normalisé par 0,55 kg/m) et 4,12 €/kg (M100 français normalisé par sa masse nette). Fourchette : 1,82–4,12 €/kg. Limites : matière seulement, hors livraison, minimum de commande, chute, fixations, façonnage, main-d’œuvre et pose. Il ne s’agit ni d’une moyenne statistique officielle ni d’un devis fournisseur.

## Règles géométriques

- entraxe 600 mm : configuration typique illustrée dans la brochure Metsec SFS 2024, à recalculer selon charges et système retenu ;
- porte 900 mm nominale : référence française conditionnelle d’accessibilité ; l’applicabilité et le passage utile doivent être vérifiés ;
- hauteur de porte 2 000 mm : exemple d’implémentation buildingSMART, pas exigence réglementaire.

## IFC

Le fixture `test-data/ifc/wall-with-opening-and-window.ifc` est un vrai fichier IFC4. Le test vérifie : signature ISO 10303-21, unité mm, bâtiment, étage, mur 3000 × 2000 × 300 mm, ouverture x=1000/sill=500/1000 × 1000 mm et lien `IfcRelVoidsElement`/`IfcRelFillsElement` vers `IfcWindow`.

Le fichier d’équipe `test-data/ifc/partie1-four-walls.ifc` complète ce contrôle avec quatre murs IFC4 en mètres. Le programme retrouve deux murs de 10000 × 2500 × 300 mm et deux murs de 1900 × 2500 × 300 mm, même lorsque la longueur est portée par l’axe local Y. Le mur sud restitue la fenêtre à x=1750 mm et la porte à x=7100 mm malgré un profil centré. Chaque mur explore neuf combinaisons ; les murs sans ouverture retirent trois doublons géométriques et conservent six solutions distinctes. Ce fichier sert uniquement de régression d’interopérabilité ; ce n’est pas une source de paramètres d’ingénierie.

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
- STEICOflex 036 : https://www.steico.com/fileadmin/user_upload/Public_Docs/CONTAINER_en/CONTAINER_en_Technical_Data_Sheets/STEICO_technical-data-sheet_flex-036_CONTAINER_en_i.pdf
- Knauf AQUAPANEL Outdoor : https://knauf.com/de-DE/p/produkt/aquapanel-r-cement-board-outdoor-12-5-11077_0010
- Placoplatre BA 13 : https://www.placo.fr/documents/fiche-technique/fichetechnique-placoplatre-ba-13.pdf
- EQUITONE tectiva : https://www.equitone.com/fr-fr/materiaux-facade/tectiva/
- Placomix PRO Finition : https://www.placo.fr/documents/fiche-technique/fichetechnique-placomix-pro-finition.pdf
- Open CASCADE, entités STEP de forme : https://dev.opencascade.org/doc/occt-7.4.0/refman/html/package_rwstepshape.html

Les URLs, dates, chapitres et données brutes supplémentaires sont conservés dans le JSON autoritatif.


## Extension bois Avelis — 4 novembre 2026

L’original ÉLÉVATION / COUPE est privé et conservé hors dépôt. L’image fournie
(734 × 558) permet de vérifier 2720 mm de large, 2963 mm de haut, un montant
A-2873 et deux épaisseurs de 45 mm (`2873 + 45 + 45 = 2963`), ainsi que 145 mm
de profondeur principale. Le repère C-2045 est une longueur de pièce ; il ne
prouve pas la hauteur nette de porte. Aucune cote nette officielle n’est déduite
par mesure de pixels.

À la demande de l’utilisateur, le cas propose des valeurs de travail modifiables :
baie 1610 × 2000 mm, X 565 mm, niveau bas 302 mm. Les 2000 mm sont une hypothèse
explicite, les 1610 mm s’inspirent du repère A-1610 sans certifier la baie nette,
X 565 mm reste à contrôler et 302 mm correspond à l’hypothèse `45 + 212 + 45`.
La traverse basse s’appelle `opening_base_member`, sans lui attribuer un rôle
structurel, de seuil ou de transport non confirmé. Les positions de trame et les
pièces hautes constituent une reconstruction paramétrique, pas une copie du dessin.
Tous ces points sont enregistrés dans le JSON exporté et signalés dans l’interface.

Le message d’équipe du 4 novembre confirme les sections 45 × 145 / 45 × 160 mm,
l’entraxe de référence 625 mm, la largeur d’isolant 580 mm, la largeur de plaque
1250 mm, le projet futur de projection d’isolant et le texte de tolérance +0/-2.
Unité et périmètre de cette tolérance non confirmés : `toleranceMm` reste null.
La classe C24 et la masse volumique 420 kg/m³ restent des références publiques,
pas des propriétés certifiées du bois Avelis.

Les principes de king/jack/header, traverse d’allège réservée à la fenêtre et
montants courts sont documentés par [PNNL / US DOE](https://basc.pnnl.gov/resource-guides/advanced-framing-minimal-framing-doors-and-windows).
Ils servent à la cohérence géométrique ; les linteaux et assemblages ne sont pas
calculés pour les charges du projet.

Les cinq familles proviennent du schéma Avelis fourni. Les produits et dimensions
suivants sont des **références indépendantes non approuvées par Avelis** :

- [STEICO universal black](https://www.steico.com/fileadmin/user_upload/importer/downloads/produktinformationen_holzfaser-dmmstoffe/STEICO_technical-data-sheet_universal-black_FRA_fr_i.pdf) : pare-pluie rigide en fibre de bois 22 mm, format utile 2210 × 585 mm. Les pièces sont calculées sur ce format ; calepinage, appuis, jonctions et fixations sont indicatifs. Le 22 mm ne valide pas l’insufflation.
- [Groupe ISB / Silverwood Douglas Forez](https://www.groupe-isb.fr/product/preserves-naturels-essence-douglas/) : bardage de référence 21 mm. Le modèle calcule la surface nette, pas un nombre de lames ou leurs usinages.
- [Guide Silverwood](https://www.silverwood.fr/sites/default/files/2023-11/2023-11-Silverwood-PagesGuideTechnique.pdf) : lame d’air nominale minimale de référence 20 mm. Les tasseaux et fixations ne sont pas dimensionnés ni ajoutés au débit bois.

L’isolant suit les cavités réelles et la profondeur du bois principal ; le système
ne force pas chaque vide à 580 mm. Son objet `installation` réserve une extension
pour projection mécanisée, actuellement non validée. Les menuiseries sont des
composants individuels liés aux IDs d’ouverture, sans produit fabricant choisi.
Leur volume reste null car aucune épaisseur fiable n’a été fournie.
