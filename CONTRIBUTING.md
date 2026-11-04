# Contribuer

1. Conserver la séparation `domain → generation/rules → optimization → export → UI`.
2. Ne jamais placer une règle métier dans un gestionnaire d'événement HTML.
3. Pour étendre une fonction existante, modifier sa source de vérité et tous ses consommateurs, puis supprimer l'ancien champ ou l'ancienne branche. Ne pas juxtaposer une seconde chaîne parallèle.
4. Mutualiser les comportements communs dans le modèle métier ; réserver les conditions aux différences réelles du domaine.
5. Ajouter un test pour toute nouvelle règle, métrique ou sortie.
6. Ne pas présenter une hypothèse POC comme une règle Avelis validée.
7. Garder des identifiants de composants stables dans tous les fichiers.
8. Vérifier la licence avant toute réutilisation de code externe.

Critères d'acceptation : `npm test` réussit, les sept expériences (trois acier, trois bois, une référence Avelis provisoire) se régénèrent, l'application fonctionne hors ligne et le paquet ZIP contient entrée, conception, fabrication, qualité et interfaces.
