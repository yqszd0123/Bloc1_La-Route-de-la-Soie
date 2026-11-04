# Méthode de génération et d’optimisation

## Espace de recherche déclaré

Le moteur évalue exhaustivement neuf combinaisons avant dédoublonnage :

- trois couples compatibles de profils Metsec publics ;
- trois stratégies d’implantation : module symétrique, travées uniformes et zones d’ouvertures ;
- module cible de référence 600 mm dans les trois stratégies.

Une combinaison est une option explorée. Deux options qui produisent exactement les mêmes composants, profils, positions et longueurs sont fusionnées avant le classement. Le résultat contient donc jusqu’à neuf solutions distinctes sans afficher de faux doublons.

## Trois implantations

### Module symétrique

Les montants de rive sont fixes. Le moteur conserve autant que possible des travées centrales de 600 mm et répartit le reliquat également aux deux extrémités. Pour une distance de 2950 mm entre axes de rive, il produit `575 + 600 + 600 + 600 + 575 mm`.

### Travées uniformes

Le nombre de travées vaut `ceil(portée utile / 600)`. La portée utile est ensuite divisée par ce nombre. Pour 2950 mm, les cinq travées mesurent 590 mm.

### Zones d’ouvertures

Les axes des montants de rive et de jambage deviennent des appuis fixes. Chaque zone entre deux appuis est divisée indépendamment en travées égales sans dépasser le module cible. Cette stratégie évite qu’un seul premier percement impose la phase de toute la paroi.

Ces stratégies sont des règles géométriques de génération, pas des résultats de calcul structurel. Les entraxes réels minimum et maximum sont conservés dans chaque candidat et affichés dans l’interface.

## Génération

Une entrée normalisée contient l’enveloppe, le placement, les ouvertures et la provenance. Le générateur crée rails haut/bas, montants de rive, montants courants et cadres d’ouverture. Une porte part de la base, interrompt le rail bas et ne reçoit pas d’appui de fenêtre. Les composants qui croisent un vide clair sont refusés.

## Métriques

- masse acier calculée ;
- nombre de composants ;
- nombre de longueurs distinctes ;
- nombre de coupes ;
- coût matière calculé après classement, à partir du même métrage ;
- entraxes réels minimum, maximum et dispersion, fournis comme données de comparaison.

Les métriques de décision disponibles sont normalisées entre minimum et maximum des candidats distincts. Si toutes les valeurs d’une métrique sont identiques, sa contribution est zéro. Le score est la moyenne des métriques disponibles pour la priorité choisie ; une règle de départage déterministe garde l’ordre stable. « Plus petit » signifie « meilleur » uniquement dans cet espace de référence.

## Pareto et vérification

Le statut Pareto est calculé indépendamment du score. Au moins une solution doit être non dominée. Les tests vérifient les neuf combinaisons déclarées, le retrait des géométries identiques, les trois calculs d’implantation, la monotonie des rangs et le score minimal du recommandé.

## Limites

Cette optimisation n’est pas une optimisation structurelle, de débit de barres, de carbone ou de temps robot. Ces objectifs restent exclus tant que charges, longueurs de stock, chutes, EPD, équipements et temps de cycle ne sont pas disponibles.
