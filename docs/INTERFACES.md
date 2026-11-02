# Socle commun et interfaces entre blocs

## Vue d'ensemble

```text
Noov / client
  └─ demande de configuration proposée
       └─ Bloc 1 : conception, règles, variantes, décision
            ├─ réponse vers Noov : solution + KPI + avertissements
            ├─ Bloc 2 : paquet production + pièces + opérations
            └─ Bloc 3 : dimensions/poids/colis + séquence logistique
```

Le dossier ZIP sépare cinq espaces : entrée, conception, fabrication, qualité et interfaces. Cette convention donne à chaque acteur un périmètre stable tout en partageant les mêmes identifiants.

## Interface Noov → Bloc 1

Le fichier `noov_request_proposal.json` propose : version de schéma, identité du projet, typologie, dimensions du mur, tableau `openings[]` (fenêtre et porte optionnelle), priorité et échelle de prototype. Les unités sont toujours suffixées dans le nom (`Mm`) et les identifiants ne contiennent ni espace ni accent.

## Interface Bloc 1 → Noov

Le fichier `noov_response_proposal.json` renvoie le candidat recommandé, son rang, le score, les métriques, le nombre d'alternatives valides, le statut de validation POC et la liste des fichiers disponibles.

## Interface Bloc 1 → Bloc 2 Production

`production_handover.json` contient l'identité/version, le profil de règles, le candidat, les composants, opérations et tolérances, ainsi que le statut d'autorisation. `machine_members.csv` est la vue tabulaire destinée à un futur post-processeur. Le statut reste conceptuel tant que le format machine n'est pas confirmé.

## Interface Bloc 1 → Bloc 3 Logistique

`logistics_handover.json` transmet l'enveloppe, le volume, une masse indicative, les quantités et la liste des composants. Le colisage et les contraintes de transport doivent être enrichis par le Bloc 3.

## Gouvernance des versions

- `schema` : version du contrat d'interface ;
- `software.version` : version du générateur ;
- `wall.version` : révision métier du mur ;
- `ruleProfile.id` : jeu de règles ayant produit la solution ;
- `candidateId` : solution au sein de l'exécution ;
- `component_id` : pièce traçable dans toutes les sorties.

Une modification géométrique doit incrémenter la version du mur. Une modification de contrat doit incrémenter la version de schéma. Une version ancienne n'est jamais écrasée dans un système industriel ; elle est archivée avec son paquet.
