# Protocole de démonstration et d'évaluation

## Scénario de 5 minutes

1. Montrer la demande Noov proposée et charger le cas A.
2. Lancer la génération : 16 solutions valides apparaissent.
3. Faire tourner la vue et afficher les identifiants.
4. Changer la priorité de décision et observer le classement.
5. Charger la variante D : le même flux reconstruit une fenêtre et une porte, interrompt la lisse basse et ajoute les pièces de porte à la BOM.
6. Déplacer volontairement la porte sur la fenêtre : le flux est bloqué avant la fabrication.
7. Restaurer le cas D, sélectionner une alternative et télécharger le ZIP.
8. Ouvrir BOM, rapport qualité et STL ; suivre un même `component_id` puis conclure par les limites structurelles.

## Indicateurs à mesurer en séance

| Indicateur | Définition | Méthode |
|---|---|---|
| temps configuration → fichiers | de la validation du formulaire au ZIP téléchargé | chronomètre, 5 répétitions |
| taux d'automatisation | sorties produites sans ressaisie / sorties totales | grille des étapes |
| variantes valides | candidats sans erreur POC | compteur interface |
| écart dimensionnel | mesure FabLab – dimension CAO à l'échelle | pied à coulisse |
| couverture des règles | contrôles automatiques / règles POC déclarées | rapport validation |
| traçabilité | sorties partageant les mêmes IDs / sorties concernées | audit sur échantillon |

## Critères de réussite

- quatre configurations de mur différentes réussissent, dont une avec fenêtre + porte ;
- au moins trois alternatives valides sont comparées par configuration ;
- aucune ressaisie entre modèle, BOM, STL, DXF et interfaces ;
- une entrée invalide ne produit aucun fichier de fabrication ;
- les identifiants sont retrouvés dans le modèle, la BOM et la production ;
- le prototype FabLab est mesuré et l'écart est consigné ;
- les hypothèses et contrôles absents sont annoncés sans ambiguïté.
