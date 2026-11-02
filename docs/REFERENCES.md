# Références et état de l'art

Consultation du 2 novembre 2026.

- Timberframe Studio, dépôt public : <https://github.com/takzen/timberframe-studio>. Référence pour la représentation individuelle des pièces, les ouvertures et la BOM. Le dépôt se présente comme un travail en cours et non comme un outil de calcul structurel.
- Lite BIM Simulator, dépôt public : <https://github.com/RCEjosephkarl/Lite-BIM-Simulator>. Référence pour la séparation des matériaux, règles, géométrie et ossature ainsi que pour l'interface Three.js. Aucune copie en l'absence de licence clairement confirmée.
- build123-timber, dépôt public : <https://github.com/jopdorp/build123-timber>. Référence pour la génération paramétrique d'éléments bois et les exports STEP/IFC/nomenclature.
- COMPAS Timber, documentation d'architecture : <https://gramaziokohler.github.io/compas_timber/latest/user_manual/architecture.html>. Référence pour le principe « paramètres et intention comme source de vérité » et la dérivation vers les modèles de fabrication.
- AFNOR, Eurocode 5 — calcul des structures en bois. Référence normative à intégrer dans une phase industrielle avec un ingénieur qualifié ; non implémentée dans ce POC.
- Cahier général Avelis et fiche Bloc 1 Imagine & Make 2026, fournis par l'encadrement. Sources primaires des objectifs et livrables.

## Conclusion de l'étude

Aucun dépôt public étudié ne couvre, sans adaptation, l'enchaînement complet exigé : configuration Noov, génération de variantes, règles DfMA, optimisation multicritère, fichiers de fabrication, interfaces entre blocs, prototype FabLab et preuve expérimentale. La stratégie retenue est donc un noyau original, léger et testable, inspiré des bonnes séparations observées, avec contrats de données explicites.
