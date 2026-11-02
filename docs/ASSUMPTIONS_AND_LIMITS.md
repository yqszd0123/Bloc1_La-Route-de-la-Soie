# Hypothèses, limites et décisions à valider

## Hypothèses POC implémentées

- section unique 45 × 145 mm, matériau `C24-DEMO` ;
- deux lisses hautes et une lisse basse ;
- mur rectangulaire avec une fenêtre et, en option, une porte paramétrable ;
- entraxes explorés : 400, 450, 500 et 600 mm ;
- tolérance de fabrication : ±1 mm ;
- longueur machine maximale : 6000 mm ;
- coût matière : 620 €/m³, coupe : 0,55 €, assemblage : 1,15 €/pièce ;
- temps machine : 0,22 min/coupe et 0,42 min/pièce ;
- STL réduit à l'échelle, destiné au démonstrateur FabLab.

Ces valeurs permettent une comparaison cohérente à l'intérieur du POC. Elles ne sont pas annoncées comme le catalogue industriel d'Avelis.

## Contrôles automatiques présents

1. bornes dimensionnelles du mur et de chaque ouverture ;
2. distance minimale de chaque ouverture aux rives et au haut ;
3. séparation minimale entre fenêtre et porte pour loger les encadrements ;
4. format des identifiants ;
5. longueur positive et longueur machine ;
6. absence de pièce dans tous les vides ;
7. composants contenus dans l'enveloppe ;
8. présence et complétude des encadrements obligatoires ;
9. entraxe autorisé, unicité des identifiants et limite de ressources.

## Contrôles explicitement absents

Résistance aux charges, stabilité globale, flèche du linteau, assemblages, ancrages, contreventement, séisme, feu, acoustique, thermique, humidité, durabilité, transport, conformité DTU/Eurocodes et certification machine.

## Décisions attendues d'Avelis

| Sujet | Question à fermer | Impact |
|---|---|---|
| Noov | schéma d'entrée, unités, identifiants et version | remplacer le contrat proposé |
| système bois | sections, doublages, trames et baies autorisées | profil de règles et générateur |
| structure | normes, charges et responsabilité de validation | nouveau moteur de calcul certifié |
| fabrication | machine, origine, axes, outils, tolérances, format | export post-processeur réel |
| Bloc 2 | statut d'ordre et retour qualité | API de production |
| Bloc 3 | colis, poids, séquence et contraintes transport | interface logistique |
| données | hébergement, droits, confidentialité et rétention | architecture de déploiement |

## Risque principal

Le risque n'est pas que le logiciel ne génère pas de fichier ; c'est qu'un fichier techniquement lisible soit interprété comme constructible sans validation métier. C'est pourquoi le périmètre est rappelé dans l'interface, les exports et le rapport de qualité.
