# Guide maquette FabLab

1. Télécharger le paquet ZIP et ouvrir `02_design/fablab`.
2. Choisir l’assemblage ou les pièces à l’échelle indiquée dans le nom.
3. Vérifier que les dimensions du slicer correspondent à l’échelle choisie ; ne pas convertir les mm en pouces.
4. Imprimer une petite pièce test avant l’ensemble.
5. Mesurer longueur, largeur et hauteur, puis noter l’écart relatif.
6. Utiliser les IDs de fichier/QR pour l’assemblage.

Les STL sont des enveloppes de présentation. Ils ne reproduisent pas les plis, trous, fixations ni épaisseurs imprimables exactes d’un profil réel.

## Présentation en couches

L’étape « Maquette en couches » du site permet de montrer le même mur dans quatre états : ossature acier, ajout de l’isolation, ajout des panneaux, puis apparence assemblée. La vue tourne sur 360° et le curseur « Assemblé ↔ éclaté », gradué de 0 à 200, explique la superposition.

Le calcul de maquette produit un rectangle d’isolant pour chaque cavité libre entre les profilés et autour des ouvertures. Chaque autre couche est un contour logique unique du mur dont les portes et fenêtres sont déduites. Le CSV dédié donne ID, position, largeur, hauteur, épaisseur de référence, surface et volume ; aucun prix n’est calculé.

Ces références publiques ne constituent pas une composition Avelis validée. Les pièces de couches ne sont pas générées dans l’IFC, le STEP, la BOM acier, la liste de débit acier ou le paquet ZIP. Les grands contours ne sont pas un calepinage de panneaux commerciaux : joints, formats de stock, fixations, jeux de pose et chutes restent à définir avec le FabLab et le Bloc 2.
