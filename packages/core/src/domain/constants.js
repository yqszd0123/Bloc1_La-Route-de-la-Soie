(function initConstants(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  core.VERSION = '2.3.0';

  core.GRID_STRATEGIES = Object.freeze({
    SYMMETRIC_MODULE: Object.freeze({
      label: 'Module symétrique',
      description: 'Conserve le module de référence au centre et répartit le reliquat également aux deux rives.'
    }),
    UNIFORM_BAYS: Object.freeze({
      label: 'Travées uniformes',
      description: 'Répartit la portée utile en travées égales sans dépasser le module de référence.'
    }),
    OPENING_ZONED: Object.freeze({
      label: 'Zones d’ouvertures',
      description: 'Fixe les rives et jambages puis répartit chaque zone entre appuis fixes.'
    })
  });

  core.DEFAULT_INPUT = Object.freeze({
    sourceMode: 'MANUAL',
    frameMaterial: 'STEEL',
    timberSection: 'TIMBER-45-145',
    timberStudSpacingMm: 600,
    timberBudgetPriceEurPerM3ExVat: null,
    timberBudgetLowEurPerM3ExVat: null,
    timberBudgetHighEurPerM3ExVat: null,
    projectId: 'AVELIS-BLOC1-REF',
    typology: 'REFERENCE',
    wallId: 'WALL-001',
    version: '2.3',
    wallLengthMm: 3000,
    wallHeightMm: 2000,
    wallThicknessMm: 300,
    windowEnabled: true,
    windowWidthMm: 1000,
    windowHeightMm: 1000,
    windowXMm: 1000,
    sillHeightMm: 500,
    doorEnabled: false,
    doorWidthMm: 900,
    doorHeightMm: 2000,
    doorXMm: 1000,
    budgetPriceEurPerKgExVat: null,
    budgetLowEurPerKgExVat: null,
    budgetHighEurPerKgExVat: null,
    budgetPriceLabel: '',
    budgetPriceDate: '',
    budgetPriceSource: '',
    priority: 'balanced',
    prototypeScale: 20
  });

  core.PRIORITIES = Object.freeze({
    balanced: { label: 'Équilibre masse / nombre de pièces / longueurs distinctes', metrics: ['materialQuantity', 'componentCount', 'uniqueLengthCount'] },
    material: { label: 'Masse minimale', metrics: ['materialQuantity'] },
    manufacturing: { label: 'Fabrication la plus simple', metrics: ['componentCount', 'uniqueLengthCount', 'cutCount'] }
  });

  core.ROLE_COLORS = Object.freeze({
    bottom_track: '#315f73',
    top_track: '#315f73',
    boundary_stud: '#4d7182',
    common_stud: '#6f8d99',
    opening_jamb: '#d06b35',
    opening_header: '#9e4e2a',
    window_sill: '#c8873f',
    cripple_stud: '#88a1aa'
  });

  core.TIMBER_ROLE_COLORS = Object.freeze({
    bottom_plate: '#875431', top_plate: '#875431', boundary_stud: '#ab7545',
    common_stud: '#c48b50', king_stud: '#986035', jack_stud: '#d39c60',
    header: '#80502e', sill: '#d7a267', cripple_stud: '#bc8c58'
  });
  core.memberColor = (member, material) => ((material === 'TIMBER' ? core.TIMBER_ROLE_COLORS : core.ROLE_COLORS)[member.role] || '#98704a');

  core.EXPERIMENT_PRESETS = Object.freeze([
    {
      id: 'official-ifc-window',
      label: 'IFC officiel — mur + fenêtre',
      provenance: 'BUILDINGSMART_IFC4_WALL_SAMPLE',
      input: {
        wallLengthMm: 3000, wallHeightMm: 2000, wallThicknessMm: 300,
        windowEnabled: true, windowWidthMm: 1000, windowHeightMm: 1000, windowXMm: 1000, sillHeightMm: 500,
        doorEnabled: false
      }
    },
    {
      id: 'ifc-door-reference',
      label: 'Porte IFC de référence',
      provenance: 'BUILDINGSMART_IFC2X_IMPLEMENTATION_GUIDE',
      input: {
        wallLengthMm: 3000, wallHeightMm: 2400, wallThicknessMm: 100,
        windowEnabled: false,
        doorEnabled: true, doorWidthMm: 1000, doorHeightMm: 2000, doorXMm: 1000
      }
    },
    {
      id: 'window-and-door-test',
      label: 'Essai géométrique — fenêtre + porte',
      provenance: 'TEST_GEOMETRY_NOT_ENGINEERING_RULE',
      input: {
        wallLengthMm: 4800, wallHeightMm: 2600, wallThicknessMm: 100,
        windowEnabled: true, windowWidthMm: 1000, windowHeightMm: 1000, windowXMm: 600, sillHeightMm: 800,
        doorEnabled: true, doorWidthMm: 900, doorHeightMm: 2000, doorXMm: 2900
      }
    }
  ]);
})(typeof globalThis !== 'undefined' ? globalThis : window);
