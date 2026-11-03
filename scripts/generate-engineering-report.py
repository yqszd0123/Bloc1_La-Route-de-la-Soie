from __future__ import annotations

import json
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Flowable
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parents[1] / "outputs" / "Engineering_Data_Report_Avelis_Wall_Flow_2.0.pdf"
DATA = json.loads((ROOT / "data" / "engineering_sources.json").read_text(encoding="utf-8"))
EXPERIMENT = json.loads((ROOT / "experiments" / "results" / "official-ifc-window" / "experiment-result.json").read_text(encoding="utf-8"))

NAVY = colors.HexColor("#163342")
TEAL = colors.HexColor("#2D6772")
ORANGE = colors.HexColor("#D36B32")
PALE = colors.HexColor("#EAF1F2")
PALE_ORANGE = colors.HexColor("#FFF1E8")
INK = colors.HexColor("#23333A")
MUTED = colors.HexColor("#61727A")
LINE = colors.HexColor("#C7D3D7")
WHITE = colors.white

font_path = Path("C:/Windows/Fonts/arial.ttf")
bold_path = Path("C:/Windows/Fonts/arialbd.ttf")
pdfmetrics.registerFont(TTFont("Avelis", str(font_path)))
pdfmetrics.registerFont(TTFont("Avelis-Bold", str(bold_path)))


class FlowDiagram(Flowable):
    def __init__(self, width=170*mm, height=48*mm):
        super().__init__()
        self.width, self.height = width, height

    def draw(self):
        c = self.canv
        boxes = [
            (0, "IFC / STEP /\nmanuel"), (37, "Entrée\nnormalisée"),
            (74, "Générateur\nacier"), (111, "6 candidats +\ncontrôles"),
            (148, "Paquet\nBloc 2")
        ]
        for x_mm, label in boxes:
            x = x_mm * mm
            c.setFillColor(PALE if x_mm not in (74, 148) else PALE_ORANGE)
            c.setStrokeColor(TEAL)
            c.roundRect(x, 12*mm, 29*mm, 22*mm, 3*mm, fill=1, stroke=1)
            c.setFillColor(NAVY)
            c.setFont("Avelis-Bold", 8.5)
            for i, line in enumerate(label.split("\n")):
                c.drawCentredString(x + 14.5*mm, (26 - i*4.5)*mm, line)
        c.setStrokeColor(ORANGE)
        c.setLineWidth(2)
        for x_mm in (29, 66, 103, 140):
            x = x_mm*mm
            c.line(x, 23*mm, (x_mm+8)*mm, 23*mm)
            c.line((x_mm+8)*mm, 23*mm, (x_mm+5)*mm, 25*mm)
            c.line((x_mm+8)*mm, 23*mm, (x_mm+5)*mm, 21*mm)
        c.setFillColor(MUTED)
        c.setFont("Avelis", 7.2)
        c.drawString(0, 3*mm, "Une seule chaîne métier : les mêmes composants alimentent visualisation, BOM, calculs et exports.")


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="BodyA", fontName="Avelis", fontSize=9.2, leading=13.2, textColor=INK, spaceAfter=6))
styles.add(ParagraphStyle(name="SmallA", fontName="Avelis", fontSize=7.5, leading=10, textColor=MUTED))
styles.add(ParagraphStyle(name="H1A", fontName="Avelis-Bold", fontSize=22, leading=26, textColor=NAVY, spaceAfter=12))
styles.add(ParagraphStyle(name="H2A", fontName="Avelis-Bold", fontSize=15, leading=18, textColor=TEAL, spaceBefore=4, spaceAfter=8))
styles.add(ParagraphStyle(name="H3A", fontName="Avelis-Bold", fontSize=10.5, leading=13, textColor=NAVY, spaceBefore=5, spaceAfter=4))
styles.add(ParagraphStyle(name="CoverTitle", fontName="Avelis-Bold", fontSize=28, leading=33, textColor=WHITE, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="CoverSub", fontName="Avelis", fontSize=13, leading=18, textColor=colors.HexColor("#DCE9EC")))
styles.add(ParagraphStyle(name="Callout", fontName="Avelis-Bold", fontSize=9, leading=12, textColor=NAVY, backColor=PALE_ORANGE, borderColor=ORANGE, borderWidth=0.7, borderPadding=8, spaceBefore=5, spaceAfter=8))
styles.add(ParagraphStyle(name="TableHead", fontName="Avelis-Bold", fontSize=7.4, leading=9, textColor=WHITE, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="TableCell", fontName="Avelis", fontSize=7.2, leading=9, textColor=INK))


