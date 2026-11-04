'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadCore, root } = require('./load-core');
const core = loadCore();
const base = { ...core.DEFAULT_INPUT, frameMaterial: 'TIMBER' };
let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log('PASS  ' + name); }
  catch (error) { console.error('FAIL  ' + name, error.stack); process.exitCode = 1; }
}

test('timber catalog identifies sources and a demonstration-only price', () => {
  const r = core.runWorkflow(base);
  assert.equal(r.rules.material.densityKgM3, 420);
  assert.equal(r.rules.budgetPrice.status, 'DEMONSTRATION_BUDGET_ASSUMPTION');
  assert.equal(r.rules.budgetPrice.unit, 'm3');
  assert.equal(core.engineering.getProfile('TIMBER-45-145').massKgPerM, 2.7405);
});

test('every timber section, grid spacing and door/window preset produces valid solid geometry', () => {
  for (const section of ['TIMBER-45-95', 'TIMBER-45-120', 'TIMBER-45-145']) {
    for (const spacing of [400, 450, 500, 600]) {
      for (const preset of core.EXPERIMENT_PRESETS) {
        const r = core.runWorkflow({ ...base, ...preset.input, timberSection: section, timberStudSpacingMm: spacing });
        assert.ok(r.ok, section + '/' + spacing + '/' + preset.id);
        r.rankedCandidates.forEach((c) => {
          assert.equal(c.frameMaterial, 'TIMBER');
          assert.equal(c.validation.geometryValid, true);
          assert.equal(c.validation.manufacturingRelease, false);
          assert.ok(c.members.every((m) => m.representation.kind === 'SOLID_RECTANGULAR_TIMBER'));
          assert.equal(c.members.filter((m) => m.role === 'top_plate').length, 2);
          c.wall.openings.forEach((o) => {
            assert.equal(c.members.filter((m) => m.openingId === o.id && m.role === 'king_stud').length, 2);
            assert.equal(c.members.filter((m) => m.openingId === o.id && m.role === 'jack_stud').length, 2);
            c.members.forEach((m) => assert.equal(core.candidateRules.overlapsClearOpening(m, o), false));
          });
        });
      }
    }
  }
});

test('multiple doors interrupt every bottom plate and never receive a sill', () => {
  const r = core.runWorkflow({ ...base, wallLengthMm: 6000, wallHeightMm: 2600, openings: [
    { id: 'D1', type: 'DOOR', xMm: 400, sillMm: 0, widthMm: 900, heightMm: 2000 },
    { id: 'D2', type: 'DOOR', xMm: 3500, sillMm: 0, widthMm: 900, heightMm: 2000 }
  ] });
  assert.ok(r.ok);
  const c = r.recommended;
  assert.equal(c.members.filter((m) => m.role === 'bottom_plate').length, 3);
  assert.equal(c.members.some((m) => m.role === 'sill'), false);
  assert.equal(c.members.filter((m) => m.role === 'bottom_plate').reduce((sum, m) => sum + m.lengthMm, 0), 4200);
});

test('timber frame clearances, unsupported settings and overlapping frames block exports', () => {
  for (const override of [
    { timberSection: 'INVALID' }, { timberStudSpacingMm: 0 }, { timberStudSpacingMm: 700 },
    { windowXMm: 50 }, { sillHeightMm: 20 }, { windowHeightMm: 1400 },
    { doorEnabled: true, doorXMm: 2100, doorHeightMm: 1600 }
  ]) {
    const r = core.runWorkflow({ ...base, ...override });
    assert.equal(r.ok, false, JSON.stringify(override));
    assert.throws(() => core.packageBuilder.buildExportFiles(r));
  }
});

test('quantity and budget reconcile with solid dimensions and contain no steel mass metric', () => {
  const r = core.runWorkflow({ ...base, timberBudgetPriceEurPerM3ExVat: 800 });
  const c = r.recommended;
  const volume = c.members.reduce((sum, m) => sum + m.lengthMm * m.profile.sectionWidthMm * m.profile.sectionDepthMm / 1e9, 0);
  assert.ok(Math.abs(c.metrics.timberVolumeM3 - volume) < 1e-7);
  assert.ok(Math.abs(c.metrics.materialMassKg - volume * 420) < .01);
  assert.ok(Math.abs(c.bom.reduce((sum, row) => sum + row.totalVolumeM3, 0) - volume) < 1e-7);
  assert.equal(c.metrics.materialCostEstimateEurExVat, core.math.round(volume * 800, 2));
  assert.equal(c.metrics.steelMassKg, undefined);
  assert.equal(c.metrics.priceBasis.valueEurPerKgExVat, undefined);
});

