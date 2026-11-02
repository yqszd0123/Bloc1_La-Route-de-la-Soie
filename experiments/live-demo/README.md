# Captures de la démonstration réelle

Ces images proviennent d'une exécution réelle de `apps/web/index.html` dans un navigateur local en 1280 × 720. Elles ne sont ni des diapositives PowerPoint ni des maquettes statiques recréées pour la vidéo.

Le scénario enregistré est le suivant :

1. démarrage automatique du cas standard ;
2. chargement de la variante B ;
3. activation réelle de la variante D avec fenêtre + porte et BOM de 25 pièces ;
4. activation des identifiants et rotation réelle du modèle ;
5. défilement du classement des 16 candidats ;
6. sélection d'une solution alternative ;
7. passage à la priorité « simplifier la fabrication » ;
8. saisie volontaire d'une position de baie invalide et blocage de l'export ;
9. restauration de la variante C ;
10. contrôle de la disponibilité du paquet complet ;
11. défilement vers la BOM et le rapport de validation ;
12. retour au cas standard.

`scripts/build-video.ps1` assemble ces captures, la séquence de rotation et une narration française en une vidéo H.264/AAC de 150 secondes. Les captures sont conservées pour que la provenance de la démonstration soit vérifiable.
