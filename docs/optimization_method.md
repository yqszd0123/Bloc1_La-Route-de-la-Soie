# Méthode de génération et d’optimisation

## Espace de recherche déclaré

Le moteur évalue exhaustivement six options, et non un résultat choisi d’avance :

- trois couples compatibles de profils Metsec publics ;
- deux stratégies de grille : trame régulière et trame alignée sur les ouvertures ;
- entraxe de référence 600 mm dans les deux stratégies.

Le nombre de candidats générés doit être égal à la taille de l’espace déclaré ; un test l’impose.

## Génération

Une entrée normalisée contient l’enveloppe, le placement, les ouvertures et la provenance. Le générateur crée rails haut/bas, montants de rive, montants courants et cadres d’ouverture. Une porte part de la base, interrompt le rail bas et ne reçoit pas d’appui de fenêtre. Les composants qui croisent un vide clair sont refusés.

## Métriques

- masse acier calculée ;
- nombre de composants ;
- nombre de longueurs distinctes ;
- nombre de coupes ;
- coût matière calculé après classement, à partir du même métrage.

Les métriques sont normalisées entre minimum et maximum des six candidats. Si toutes les valeurs d’une métrique sont identiques, sa contribution est zéro. Le score est la moyenne des métriques disponibles pour la priorité choisie ; une petite règle de départage déterministe garde l’ordre stable. « Plus petit » signifie « meilleur » uniquement dans cet espace de référence.

## Pareto et vérification

Le statut Pareto est calculé indépendamment du score. Au moins une solution doit être non dominée. Le test vérifie que le recommandé possède le score minimal, que tous les candidats sont classés une seule fois et que les rangs sont monotones.

## Limites

Cette optimisation n’est pas une optimisation structurelle, de débit de barres, de carbone ou de temps robot. Ces objectifs restent exclus tant que charges, longueurs de stock, chutes, EPD, équipements et temps de cycle ne sont pas disponibles.
