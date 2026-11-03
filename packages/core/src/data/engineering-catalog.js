/* GENERATED FILE — do not edit directly.
 * Authoritative source: data/engineering_sources.json
 * Regenerate with: npm run sync-data
 */
(function initEngineeringCatalog(global) {
  'use strict';
  const core = global.AvelisCore = global.AvelisCore || {};
  core.ENGINEERING_DATA = Object.freeze({
  "schemaVersion": "2.0",
  "verifiedOn": "2026-11-03",
  "scope": {
    "product": "Reference IFC-to-manufacturing workflow for cold-formed steel wall panels",
    "companyStatus": "Concept demonstrator for Avelis Bloc 1; reference products are not confirmed Avelis products or Torcy equipment.",
    "certificationStatus": "ENGINEERING_REVIEW_REQUIRED"
  },
  "sources": {
    "AVELIS_PRESENTATION_2026": {
      "kind": "company_document",
      "title": "Présentation générique Challenge Imagine & Make 2026 — Avelis",
      "location": "0-Presentation-generique_Challenge-Imagine-Make-2026_Avelis.pdf",
      "access": "internal_user_supplied",
      "usedFor": [
        "Avelis context",
        "1D/2D/3D product scope",
        "Torcy industrial ambition"
      ],
      "publicUseRestriction": "Do not republish confidential content without Avelis approval."
    },
    "AVELIS_BLOC1_2026": {
      "kind": "company_document",
      "title": "Fiche Bloc 1 — Conception, Challenge Imagine & Make 2026 — Avelis",
      "location": "Fiche_Bloc-1-Conception_Challenge-Imagine-Make-2026_Avelis.pdf",
      "access": "internal_user_supplied",
      "usedFor": [
        "digital continuity",
        "DfMA",
        "BOM and machine-data handover",
        "interfaces with production and logistics"
      ],
      "publicUseRestriction": "Do not republish confidential content without Avelis approval."
    },
    "ISO_16739_1_2024": {
      "kind": "standard_catalogue",
      "title": "ISO 16739-1:2024 — Industry Foundation Classes (IFC), Part 1: Data schema",
      "url": "https://www.iso.org/standard/84123.html",
      "identifier": "ISO 16739-1:2024",
      "edition": "2",
      "year": 2024,
      "region": "International",
      "locationInSource": "ISO catalogue abstract and lifecycle",
      "accessLimitation": "Catalogue and public preview consulted; full paid standard not accessed."
    },
    "BUILDINGSMART_IFC4_3": {
      "kind": "official_specification",
      "title": "IFC 4.3.2.0 Documentation",
      "url": "https://standards.buildingsmart.org/IFC/RELEASE/IFC4_3/",
      "identifier": "IFC4.3 ADD2",
      "year": 2024,
      "region": "International",
      "locationInSource": "IfcWall, IfcOpeningElement, IfcRelVoidsElement, IfcRelFillsElement, IfcLocalPlacement, IfcUnitAssignment"
    },
    "BUILDINGSMART_IFC4_WALL_SAMPLE": {
      "kind": "official_community_test_model",
      "title": "buildingSMART specification example — wall-with-opening-and-window.ifc",
      "url": "https://github.com/buildingsmart-community/ifcJSON/blob/main/Samples/IFC_4.0/BuildingSMARTSpec/wall-with-opening-and-window.ifc",
      "license": "Original buildingSMART specification example; repository attribution retained",
      "schema": "IFC4",
      "locationInProject": "test-data/ifc/wall-with-opening-and-window.ifc",
      "knownGeometry": {
        "wallLengthMm": 3000,
        "wallHeightMm": 2000,
        "wallThicknessMm": 300,
        "windowXMm": 1000,
        "windowSillMm": 500,
        "windowWidthMm": 1000,
        "windowHeightMm": 1000
      }
    },
    "OCCT_IMPORT_JS_0_0_23": {
      "kind": "open_source_geometry_parser",
      "title": "occt-import-js — JavaScript interface for Open CASCADE STEP/IGES/BREP import",
      "url": "https://github.com/kovacsv/occt-import-js/tree/0.0.23",
      "version": "0.0.23",
      "license": "LGPL-2.1 with Open CASCADE exception; wrapper license retained in third_party",
      "retrieved": "2026-11-03",
      "locationInProject": "third_party/occt-import-js",
      "usedFor": [
        "Browser and Node STEP parsing",
        "tessellated geometry extraction",
        "real STEP integration test"
      ],
      "applicability": "Geometry interoperability only; does not infer IFC semantics or Avelis manufacturing operations."
    },
    "OCCT_IMPORT_JS_CUBE_STEP": {
      "kind": "open_source_test_model",
      "title": "occt-import-js simple basic cube STEP fixture",
      "url": "https://github.com/kovacsv/occt-import-js/blob/0.0.23/test/testfiles/simple-basic-cube/cube.stp",
      "version": "0.0.23",
      "locationInProject": "test-data/step/cube.stp",
      "usedFor": [
        "End-to-end STEP parser verification",
        "bounding-box calculation cross-check"
      ],
      "knownGeometry": {
        "xMm": 300,
        "yMm": 300,
        "zMm": 300
      }
    },
    "BLOC1_BLOC2_INTERFACE_TEMPLATE_2026": {
      "kind": "user_supplied_interface_template",
      "title": "Bloc 1 → Bloc 2 — Exemple de schéma d’échange CSV / JSON",
      "location": "Bloc1_Bloc2_Interface_Schema.md",
      "access": "internal_user_supplied",
      "usedFor": [
        "Interface document structure",
        "field dictionary",
        "validation and responsibility split"
      ],
      "applicability": "Template structure only. Its fictional legacy material values are not imported; this project defines a steel-specific v2 contract from actual program outputs."
    },
    "METSEC_COMPONENTS_2026": {
      "kind": "manufacturer_technical_data",
      "manufacturer": "voestalpine Metsec",
      "title": "Metframe Components",
      "url": "https://www.metsec.com/products/metframe/components/",
      "retrieved": "2026-11-03",
      "region": "United Kingdom / reference product",
      "locationInSource": "Examples of section references; Studs / Joists table; Tracks table",
      "applicability": "Public reference product for concept verification only; not confirmed for Avelis."
    },
    "METSEC_SFS_BROCHURE_2024": {
      "kind": "manufacturer_technical_guide",
      "manufacturer": "voestalpine Metsec",
      "title": "Metsec SFS Product Brochure 2024",
      "url": "https://www.metsec.com/wp-content/uploads/2024/03/10460_Metsec-SFS-Product-Brochure_2024.pdf",
      "year": 2024,
      "locationInSource": "p. 164, external finish option details",
      "applicability": "States studs are typically at 600 mm centres in illustrated SFS wall build-ups; project-specific structural design remains required."
    },
    "ARCELORMITTAL_ORANGE_BOOK_CFS": {
      "kind": "manufacturer_design_reference",
      "manufacturer": "ArcelorMittal",
      "title": "Orange Book — Cold formed sections, dimensions of sections",
      "url": "https://orangebook.arcelormittal.com/explanatory-notes/cold-formed-sections/dimensions-of-sections",
      "retrieved": "2026-11-03",
      "locationInSource": "§2.1 Mass; §2.2 Thickness",
      "applicability": "Supports density-based cross-check and coating/core-thickness distinction; does not identify Avelis material."
    },
    "AFNOR_NF_EN_1993_1_3_NA": {
      "kind": "standard_catalogue",
      "title": "NF EN 1993-1-3/NA — Eurocode 3, cold-formed members and sheeting, French National Annex",
      "url": "https://www.boutique.afnor.org/fr-fr/norme/nf-en-199313-na/eurocode-3-calcul-des-structures-en-acier-partie-13-regles-generales-regles/fa154688/30050",
      "identifier": "NF EN 1993-1-3/NA",
      "region": "France",
      "accessLimitation": "Catalogue consulted; full paid clauses not accessed, so no compliance claim is made."
    },
    "AFNOR_NF_EN_1090_2_A1_2024": {
      "kind": "standard_catalogue",
      "title": "NF EN 1090-2+A1 — Technical requirements for steel structures",
      "url": "https://www.boutique.afnor.org/fr-fr/norme/nf-en-10902-a1/execution-des-structures-en-acier-et-des-structures-en-aluminium-partie-2-e/fa209783/421615",
      "identifier": "NF EN 1090-2+A1",
      "year": 2024,
      "region": "France",
      "locationInSource": "AFNOR catalogue record, May 2024",
      "accessLimitation": "Catalogue consulted; full 226-page paid standard not accessed, so no tolerance or compliance claim is made."
    },
    "LEGIFRANCE_ACCESSIBILITY_2015": {
      "kind": "official_regulation",
      "title": "Arrêté du 24 décembre 2015 — accessibility of collective housing and individual houses",
      "url": "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000031692481/",
      "year": 2015,
      "region": "France",
      "locationInSource": "Article 8 and dwelling provisions",
      "applicability": "Nominal door width reference only; applicability depends on project and door location."
    },
    "BUILDINGSMART_IFC2X_IMPLEMENTATION_GUIDE": {
      "kind": "official_implementation_guide",
      "title": "IFC 2x Model Implementation Guide v2.0b",
      "url": "https://standards.buildingsmart.org/documents/Implementation/IFC2x_Model_Implementation_Guide_V2-0b.pdf",
      "locationInSource": "standard single-swing door example",
      "applicability": "Reference example geometry (1 m × 2 m), not a French design requirement."
    },
    "CYPE_FR_COLD_FORMED_STEEL_PRICE_2026": {
      "kind": "construction_cost_database",
      "title": "France construction price generator — cold-formed galvanized steel in light steel framing",
      "url": "https://prix-construction.info/renovation/Structure_et_gros_oeuvre/Murs/Ossature_legere_metallique/GML020_Acier_forme_a_froid__dans_une_struc.html",
      "retrieved": "2026-11-03",
      "region": "France",
      "locationInSource": "Item mt07ali050c",
      "rawData": {
        "priceEurPerKgExVat": 3.32,
        "product": "DX52D+Z275MA cold-formed galvanized steel, C/U/Z/omega profiles"
      },
      "applicability": "Closest public structural light-gauge product reference; not an Avelis quotation."
    },
    "RNOV_WAVRIN_M48_PRICE_2026": {
      "kind": "regional_public_retail_price",
      "title": "RNOV Eco Matériaux — M48 galvanized steel stud, Wavrin (Lille metropolitan area)",
      "url": "https://www.rnovecomateriaux.fr/shop/category/spp-ossature-metalliques-22",
      "retrieved": "2026-11-03",
      "region": "Hauts-de-France",
      "locationInSource": "Montant M48 34-36 LG 3000 mm",
      "rawData": {
        "priceEurPerMExVat": 1,
        "lengthM": 3
      },
      "applicability": "Regional market cross-check for a lighter non-structural M48 profile; not technically equivalent to Metframe."
    },
    "ISOLAVA_M_PROFILE_2026": {
      "kind": "manufacturer_technical_data",
      "title": "Isolava — galvanized steel M studs technical sheet",
      "url": "https://isolava.fr/wp-content/uploads/2024/10/04_Fiche-technique-PROFILE-M_MONTANT.pdf",
      "retrieved": "2026-11-03",
      "locationInSource": "Weight per metre table",
      "rawData": {
        "m48MassKgPerM": 0.55,
        "m100MassKgPerM": 0.79
      },
      "applicability": "Used only to normalize public metre prices to €/kg for market cross-checking."
    },
    "LITT_M100_PRICE_2026": {
      "kind": "public_retail_price",
      "title": "LiTT — M100 NF 2.99 m galvanized steel stud",
      "url": "https://eshop.litt.fr/montant-100-nf-299-ml%2Cp1036976",
      "retrieved": "2026-11-03",
      "region": "France",
      "locationInSource": "Public product price and technical data",
      "rawData": {
        "priceEurExVat": 9.96,
        "lengthM": 2.99,
        "netMassKg": 2.419
      },
      "applicability": "Retail M100 cross-check; profile is not technically equivalent to Metframe."
    }
  },
  "catalog": {
    "material": {
      "id": "REF-METSEC-Z275-FY450",
      "label": "Reference cold-formed galvanized steel — Metsec Metframe",
      "status": "REFERENCE_PRODUCT_NOT_CONFIRMED_BY_AVELIS",
      "densityKgM3": 7850,
      "minimumYieldStrengthNmm2": 450,
      "coating": "Z275",
      "coreThicknessRule": {
        "nominalCoatingAllowanceMm": 0.04,
        "note": "ArcelorMittal Orange Book states 0.02 mm coating per face for standard Z275 and references EN 1993-1-3 for core thickness."
      },
      "sourceIds": [
        "METSEC_COMPONENTS_2026",
        "ARCELORMITTAL_ORANGE_BOOK_CFS"
      ]
    },
    "profiles": [
      {
        "id": "100MF12-50",
        "manufacturerReference": "100MF12/50",
        "family": "STUD_C",
        "massKgPerM": 2.11,
        "webDepthMm": 100,
        "flange1Mm": 50,
        "flange2Mm": 50,
        "lipMm": 14,
        "nominalThicknessMm": 1.2,
        "minimumYieldStrengthNmm2": 450,
        "coating": "Z275",
        "sourceId": "METSEC_COMPONENTS_2026",
        "sourceLocation": "Studs / Joists table, row 100MF12/50"
      },
      {
        "id": "100MF12-70",
        "manufacturerReference": "100MF12/70",
        "family": "STUD_C",
        "massKgPerM": 2.44,
        "webDepthMm": 100,
        "flange1Mm": 70,
        "flange2Mm": 70,
        "lipMm": 15,
        "nominalThicknessMm": 1.2,
        "minimumYieldStrengthNmm2": 450,
        "coating": "Z275",
        "sourceId": "METSEC_COMPONENTS_2026",
        "sourceLocation": "Studs / Joists table, row 100MF12/70"
      },
      {
        "id": "100MF14-70",
        "manufacturerReference": "100MF14/70",
        "family": "STUD_C",
        "massKgPerM": 2.85,
        "webDepthMm": 100,
        "flange1Mm": 70,
        "flange2Mm": 70,
        "lipMm": 15,
        "nominalThicknessMm": 1.4,
        "minimumYieldStrengthNmm2": 450,
        "coating": "Z275",
        "sourceId": "METSEC_COMPONENTS_2026",
        "sourceLocation": "Studs / Joists table, row 100MF14/70"
      },
      {
        "id": "104MF12",
        "manufacturerReference": "104MF12",
        "family": "TRACK_U",
        "massKgPerM": 2.11,
        "webDepthMm": 104,
        "flange1Mm": 62,
        "flange2Mm": 62,
        "lipMm": 0,
        "nominalThicknessMm": 1.2,
        "minimumYieldStrengthNmm2": 450,
        "coating": "Z275",
        "sourceId": "METSEC_COMPONENTS_2026",
        "sourceLocation": "Tracks table, row 104MF12"
      },
      {
        "id": "104MF14",
        "manufacturerReference": "104MF14",
        "family": "TRACK_U",
        "massKgPerM": 2.46,
        "webDepthMm": 104,
        "flange1Mm": 65,
        "flange2Mm": 65,
        "lipMm": 0,
        "nominalThicknessMm": 1.4,
        "minimumYieldStrengthNmm2": 450,
        "coating": "Z275",
        "sourceId": "METSEC_COMPONENTS_2026",
        "sourceLocation": "Tracks table, row 104MF14"
      }
    ],
    "compatibleProfileSets": [
      {
        "id": "MF-12-50",
        "studProfileId": "100MF12-50",
        "trackProfileId": "104MF12"
      },
      {
        "id": "MF-12-70",
        "studProfileId": "100MF12-70",
        "trackProfileId": "104MF12"
      },
      {
        "id": "MF-14-70",
        "studProfileId": "100MF14-70",
        "trackProfileId": "104MF14"
      }
    ]
  },
  "referenceRules": {
    "studSpacingMm": {
      "value": 600,
      "sourceId": "METSEC_SFS_BROCHURE_2024",
      "status": "REFERENCE_TYPICAL_NOT_STRUCTURALLY_VERIFIED",
      "condition": "Illustrated SFS wall build-ups; final centres must be determined by project-specific design."
    },
    "doorNominalWidthMm": {
      "value": 900,
      "sourceId": "LEGIFRANCE_ACCESSIBILITY_2015",
      "status": "REGULATORY_REFERENCE_CONDITIONAL",
      "condition": "Applicability depends on building type, door function and current project regulation."
    },
    "referenceDoorHeightMm": {
      "value": 2000,
      "sourceId": "BUILDINGSMART_IFC2X_IMPLEMENTATION_GUIDE",
      "status": "REFERENCE_EXAMPLE_NOT_REQUIREMENT"
    },
    "hautsDeFranceSteelBudgetPrice": {
      "valueEurPerKgExVat": 3.09,
      "lowerReferenceEurPerKgExVat": 1.82,
      "upperReferenceEurPerKgExVat": 4.12,
      "priceDate": "2026-11-03",
      "status": "REGIONAL_BUDGET_PROXY_NOT_SUPPLIER_QUOTE",
      "sourceIds": [
        "CYPE_FR_COLD_FORMED_STEEL_PRICE_2026",
        "RNOV_WAVRIN_M48_PRICE_2026",
        "ISOLAVA_M_PROFILE_2026",
        "LITT_M100_PRICE_2026"
      ],
      "method": "Arithmetic mean of 3.32 €/kg (French cold-formed Z275 construction database), 1.00 €/m ÷ 0.55 kg/m = 1.82 €/kg (regional Lille M48 retail cross-check), and 9.96 € ÷ 2.419 kg = 4.12 €/kg (M100 retail cross-check), rounded to 3.09 €/kg ex VAT.",
      "boundary": "Material supply only, ex VAT. Excludes delivery, minimum-order effects, fasteners, fabrication, waste, labour and installation.",
      "limitation": "No public statistical average was found for the exact Metframe profiles in Hauts-de-France. This is a transparent regional budget proxy using one local listing and two comparable French references."
    }
  },
  "calculations": {
    "memberMassKg": {
      "formula": "length_mm / 1000 × manufacturer_mass_kg_per_m",
      "inputs": [
        "member.lengthMm",
        "profile.massKgPerM"
      ],
      "verification": "Sum by member is cross-checked against BOM grouped length × mass per metre."
    },
    "densityCrossCheckKgPerM": {
      "formula": "developed_width_mm × nominal_thickness_mm × 1e-6 × 7850",
      "inputs": [
        "webDepthMm",
        "flange1Mm",
        "flange2Mm",
        "lipMm",
        "nominalThicknessMm",
        "densityKgM3"
      ],
      "limitation": "Flat-width approximation excludes bend radii and detailed coating geometry; used only as an independent plausibility check."
    },
    "materialCostEur": {
      "formula": "steel_mass_kg × 3.09 EUR/kg ex VAT",
      "status": "COMPUTED_AS_HAUTS_DE_FRANCE_BUDGET_PROXY",
      "inputs": [
        "steelMassKg",
        "referenceRules.hautsDeFranceSteelBudgetPrice.valueEurPerKgExVat"
      ],
      "rangeFormula": "steel_mass_kg × [1.82, 4.12] EUR/kg ex VAT",
      "verification": "Program reproduces all three normalized source prices and their arithmetic mean."
    }
  },
  "unresolvedAvelisInputs": [
    {
      "id": "AVELIS_PROFILE_CATALOG",
      "status": "REQUIRED",
      "description": "Actual steel grades, profiles, suppliers and approved substitutions."
    },
    {
      "id": "AVELIS_LOAD_CASES",
      "status": "REQUIRED_FOR_STRUCTURAL_DESIGN",
      "description": "Permanent, imposed, wind, snow, accidental and construction-stage actions plus combinations and boundary conditions."
    },
    {
      "id": "AVELIS_CONNECTION_LIBRARY",
      "status": "REQUIRED_FOR_STRUCTURAL_DESIGN",
      "description": "Fasteners, bolts, screws, welds, hole patterns, edge distances and verified capacities."
    },
    {
      "id": "TORCY_MACHINE_CAPABILITIES",
      "status": "REQUIRED_FOR_MACHINE_RELEASE",
      "description": "Equipment, supported operations, stock lengths, positioning accuracy, file formats and control codes."
    },
    {
      "id": "AVELIS_MANUFACTURING_TOLERANCES",
      "status": "REQUIRED_FOR_MACHINE_RELEASE",
      "description": "Approved product- and process-specific manufacturing tolerances and inspection methods."
    },
    {
      "id": "AVELIS_PROCUREMENT_PRICES",
      "status": "REQUIRED_FOR_COST",
      "description": "Dated supplier quotations, units, delivery terms, minimum order quantities and scrap valuation."
    },
    {
      "id": "AVELIS_PRODUCT_EPD",
      "status": "REQUIRED_FOR_CARBON",
      "description": "Applicable product-specific EPD and declared system boundary."
    },
    {
      "id": "NOOV_API_CONTRACT",
      "status": "REQUIRED_FOR_INTEGRATION",
      "description": "Official Noov payload schema, authentication, versioning and error protocol."
    }
  ]
});
})(typeof globalThis !== 'undefined' ? globalThis : window);
