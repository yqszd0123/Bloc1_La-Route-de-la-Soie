# Expériences reproductibles

Commande : `node scripts/generate-experiments.js`.

Les scénarios couvrent un mur IFC de référence, un panneau large, un panneau compact et un cas fenêtre + porte. Chaque dossier contient entrée, conception, fabrication, qualité, interfaces et ZIP. Les fichiers sont régénérés depuis le moteur, jamais saisis à la main.

Cas principal attendu : 3000 × 2000 × 300 mm, fenêtre 1000 × 1000 à x=1000 et allège 500. Le moteur 2.2 explore neuf combinaisons distinctes. Recommandé : `CAND-03`, stratégie zones d’ouvertures, 12 composants, 42,217 kg, 130,45 € HT au scénario central, avec entraxes réels de 475 à 525 mm. Toute modification du moteur qui change ces valeurs doit être expliquée et couverte par les tests.