def P(text, style="BodyA"):
    return Paragraph(text, styles[style])


def bullets(items):
    out = []
    for item in items:
        out.append(Paragraph(f"• {item}", ParagraphStyle(name=f"b{len(out)}", parent=styles["BodyA"], leftIndent=10, firstLineIndent=-7, spaceAfter=3)))
    return out


def table(headers, rows, widths=None, font_size=7.2):
    data = [[P(h, "TableHead") for h in headers]] + [[P(str(v), "TableCell") for v in row] for row in rows]
    t = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), TEAL), ("TEXTCOLOR", (0,0), (-1,0), WHITE),
        ("GRID", (0,0), (-1,-1), 0.35, LINE), ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 5), ("RIGHTPADDING", (0,0), (-1,-1), 5),
        ("TOPPADDING", (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, PALE]),
    ]))
    return t


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, A4[1]-15*mm, A4[0], 15*mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Avelis-Bold", 8)
    canvas.drawString(18*mm, A4[1]-9.5*mm, "AVELIS WALL FLOW 2.0 — ENGINEERING DATA REPORT")
    canvas.setStrokeColor(LINE)
    canvas.line(18*mm, 14*mm, A4[0]-18*mm, 14*mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Avelis", 7.5)
    canvas.drawString(18*mm, 9*mm, "Imagine & Make 2026 · Bloc 1 · Équipe 3 — La Route de la Soie")
    canvas.drawRightString(A4[0]-18*mm, 9*mm, f"Page {doc.page}")
    canvas.restoreState()


def cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.setFillColor(TEAL)
    canvas.circle(A4[0]-18*mm, A4[1]-32*mm, 62*mm, fill=1, stroke=0)
    canvas.setFillColor(ORANGE)
    canvas.circle(A4[0]-4*mm, 15*mm, 48*mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Avelis-Bold", 9)
    canvas.drawString(20*mm, A4[1]-23*mm, "IMAGINE & MAKE 2026 · AVELIS · BLOC 1")
    canvas.setFont("Avelis", 8)
    canvas.drawString(20*mm, 20*mm, "Version 2.0 · 3 novembre 2026 · ENGINEERING_REVIEW_REQUIRED")
    canvas.restoreState()


def section(title, intro=None):
    out = [P(title, "H1A"), HRFlowable(width="100%", thickness=1.4, color=ORANGE, spaceAfter=8)]
    if intro:
        out.append(P(intro))
    return out


metrics = EXPERIMENT["metrics"]
profiles = DATA["catalog"]["profiles"]
unresolved = DATA["unresolvedAvelisInputs"]

story = []
story += [Spacer(1, 68*mm), P("Engineering Data<br/>Report", "CoverTitle"), Spacer(1, 8*mm), P("IFC / STEP → conception paramétrique acier → préparation de fabrication", "CoverSub"), Spacer(1, 15*mm), P("Une chaîne logicielle exécutable, traçable et vérifiée pour le Bloc 1. Les résultats géométriques et quantitatifs sont calculés ; la validation structurelle et la libération machine restent explicitement bloquées.", "CoverSub"), PageBreak()]

story += section("1. Résumé exécutif", "Avelis Wall Flow transforme trois types d’entrée en un modèle commun de panneau acier, génère six variantes, vérifie leur cohérence et remet un paquet neutre au Bloc 2.")
story.append(FlowDiagram())
story += bullets([
    "Entrées : configuration manuelle, vrai IFC avec sémantique mur/ouverture, vrai STEP/STP lu par Open CASCADE.",
    "Produit de référence : profils acier formés à froid galvanisés Z275, valeurs géométriques et kg/m issues d’un fabricant public.",
    "Résultat IFC de référence : CAND-02, 13 pièces, 46,176 kg, 142,68 € HT au scénario central.",
    "Vérification croisée : masse des pièces et masse groupée de BOM concordent ; écart d’arrondi 0,0004 kg.",
    "Statut : démonstrateur conceptuel. Aucun certificat structurel, aucune tolérance inventée, aucune libération machine."
])
story.append(P("Décision recommandée", "H2A"))
story.append(P("Utiliser la version 2.0 comme contrat numérique de discussion entre Bloc 1, Bloc 2 et Avelis ; remplacer progressivement les produits, prix et capacités de référence par les données industrielles confirmées.", "Callout"))
story.append(PageBreak())

story += section("2. Architecture et principe de conception")
story.append(P("Le système utilise une source de vérité unique. Les adaptateurs IFC et STEP ne génèrent pas une deuxième logique : ils produisent le même objet d’entrée que le formulaire. Le générateur, les règles, les métriques et les exports sont partagés."))
story.append(table(["Couche", "Responsabilité", "Garantie"], [
    ["Entrées", "Normaliser IFC, STEP ou manuel", "Unités, provenance, dimensions, ouvertures"],
    ["Domaine", "Projet, version, matériau, profils", "Identifiants et données traçables"],
    ["Génération", "Créer rails, montants et cadres", "Même composant dans visuel, BOM et JSON"],
    ["Règles", "Contrôler enveloppe, collisions, valeurs", "Erreurs bloquantes avant export"],
    ["Optimisation", "Évaluer 6 variantes", "Recherche exhaustive et classement stable"],
    ["Exports", "CSV, JSON, SVG, DXF, STL, ZIP", "Paquet cohérent et statut explicite"]
], [27*mm, 65*mm, 78*mm]))
story.append(P("Règle d’évolution", "H2A"))
story.append(P("Toute modification change le modèle métier commun et supprime la logique devenue redondante. La porte et la fenêtre sont deux instances d’un même objet ouverture ; seule leur différence réelle — notamment l’absence d’appui bas pour une porte — reste spécifique."))
story.append(PageBreak())

story += section("3. Entrées IFC, STEP et manuelle")
story.append(P("IFC apporte la sémantique BIM ; STEP apporte une géométrie CAO ; le formulaire apporte un besoin paramétrique. Le logiciel conserve cette différence au lieu de présenter toutes les sources comme équivalentes."))
story.append(table(["Mode", "Lecture", "Données conservées", "Limite affichée"], [
    ["IFC", "ISO 10303-21, schéma IFC, unités", "bâtiment, étage, mur, placements, vides, portes/fenêtres", "BRep/tessellation complexe non devinée"],
    ["STEP/STP", "Open CASCADE, maillage, enveloppe X/Y/Z", "fichier, empreinte, sommets, axes confirmés", "pas de sémantique d’ouverture ni d’opération machine"],
    ["Manuel", "champs géométriques", "enveloppe, porte/fenêtre activables", "données déclarées par l’utilisateur"]
], [24*mm, 43*mm, 63*mm, 40*mm]))
story.append(P("Cas de test IFC", "H2A"))
story += bullets(["IFC4 réel, 133 entités, unité millimètre.", "Mur 3000 × 2000 × 300 mm.", "Fenêtre 1000 × 1000 mm à x=1000 mm et allège 500 mm.", "Relations mur → ouverture → fenêtre et placement global testés."])
story.append(P("Cas de test STEP", "H2A"))
story += bullets(["STEP AP214 réel lu par le moteur géométrique.", "1 maillage, 24 sommets, enveloppe 300 × 300 × 300 mm.", "Trois axes distincts obligatoires ; un doublon X/Y/Z bloque la conversion."])
story.append(PageBreak())

story += section("4. Catalogue acier de référence")
profile_rows = [[p["id"], p["manufacturerReference"], p["family"], f'{p["massKgPerM"]:.2f}', p["webDepthMm"], f'{p["flange1Mm"]}/{p["flange2Mm"]}', p["nominalThicknessMm"]] for p in profiles]
story.append(table(["ID", "Réf. fabricant", "Famille", "kg/m", "web mm", "semelles mm", "t mm"], profile_rows, [27*mm, 28*mm, 22*mm, 15*mm, 18*mm, 25*mm, 15*mm]))
story.append(Spacer(1, 5*mm))
story += bullets([
    "Acier galvanisé Z275 de référence ; limite d’élasticité minimale déclarée 450 N/mm².",
    "Densité 7 850 kg/m³ utilisée seulement pour une vérification indépendante.",
    "La masse kg/m publiée est l’entrée principale du calcul de quantité.",
    "Ces références ne prouvent pas que les mêmes profils sont utilisés par Avelis ou à Torcy."
])
story.append(P("Formule de masse", "H2A"))
story.append(P("masse pièce [kg] = longueur [mm] / 1000 × masse linéique fabricant [kg/m]", "Callout"))
story.append(P("Contrôle de plausibilité : largeur développée × épaisseur × densité. Cette approximation ignore les rayons de pliage détaillés ; les tests exigent un écart relatif inférieur à 5 % pour chaque profil du catalogue."))
story.append(PageBreak())

story += section("5. Règles géométriques et ouvertures")
story.append(P("Le générateur calcule d’abord les zones réservées aux ouvertures, puis place les éléments de rive, d’encadrement et de trame. Une pièce qui traverse un vide clair est rejetée."))
story.append(table(["Règle", "Comportement", "Validation"], [
    ["Enveloppe", "dimensions positives et ouverture entièrement contenue", "bloquante"],
    ["Tête d’ouverture", "zone positive obligatoire au-dessus", "bloquante"],
    ["Porte", "allège 0, rail bas interrompu, pas d’appui de fenêtre", "bloquante + avertissement largeur"],
    ["Fenêtre", "jambages, linteau, appui et montants interrompus", "bloquante"],
    ["Conflit", "deux ouvertures ne peuvent pas se recouvrir", "bloquante"],
    ["Entraxe 600 mm", "cas de référence fabricant", "revue structure requise"]
], [35*mm, 94*mm, 32*mm]))
story.append(P("Porte activable", "H2A"))
story.append(P("L’interface traite la porte comme une option réelle. Lorsqu’elle est active, la liste de pièces contient deux segments de rail bas séparés par le passage, deux jambages et un linteau. Une hauteur égale à la hauteur totale du panneau est refusée explicitement, car le flux de panneau encadré exige une zone de tête positive."))
story.append(PageBreak())

story += section("6. Recherche et décision multicritère")
story.append(P("L’espace est petit et entièrement exploré : trois couples de profils × deux stratégies d’implantation. Aucune solution n’est injectée comme résultat prédéfini."))
story.append(table(["Dimension", "Options"], [
    ["Couples profils", "MF-12-50, MF-12-70, MF-14-70"],
    ["Implantation", "origine du mur ; alignée sur les ouvertures"],
    ["Métriques", "masse, nombre de pièces, longueurs distinctes, coupes"],
    ["Décision", "normalisation min–max, score inférieur préférable, Pareto indépendant"]
], [44*mm, 116*mm]))
story.append(P("Résultat du cas IFC", "H2A"))
story.append(table(["Candidat", "Profils", "Implantation", "Masse", "Pièces", "Longueurs", "Budget HT"], [[
    EXPERIMENT["recommendedCandidateId"], "100MF12/50 + 104MF12", "alignée ouvertures",
    f'{metrics["steelMassKg"]:.3f} kg', metrics["componentCount"], metrics["uniqueLengthCount"], f'{metrics["materialCostEstimateEurExVat"]:.2f} €'
]], [24*mm, 37*mm, 37*mm, 24*mm, 16*mm, 19*mm, 23*mm]))
story.append(P("Le score n’est valable qu’à l’intérieur de l’espace décrit. Il ne remplace ni un calcul de résistance ni une optimisation de chutes de stock."))
story.append(PageBreak())

story += section("7. Budget matière")
budget = DATA["referenceRules"]["hautsDeFranceSteelBudgetPrice"]
story.append(P("Les champs de prix sont facultatifs. Vides, ils activent le proxy régional documenté ; renseignés, ils produisent un scénario utilisateur sans modifier la géométrie."))
story.append(table(["Élément", "Valeur", "Périmètre"], [
    ["Central", f'{budget["valueEurPerKgExVat"]:.2f} €/kg HT', "matière seule"],
    ["Bas", f'{budget["lowerReferenceEurPerKgExVat"]:.2f} €/kg HT', "référence publique normalisée"],
    ["Haut", f'{budget["upperReferenceEurPerKgExVat"]:.2f} €/kg HT', "référence publique normalisée"],
    ["Cas IFC", f'{metrics["materialCostEstimateEurExVat"]:.2f} € HT', f'{metrics["steelMassKg"]:.3f} kg × {budget["valueEurPerKgExVat"]:.2f}'],
    ["Fourchette cas IFC", f'{metrics["materialCostRangeEurExVat"]["low"]:.2f}–{metrics["materialCostRangeEurExVat"]["high"]:.2f} € HT', "incertitude de prix, pas structurelle"]
], [45*mm, 43*mm, 72*mm]))
story.append(P("Exclusions", "H2A"))
story += bullets(["livraison et minimum de commande", "chutes et valorisation de rebut", "fixations et consommables", "façonnage, main-d’œuvre et pose", "prix contractuel Avelis"])
story.append(P("La valeur 3,09 €/kg n’est pas présentée comme une moyenne statistique officielle. C’est un proxy transparent, daté et remplaçable."))
story.append(PageBreak())

story += section("8. Paquet de fabrication et interface Bloc 1 → Bloc 2")
story.append(P("Le paquet ZIP est une remise de données neutres, organisée par entrée, conception, fabrication, qualité et interfaces. Il conserve la même identité de composant dans tous les fichiers."))
story.append(table(["Fichier", "Contenu", "Usage"], [
    ["bom.csv", "références groupées, quantités, masses", "approvisionnement/contrôle"],
    ["cutting_list.csv", "une ligne par composant", "préparation de débit"],
    ["machine_neutral_members.csv", "position, axe, QR", "mapping Bloc 2"],
    ["manufacturing_handover.json", "composants + séquence + dépendances", "contrat v2 proposé"],
    ["DXF / STL", "enveloppes et maquette", "coordination / FabLab"],
    ["validation_report.json", "contrôles et exclusions", "audit"]
], [43*mm, 67*mm, 50*mm]))
story.append(P("Séquence proposée", "H2A"))
story += bullets(["rails bas", "montants de rive et jambages", "montants courants/interrompus", "linteaux et appuis", "rail haut", "contrôle dimensionnel et identifiants"])
story.append(P("Le statut reste BLOCKED_PENDING_AVELIS_CAPABILITY_CONFIRMATION. Une séquence de conception n’est ni une trajectoire robot ni un temps de cycle.", "Callout"))
story.append(PageBreak())

story += section("9. Vérification logicielle et croisements")
story.append(table(["Contrôle", "Méthode", "Résultat"], [
    ["Catalogue", "JSON autoritatif = module navigateur", "PASS"],
    ["Masse profil", "fabricant vs approximation densité", "PASS < 5 %"],
    ["Masse panneau", "somme pièces vs BOM", "MATCH, 0,0004 kg"],
    ["IFC", "fixture réel et géométrie connue", "PASS"],
    ["STEP", "fixture réel Open CASCADE", "PASS, 24 sommets"],
    ["Porte", "rail bas interrompu, cadre générique", "PASS"],
    ["Ouvertures", "hors enveloppe, chevauchement, tête", "PASS"],
    ["Optimisation", "6 générés = 6 déclarés", "PASS"],
    ["Exports", "signatures STL/DXF/SVG/ZIP et contrat", "PASS"]
], [38*mm, 82*mm, 40*mm]))
story.append(P("Bilan automatisé", "H2A"))
story.append(P("23 vérifications réussies : 22 tests du moteur et 1 intégration réelle STEP/Open CASCADE. Les valeurs de présentation sont produites par le même programme que les exports."))
story.append(PageBreak())

story += section("10. Limites et données à obtenir")
required_fr = {
    "AVELIS_PROFILE_CATALOG": ("REQUIS", "Nuances, profils, fournisseurs et substitutions réellement approuvés."),
    "AVELIS_LOAD_CASES": ("REQUIS — STRUCTURE", "Actions permanentes, exploitation, vent, neige, accidentelles et chantier ; combinaisons et appuis."),
    "AVELIS_CONNECTION_LIBRARY": ("REQUIS — STRUCTURE", "Fixations, boulons, vis, soudures, perçages, distances aux rives et résistances vérifiées."),
    "TORCY_MACHINE_CAPABILITIES": ("REQUIS — MACHINE", "Équipements, opérations, longueurs de stock, précision, formats et commandes disponibles."),
    "AVELIS_MANUFACTURING_TOLERANCES": ("REQUIS — MACHINE", "Tolérances produit/processus et méthodes de contrôle approuvées."),
    "AVELIS_PROCUREMENT_PRICES": ("REQUIS — COÛT", "Devis datés, unités, livraison, minimum de commande et valorisation des chutes."),
    "AVELIS_PRODUCT_EPD": ("REQUIS — CARBONE", "EPD produit applicable et frontière de système déclarée."),
    "NOOV_API_CONTRACT": ("REQUIS — INTÉGRATION", "Schéma Noov officiel, authentification, versionnement et protocole d’erreur.")
}
limit_rows = [[u["id"], required_fr[u["id"]][0], required_fr[u["id"]][1]] for u in unresolved]
story.append(table(["Donnée", "Statut", "Pourquoi"], limit_rows, [44*mm, 42*mm, 74*mm]))
story.append(Spacer(1, 5*mm))
story.append(P("Aucune conclusion de sécurité ne doit être tirée sans cas de charges, appuis, contreventement et assemblages. Aucune fabrication réelle ne doit être lancée sans tolérances, capacités machines, opérations, stock et format natif confirmés.", "Callout"))
story.append(PageBreak())

story += section("11. Conclusion et prochaines décisions")
story += bullets([
    "Valider avec Avelis le catalogue acier réel ou la règle de substitution.",
    "Faire confirmer par Bloc 2 le JSON v2, les CSV et la séquence de dépendances.",
    "Obtenir les machines, opérations, longueurs de stock et tolérances de Torcy.",
    "Confier les cas de charges et assemblages à un ingénieur structure qualifié.",
    "Remplacer le proxy budgétaire par des devis datés lorsqu’ils existent.",
    "Conserver les tests IFC, STEP et BOM comme critères d’acceptation continus."
])
story.append(P("Résultat", "H2A"))
story.append(P("Le Bloc 1 dispose d’un logiciel exécutable, organisé comme un projet logiciel maintenable, capable de démontrer une continuité numérique réelle depuis IFC/STEP jusqu’à une remise de fabrication traçable — tout en séparant clairement les calculs établis des données industrielles encore manquantes.", "Callout"))
story.append(Spacer(1, 7*mm))
story.append(P("Références principales", "H2A"))
story += bullets([
    "ISO 16739-1:2024 et documentation buildingSMART IFC 4.3.2.0.",
    "NF EN 1993-1-3/NA et NF EN 1090-2+A1 : domaine identifié, clauses payantes non revendiquées comme vérifiées.",
    "voestalpine Metsec, Metframe Components et brochure SFS 2024.",
    "ArcelorMittal Orange Book, sections formées à froid.",
    "Légifrance, arrêté accessibilité du 24 décembre 2015.",
    "Open CASCADE via le module STEP versionné du projet."
])
story.append(P("La liste complète avec URL, date, chapitre, données brutes, formules et limites est dans data/engineering_sources.json.", "SmallA"))


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUTPUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm,
        topMargin=22*mm, bottomMargin=19*mm, title="Engineering Data Report — Avelis Wall Flow 2.0",
        author="Équipe 3 — La Route de la Soie"
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=frame, onPage=cover),
        PageTemplate(id="body", frames=frame, onPage=header_footer)
    ])
    # Switch to the body template after the cover page.
    from reportlab.platypus import NextPageTemplate
    story.insert(story.index(next(x for x in story if isinstance(x, PageBreak))), NextPageTemplate("body"))
    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build()
