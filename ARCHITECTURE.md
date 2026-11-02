# Architecture technique

## Principe directeur

Le même modèle sémantique alimente la visualisation, la nomenclature, les métriques, les règles et tous les exports. Ainsi, une pièce affichée porte le même identifiant dans la BOM et dans le fichier machine. Il n'existe pas de seconde maquette reconstruite manuellement pour la remise.

```text
Configuration client / Noov (mur + openings[])
            │
            ▼
  normalisation + règles d'entrée
            │
            ▼
   espace de 16 configurations
            │
            ▼
 modèle sémantique de chaque candidat
            │
      ┌─────┼─────────────┐
      ▼     ▼             ▼
  règles  métriques   visualisation
      │     │
      └──┬──┘
         ▼
 classement multicritère + Pareto
         │
         ▼
 SVG / DXF / STL / BOM / machine / interfaces / qualité
```

## Modules et dépendances

| Module | Responsabilité | Ne connaît pas |
|---|---|---|
| `domain` | valeurs par défaut, profil POC, identité/version | interface HTML |
| `rules/input-rules` | valider le besoin avant calcul | géométrie générée |
| `generation` | produire des composants sémantiques | classement et fichiers |
| `rules/candidate-rules` | contrôler les composants générés | DOM et téléchargements |
| `optimization` | métriques, Pareto et score pondéré | présentation graphique |
| `export` | sérialiser une solution sélectionnée | saisie de formulaire |
| `apps/web` | interaction, état, dessin et téléchargement | logique métier interne |

Les fichiers JavaScript sont des modules IIFE volontairement compatibles avec un simple fichier HTML et avec Node.js. Ce choix évite une étape de compilation fragile pour la soutenance tout en conservant des frontières de modules nettes.

## Modèle de données

Une ouverture contient : identifiant, type (`WINDOW` ou `DOOR`), origine, largeur, hauteur et allège. Il n'existe plus de modèle « baie historique » séparé : `openings[]` est la source unique pour la génération, les règles, le visualiseur et les fichiers Noov.

Une pièce contient : identifiant, rôle, libellé, matériau, section, axe local, origine, longueur, boîte englobante, opérations, tolérance et éventuellement `openingId`. Ce lien permet de tracer chaque élément de cadre vers la fenêtre ou la porte qui l'a produit. L'identifiant est construit depuis `projectId`, `wallId`, `version` et le numéro de composant. Les exports ne réinventent jamais les identifiants.

## Génération et optimisation

Pour une configuration valide, la recherche combine :

- entraxe : 400, 450, 500 ou 600 mm ;
- origine de trame : 0 ou demi-entraxe ;
- linteau : une ou deux couches de 45 mm.

Le générateur construit chaque encadrement depuis le même algorithme : montants maîtres, montants d'appui, linteau et montants hauts. Le type d'ouverture ne change que les contraintes nécessaires : une fenêtre reçoit une traverse d'appui et des montants d'allège ; une porte part du sol, ne reçoit pas de traverse basse et interrompt la lisse basse. La trame respecte ensuite toutes les zones réservées et produit 16 candidats. Les candidats en erreur sont exclus. Les valides sont normalisés sur trois objectifs à minimiser : volume, complexité, coût estimé. Le score est une somme pondérée selon la priorité utilisateur ; le statut Pareto est calculé indépendamment.

## Décisions de robustesse

- zéro dépendance d'exécution ou CDN ;
- calcul déterministe et hors ligne ;
- règles et hypothèses versionnées ;
- messages bloquants distincts des avertissements d'ingénierie ;
- limite de domaine, distance aux rives et séparation fenêtre/porte explicites avant la génération ;
- ZIP créé localement dans le navigateur ;
- tests de bout en bout sur les formats remis.

## Règle d'évolution

Une extension ne doit pas créer une deuxième chaîne métier à côté de la première. Elle modifie la source de vérité, adapte les consommateurs existants et supprime l'ancien modèle devenu redondant. Les conditions locales ne sont admises que pour une différence réelle du domaine — par exemple, une porte n'a pas de traverse d'allège — tandis que génération, validation, métriques et exports restent communs.

## Extension industrielle

Ajouter un nouveau système constructif doit se faire par un profil de règles et un générateur séparé, sans modifier l'interface d'export. Les prochaines briques sont : solveur structurel validé, optimisation combinatoire de débit, bibliothèque d'assemblages, export machine réel, IFC/BTLx, authentification et journal d'audit serveur.
