# Business plan synthétique

## Problème et valeur

Une chaîne de conception fragmentée oblige à ressaisir les dimensions entre vente, bureau d'études, fabrication et logistique. Chaque ressaisie augmente le délai et le risque d'incohérence. Avelis Wall Flow propose un « paquet de définition » unique : options comparées, composants identifiés, fichiers et interfaces issus de la même source.

## Utilisateurs

- commercial/configurateur Noov : obtient une réponse faisable et chiffrée plus vite ;
- bureau d'études : explore des variantes et concentre son temps sur la validation ;
- atelier : reçoit des pièces/opérations versionnées ;
- qualité : dispose d'un rapport automatique et des hypothèses ;
- logistique : récupère enveloppe, quantités et masse indicative.

## Gains à vérifier lors d'un pilote

Le POC ne prétend pas connaître le coût réel actuel. Le pilote doit mesurer : minutes économisées par configuration, ressaisies supprimées, erreurs évitées, délai de devis, matière consommée et taux de réutilisation des règles. La valeur annuelle s'estime par :

`volume annuel × gain de temps × coût horaire + coût des erreurs évitées + gain matière – exploitation`.

## Coûts par phase

| Phase | Contenu | Ordre de grandeur indicatif |
|---|---|---:|
| POC étudiant | moteur, interface, preuves, formats proposés | déjà réalisé |
| pilote | ateliers métier, règles validées, connecteur Noov, post-processeur machine | 2–4 personnes pendant 3–6 mois |
| industrialisation | sécurité, audit, calcul certifié, données, support | selon SI et responsabilité |
| exploitation | hébergement, maintenance des règles, support utilisateurs | budget annuel dédié |

## Stratégie de déploiement

1. valider un seul type de mur et une seule machine ;
2. comparer dix dossiers passés et cinq nouveaux dossiers ;
3. conserver une validation humaine obligatoire ;
4. stabiliser les interfaces et la gouvernance des versions ;
5. étendre aux autres typologies seulement après atteinte des KPI.

## Risques et parades

- règle incomplète : profil versionné, avertissement et revue humaine ;
- adoption faible : interface courte et démonstration sur dossiers réels ;
- dépendance machine : export neutre + post-processeur séparé ;
- responsabilité structurelle : moteur certifié distinct et validation signée ;
- dette de données : contrats de schéma et identifiants persistants.
