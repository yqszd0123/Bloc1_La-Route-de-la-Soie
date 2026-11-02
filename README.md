# Avelis Wall Flow

Prototype fonctionnel du **Bloc 1 — Conception** du Challenge Imagine & Make 2026. Il transforme une configuration de mur 2D à ossature bois en plusieurs solutions constructives, vérifie leur fabricabilité conceptuelle, les compare par analyse multicritère et remet un paquet cohérent de fichiers à la fabrication, à la qualité, à Noov et aux blocs suivants.

> Périmètre de sécurité : démonstrateur DfMA et de continuité numérique. Il ne certifie ni la résistance, ni les assemblages, ni le contreventement, ni le feu, l'acoustique, l'humidité ou la conformité réglementaire. Toute construction réelle exige la validation d'Avelis, du fabricant et d'un ingénieur structure qualifié.

## Démarrage en moins d'une minute

1. Double-cliquer sur `START_APP.bat`.
2. Au démarrage, la porte est déjà activée et visible. Utiliser l'interrupteur « Ajouter une porte » pour la retirer, choisir l'une des quatre variantes, ou saisir les dimensions.
3. Cliquer sur **Générer, vérifier et optimiser**.
4. Comparer les candidats, en sélectionner un, puis télécharger le paquet ZIP complet.

L'application est statique : aucun compte, serveur, module externe ou accès réseau n'est requis. Un navigateur récent suffit.

## Ce que fait réellement le prototype

- saisie de 6 paramètres géométriques de base, d'une porte optionnelle paramétrable et d'une priorité de décision ;
- modèle sémantique unifié `openings[]` : fenêtre et porte alimentent le même générateur, les mêmes règles et les mêmes exports ;
- création des lisses, montants, encadrements, linteaux et montants d'allège/hauts ; la lisse basse est interrompue automatiquement au passage d'une porte ;
- exploration déterministe de 16 configurations (4 entraxes × 2 décalages de trame × 2 linteaux) ;
- contrôles automatiques de domaine d'entrée, espacement entre ouvertures, collision avec chaque vide, complétude des encadrements, enveloppe, longueurs et composants obligatoires ;
- calcul du volume de bois, du nombre de pièces/coupes/longueurs uniques, d'une complexité de fabrication et d'un coût POC ;
- classement multicritère selon une priorité équilibrée, matière, fabrication ou coût ;
- traçabilité par identifiants persistants et version de mur ;
- export d'une élévation SVG, d'un modèle DXF neutre, d'un STL à l'échelle, de la BOM et des données machine CSV ;
- propositions d'interfaces JSON pour Noov, Bloc 2 production et Bloc 3 logistique ;
- paquet ZIP autonome construit dans le navigateur, sans téléversement des données.

## Résultats de référence

| Cas | Mur (mm) | Ouvertures (mm) | Candidats valides | Solution | Bois (m³) | Pièces | Coût POC (€) |
|---|---:|---:|---:|---|---:|---:|---:|
| A standard | 3000 × 2400 | 900 × 1000 | 16 | CAND-09 | 0,19161 | 15 | 152,55 |
| B large | 4200 × 2600 | 1200 × 1100 | 16 | CAND-13 | 0,26863 | 19 | 209,30 |
| C compact | 2400 × 2400 | 700 × 900 | 16 | CAND-01 | 0,17725 | 15 | 143,65 |
| D fenêtre + porte | 4200 × 2600 | fenêtre 900 × 1000 + porte 900 × 2100 | 16 | CAND-13 | 0,29754 | 25 | 240,72 |

Les valeurs sont reproductibles avec `node scripts/generate-experiments.js`. Le temps observé est de quelques millisecondes sur la machine de développement ; le protocole officiel demande de chronométrer également la manipulation humaine jusqu'au téléchargement.

## Arborescence

```text
avelis-wall-flow/
├── apps/web/                  Interface utilisateur et visualiseur
├── packages/core/src/
│   ├── domain/               Entrées, projet, version et constantes
│   ├── generation/           Modèle sémantique et génération géométrique
│   ├── rules/                Règles d'entrée et de candidat
│   ├── optimization/         Métriques, recherche et classement
│   ├── export/               JSON, CSV, SVG, DXF, STL et ZIP
│   └── utils/                Fonctions mathématiques partagées
├── config/                   Profil de règles lisible et versionné
├── schemas/                  Contrats JSON proposés entre blocs
├── experiments/              Quatre cas reproductibles et résultats
├── tests/                    Tests automatisés sans dépendance
├── scripts/                  Génération des livrables et expériences
├── docs/                     Hypothèses, interfaces, méthode et protocoles
└── deliverables/             Rapport, soutenance et vidéo
```

La séparation reprend une logique éprouvée dans les projets BIM/fabrication open source : paramètres et intention comme source de vérité, puis dérivation des géométries, contrôles et fichiers. Voir `ARCHITECTURE.md` et `THIRD_PARTY_NOTICES.md`.

## Reproduire les vérifications

Avec Node.js 18 ou plus récent :

```bash
npm test
npm run experiments
```

Le projet n'a aucune dépendance NPM. Les dix tests vérifient les quatre cas, le modèle unifié fenêtre/porte, les encadrements, les conflits entre ouvertures, les identifiants, le classement, la BOM et les signatures des exports.

## Documents de remise

- `deliverables/rapport/rapport_scientifique.pdf` — rapport scientifique 10–15 pages ;
- `deliverables/presentation/soutenance_bloc1.pdf` — support de soutenance ;
- `deliverables/video/demo_avelis_wall_flow.mp4` — démonstration réelle de l’application (150 s, interface exécutée, rotation, variantes, erreur bloquante, BOM et qualité) ;
- `docs/PROTOTYPE_FABLAB.md` — procédure d'impression et fiche de mesure ;
- `docs/INTERFACES.md` — responsabilités et contrats entre blocs ;
- `docs/BUSINESS_PLAN.md` — proposition de valeur, coûts et déploiement ;
- `docs/AI_USAGE_LOG.md` — transparence sur l'assistance IA.

## État et prochaines validations Avelis

Version : `1.1.1`, profil de règles `POC-FR-TIMBER-2026-01`.

Avant un pilote industriel, Avelis doit confirmer les sections/entraxe autorisés, la nomenclature réelle, le format entrant de Noov, les règles structurelles et réglementaires, les capacités machine, les assemblages, les tolérances et les formats exacts attendus par les Blocs 2 et 3. Les points ouverts sont volontairement explicites afin de ne pas faire passer une hypothèse d'école pour une règle métier validée.

## Licence

Code original sous licence MIT. Les références externes ont été étudiées pour leur architecture et leur logique ; aucun code sans licence compatible n'a été copié.
