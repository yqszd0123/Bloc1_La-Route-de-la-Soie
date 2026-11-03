(function initConstants(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};

  core.VERSION = '2.1.0';

  core.DEFAULT_INPUT = Object.freeze({
    sourceMode: 'MANUAL',
    projectId: 'AVELIS-BLOC1-REF',
    typology: 'REFERENCE',
    wallId: 'WALL-001',
    version: '2.1',
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
    balanced: { label: 'Équilibre masse / nombre de pièces / longueurs distinctes', metrics: ['steelMassKg', 'componentCount', 'uniqueLengthCount'] },
    material: { label: 'Masse minimale', metrics: ['steelMassKg'] },
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
