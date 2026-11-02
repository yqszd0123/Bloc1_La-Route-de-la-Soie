(function initConstants(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  core.VERSION = '1.1.1';

  core.DEFAULT_INPUT = Object.freeze({
    projectId: 'AVELIS-POC',
    typology: 'T1',
    wallId: 'W001',
    version: '1.0',
    wallLengthMm: 3000,
    wallHeightMm: 2400,
    windowWidthMm: 900,
    windowHeightMm: 1000,
    windowXMm: 1060,
    sillHeightMm: 900,
    doorEnabled: true,
    doorWidthMm: 700,
    doorHeightMm: 2040,
    doorXMm: 180,
    priority: 'balanced',
    prototypeScale: 15
  });

  core.DEFAULT_RULES = Object.freeze({
    profileId: 'POC-FR-TIMBER-2026-01',
    profileLabel: 'Profil conceptuel — validation ingénieur requise',
    materialCode: 'C24-DEMO',
    materialLabel: 'Bois C24 (hypothèse de démonstration)',
    sectionWidthMm: 45,
    sectionDepthMm: 145,
    allowedStudSpacingsMm: [400, 450, 500, 600],
    gridOffsetRatios: [0, 0.5],
    headerLayers: [1, 2],
    minWallLengthMm: 1800,
    maxWallLengthMm: 6000,
    minWallHeightMm: 2200,
    maxWallHeightMm: 3200,
    minOpeningWidthMm: 450,
    maxOpeningWidthMm: 1800,
    minOpeningHeightMm: 450,
    maxOpeningHeightMm: 1600,
    minDoorWidthMm: 650,
    maxDoorWidthMm: 1200,
    minDoorHeightMm: 1800,
    maxDoorHeightMm: 2400,
    minOpeningEdgeMm: 180,
    minOpeningSeparationMm: 180,
    minTopClearanceMm: 270,
    minSillHeightMm: 500,
    maxSillHeightMm: 1200,
    maxMachineMemberLengthMm: 6000,
    manufacturingToleranceMm: 1,
    timberCostEurPerM3: 620,
    cutCostEur: 0.55,
    assemblyCostEurPerMember: 1.15,
    cutTimeMin: 0.22,
    handlingTimeMinPerMember: 0.42,
    stockLengthMm: 6000,
    maxCandidates: 20,
    engineeringDisclaimer: 'Géométrie conceptuelle et DfMA de démonstration. La résistance, les assemblages, les charges, le feu, l’acoustique et la conformité réglementaire ne sont pas certifiés.'
  });

  core.PRIORITY_WEIGHTS = Object.freeze({
    balanced: { material: 0.45, complexity: 0.35, cost: 0.20 },
    material: { material: 0.65, complexity: 0.20, cost: 0.15 },
    manufacturing: { material: 0.25, complexity: 0.60, cost: 0.15 },
    cost: { material: 0.25, complexity: 0.20, cost: 0.55 }
  });

  core.ROLE_COLORS = Object.freeze({
    bottom_plate: '#7c4a2d',
    top_plate: '#7c4a2d',
    boundary_stud: '#a4633b',
    common_stud: '#c8834c',
    king_stud: '#934b2c',
    jack_stud: '#d99a5c',
    sill: '#e0a15d',
    header: '#70402b',
    cripple_stud: '#d1a06f'
  });

  core.EXPERIMENT_PRESETS = Object.freeze([
    {
      id: 'variant-a-standard',
      label: 'Variante A — mur standard',
      input: { wallLengthMm: 3000, wallHeightMm: 2400, windowWidthMm: 900, windowHeightMm: 1000, windowXMm: 1060, sillHeightMm: 900, doorEnabled: false }
    },
    {
      id: 'variant-b-wide',
      label: 'Variante B — mur large',
      input: { wallLengthMm: 4200, wallHeightMm: 2600, windowWidthMm: 1200, windowHeightMm: 1100, windowXMm: 1500, sillHeightMm: 850, doorEnabled: false }
    },
    {
      id: 'variant-c-compact',
      label: 'Variante C — mur compact',
      input: { wallLengthMm: 2400, wallHeightMm: 2400, windowWidthMm: 700, windowHeightMm: 900, windowXMm: 850, sillHeightMm: 950, doorEnabled: false }
    },
    {
      id: 'variant-d-window-door',
      label: 'Variante D — fenêtre + porte',
      input: {
        wallLengthMm: 4200,
        wallHeightMm: 2600,
        windowWidthMm: 900,
        windowHeightMm: 1000,
        windowXMm: 500,
        sillHeightMm: 900,
        doorEnabled: true,
        doorWidthMm: 900,
        doorHeightMm: 2100,
        doorXMm: 2300
      }
    }
  ]);
})(typeof globalThis !== 'undefined' ? globalThis : window);