test('steel and timber prices are isolated and a budget change does not change geometry', () => {
  const a = core.runWorkflow(base).recommended;
  const b = core.runWorkflow({ ...base, budgetPriceEurPerKgExVat: 999, timberBudgetPriceEurPerM3ExVat: 1000 }).recommended;
  assert.deepEqual(a.members.map((m) => m.id), b.members.map((m) => m.id));
  const steel = core.runWorkflow({ ...core.DEFAULT_INPUT, timberBudgetPriceEurPerM3ExVat: 9999 });
  assert.equal(steel.rules.budgetPrice.valueEurPerKgExVat, 3.09);
});

test('timber has up to nine distinct alternatives with stable ranks and IDs', () => {
  const r = core.runWorkflow({ ...base, timberSection: 'ALL' });
  assert.equal(r.search.searchSpaceSize, 9);
  assert.equal(r.rankedCandidates.length, 9);
  const other = core.runWorkflow({ ...base, timberSection: 'ALL', priority: 'manufacturing' });
  r.rankedCandidates.forEach((c, i) => {
    assert.equal(c.rank, i + 1);
    assert.equal(new Set(c.members.map((m) => m.id)).size, c.members.length);
    assert.deepEqual(c.members.map((m) => m.id), other.rankedCandidates.find((entry) => entry.id === c.id).members.map((m) => m.id));
  });
  assert.ok(r.rankedCandidates.some((c) => c.paretoOptimal));
});

test('real IFC imports preserve provenance while using the chosen timber system', () => {
  const text = fs.readFileSync(path.join(root, 'test-data/ifc/wall-with-opening-and-window.ifc'), 'utf8');
  const r = core.runIfcWorkflow(text, { inputOverrides: { frameMaterial: 'TIMBER', timberSection: 'TIMBER-45-120' } });
  assert.ok(r.ok);
  assert.equal(r.input.sourceMode, 'IFC');
  assert.equal(r.recommended.wall.openings.length, 1);
  assert.equal(r.recommended.wall.displayDepthMm, 120);
  assert.ok(r.ifcAudit.sourceFingerprint);
});

test('timber manufacturing exports have wood dimensions and no sheet-metal operations', () => {
  const r = core.runWorkflow(base), c = r.recommended;
  const h = core.serialize.manufacturingHandover(r, c);
  assert.equal(h.frameMaterial, 'TIMBER');
  assert.equal(h.assemblyPriority.sourceId, 'TIMBER_POC_ASSEMBLY');
  assert.ok(h.assemblySequence.every((step) => step.operation === 'CUT_AND_PREPARE_TIMBER_ASSEMBLY'));
  assert.ok(h.components.every((part) => part.dimensionsMm.sectionWidth === 45 && part.timberVolumeM3 > 0 && !('nominalThickness' in part.dimensionsMm)));
  const csv = core.serialize.cuttingListCsv(c);
  assert.match(csv, /timber_volume_m3/);
  assert.doesNotMatch(csv, /nominal_thickness|developed_area/);
  assert.deepEqual(h.components.map((part) => part.assemblyOrder), Array.from({ length: c.members.length }, (_, i) => i + 1));
  assert.equal(h.releaseStatus, 'BLOCKED_PENDING_AVELIS_CAPABILITY_CONFIRMATION');
  assert.equal(core.serialize.noovRequest(r).requestedOutputs[0], 'TIMBER_FRAME_MODEL');
  assert.equal(core.serialize.logisticsHandover(r, c).calculatedSteelMassKg, undefined);
});

test('timber layered model follows frame depth and leaves the manufacturing model unchanged', () => {
  const c = core.runWorkflow(base).recommended, before = JSON.stringify(c);
  const model = core.prototypeLayers.build(c, 'COMPLETE');
  assert.equal(model.layers.find((layer) => layer.id === 'INSULATION').thicknessMm, 145);
  assert.equal(model.layers[0].label, 'Ossature bois générée');
  assert.equal(JSON.stringify(c), before);
  assert.match(core.prototypeLayers.partsCsv(model), /net_area_m2/);
});

test('wood export package is complete and includes source and material context', () => {
  const r = core.runWorkflow(base);
  const files = core.packageBuilder.buildExportFiles(r);
  assert.match(files['00_READ_ME.txt'], /TIMBER/);
  assert.match(files['02_design/model_3d_profile_envelopes.step'], /ISO-10303-21/);
  assert.match(files['03_manufacturing/bom.csv'], /timber_volume_m3/);
  assert.match(files['05_interfaces/Bloc1_Bloc2_Interface_Schema.md'], /TIMBER/);
  assert.ok(Object.values(files).every((file) => !/\bNaN\b|\bundefined\b/.test(file)));
  assert.deepEqual(Array.from(core.packageBuilder.buildExportZip(r).slice(0, 2)), [0x50, 0x4b]);
});
console.log(passed + ' timber tests passed.');
if (process.exitCode) process.exit(process.exitCode);
