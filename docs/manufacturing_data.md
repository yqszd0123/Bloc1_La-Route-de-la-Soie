# Données de fabrication produites

## Paquet ZIP

| Dossier | Contenu | Statut |
|---|---|---|
| `01_input` | demande Noov proposée et provenance IFC/STEP | coordination |
| `02_design` | JSON de conception, SVG, DXF d’enveloppe, STL FabLab | prototype/coordination |
| `03_manufacturing` | BOM, débit, composants unitaires, étiquettes, contrat Bloc 2 | neutre, non libéré machine |
| `04_quality` | validations, comparaison et snapshot des sources | audit |
| `05_interfaces` | réponses Noov/logistique proposées | contrat à confirmer |

## Identité des composants

L’ID est déterministe à partir du projet, mur, version et clé sémantique. Le même ID apparaît dans le modèle, le visuel, la BOM, la liste de débit, le QR et la séquence Bloc 2.

## Dimensions et masse

Les longueurs sont en mm. Les masses sont calculées en kg depuis les valeurs kg/m publiées. `toleranceMm` reste `null` : cela signifie « non définie », jamais tolérance zéro.

## DXF et STL

Le DXF représente des enveloppes 3D de profils pour coordination. Le STL vise une maquette FabLab à l’échelle. Aucun des deux n’est un développé de tôle, un programme de profilage, un plan de perçage ou un fichier robot natif.

## Libération

Le JSON porte toujours `BLOCKED_PENDING_AVELIS_CAPABILITY_CONFIRMATION`. Les données suivantes doivent venir d’Avelis/Bloc 2 : machine, profils acceptés, stock, opérations, perçages/fixations, précision de positionnement, tolérances et schéma natif.
