'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadCore, root } = require('./load-core');

const core = loadCore();
const officialIfcPath = path.join(root, 'test-data', 'ifc', 'wall-with-opening-and-window.ifc');
const officialIfc = fs.readFileSync(officialIfcPath, 'utf8');
const multiWallIfcPath = path.join(root, 'test-data', 'ifc', 'partie1-four-walls.ifc');
const multiWallIfc = fs.readFileSync(multiWallIfcPath, 'utf8');
let passed = 0;

function test(label, fn) {
  try {
    fn();
    passed += 1;
    process.stdout.write(`PASS  ${label}\n`);
  } catch (error) {
    process.stderr.write(`FAIL  ${label}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

test('le catalogue navigateur est synchronisé avec la source JSON autoritative', () => {
  const source = JSON.parse(fs.readFileSync(path.join(root, 'data', 'engineering_sources.json'), 'utf8'));
  assert.deepEqual(core.ENGINEERING_DATA, source);
  assert.equal(source.scope.certificationStatus, 'ENGINEERING_REVIEW_REQUIRED');
});

test('le contrat Bloc 1 vers Bloc 2 embarqué reste synchronisé avec le Markdown autoritatif', () => {
  const source = fs.readFileSync(path.join(root, 'docs', 'Bloc1_Bloc2_Interface_Schema.md'), 'utf8');
  assert.equal(core.BLOC1_BLOC2_INTERFACE_MD, source);
  assert.match(source, /model_3d_profile_envelopes\.step/);
});

test('le modèle de domaine est exclusivement acier', () => {
  assert.match(core.ENGINEERING_DATA.catalog.material.id, /^REF-METSEC-Z275/);
  assert.ok(core.ENGINEERING_DATA.catalog.profiles.every((profile) => ['STUD_C', 'TRACK_U'].includes(profile.family)));
  assert.ok(core.ENGINEERING_DATA.catalog.profiles.every((profile) => profile.coating === 'Z275'));
});

test('les profils Metsec conservent les valeurs publiées par le fabricant', () => {
  const profile = core.engineering.getProfile('100MF12-50');
  assert.equal(profile.manufacturerReference, '100MF12/50');
  assert.equal(profile.massKgPerM, 2.11);
  assert.equal(profile.webDepthMm, 100);
  assert.equal(profile.flange1Mm, 50);
  assert.equal(profile.nominalThicknessMm, 1.2);
  assert.equal(profile.sourceId, 'METSEC_COMPONENTS_2026');
});

test('la masse linéique fabricant est recoupée par une méthode indépendante', () => {
  core.ENGINEERING_DATA.catalog.profiles.forEach((profile) => {
    const check = core.engineering.densityCrossCheck(profile);
    assert.ok(check.relativeDifferencePercent < 5, `${profile.id}: ${check.relativeDifferencePercent}%`);
  });
});

test('le flux par défaut génère uniquement des composants acier traçables', () => {
  const result = core.runWorkflow(core.DEFAULT_INPUT);
  assert.equal(result.ok, true);
  assert.equal(result.search.searchSpaceSize, 9);
  assert.equal(result.search.evaluatedCandidateCount, 9);
  assert.equal(result.search.uniqueCandidateCount, 9);
  assert.equal(result.rankedCandidates.length, 9);
  assert.deepEqual(new Set(result.rankedCandidates.map((candidate) => candidate.option.gridStrategy)), new Set([
    'SYMMETRIC_MODULE', 'UNIFORM_BAYS', 'OPENING_ZONED'
  ]));
  assert.equal(result.recommended.rank, 1);
  assert.equal(result.recommended.validation.engineeringStatus, 'ENGINEERING_REVIEW_REQUIRED');
  result.recommended.members.forEach((member) => {
    assert.equal(member.profile.sourceId, 'METSEC_COMPONENTS_2026');
    assert.ok(member.massKg > 0);
    assert.equal(member.toleranceMm, null);
  });
});

test('les trois implantations remplacent les deux anciennes stratégies', () => {
  const rules = core.engineering.createRules();
  assert.deepEqual(rules.gridStrategies, ['SYMMETRIC_MODULE', 'UNIFORM_BAYS', 'OPENING_ZONED']);
  assert.equal(rules.gridStrategies.includes('WALL_ORIGIN'), false);
  assert.equal(rules.gridStrategies.includes('OPENING_ALIGNED'), false);

  const symmetric = core.steelPanelGenerator.buildGridPlan(3000, 600, 'SYMMETRIC_MODULE', [], 50);
  assert.deepEqual(symmetric.boundaryCentersMm, [25, 2975]);
  assert.deepEqual(symmetric.centersMm, [600, 1200, 1800, 2400]);

  const uniform = core.steelPanelGenerator.buildGridPlan(3000, 600, 'UNIFORM_BAYS', [], 50);
  assert.deepEqual(uniform.centersMm, [615, 1205, 1795, 2385]);

  const zoned = core.steelPanelGenerator.buildGridPlan(3000, 600, 'OPENING_ZONED', [{ xMm: 1000, widthMm: 1000 }], 50);
  assert.deepEqual(zoned.centersMm, [500, 1500, 2500]);
  assert.equal(zoned.zones.length, 3);
});

test('les géométries identiques sont retirées sans gonfler la comparaison', () => {
  const result = core.runWorkflow({ ...core.DEFAULT_INPUT, windowEnabled: false, doorEnabled: false });
  assert.equal(result.search.searchSpaceSize, 9);
  assert.equal(result.search.evaluatedCandidateCount, 9);
  assert.equal(result.search.uniqueCandidateCount, 6);
  assert.equal(result.search.duplicateCandidates.length, 3);
  assert.equal(result.rankedCandidates.length, 6);
  assert.equal(new Set(result.rankedCandidates.map((candidate) => core.candidateSearch.geometrySignature(candidate))).size, 6);
});

test('la porte est traitée par le même modèle générique d’ouverture', () => {
  const preset = core.EXPERIMENT_PRESETS.find((entry) => entry.id === 'ifc-door-reference');
  const result = core.runWorkflow({ ...core.DEFAULT_INPUT, ...preset.input });
  assert.equal(result.ok, true);
  const door = result.input.openings.find((opening) => opening.type === 'DOOR');
  assert.ok(door);
  const frame = result.recommended.members.filter((member) => member.openingId === door.id);
  assert.equal(frame.filter((member) => member.role === 'opening_jamb').length, 2);
  assert.equal(frame.filter((member) => member.role === 'opening_header').length, 1);
  assert.equal(frame.some((member) => member.role === 'window_sill'), false);
  assert.equal(result.recommended.members.some((member) => member.role === 'bottom_track' && core.candidateRules.overlapsClearOpening(member, door)), false);
});

test('deux ouvertures qui se chevauchent sont bloquées avant génération', () => {
  const result = core.runWorkflow({ ...core.DEFAULT_INPUT, doorEnabled: true, doorXMm: 1200, doorWidthMm: 900, doorHeightMm: 1900 });
  assert.equal(result.ok, false);
  assert.ok(result.inputValidation.issues.some((entry) => entry.code === 'OPENINGS_OVERLAP'));
  assert.equal(result.search.searchSpaceSize, 0);
});

test('une ouverture hors enveloppe est refusée', () => {
  const result = core.runWorkflow({ ...core.DEFAULT_INPUT, windowXMm: 2500, windowWidthMm: 1000 });
  assert.equal(result.ok, false);
  assert.ok(result.inputValidation.issues.some((entry) => entry.code === 'OPENING_OUTSIDE_WALL'));
});

test('une ouverture atteignant le haut du panneau est refusée explicitement', () => {
  const result = core.runWorkflow({ ...core.DEFAULT_INPUT, windowEnabled: false, doorEnabled: true, doorHeightMm: 2000 });
  assert.equal(result.ok, false);
  assert.ok(result.inputValidation.issues.some((entry) => entry.code === 'OPENING_HEAD_ZONE_REQUIRED'));
});

test('les identifiants restent stables et les composants évitent les vides', () => {
  const first = core.runWorkflow(core.DEFAULT_INPUT).recommended;
  const second = core.runWorkflow(core.DEFAULT_INPUT).recommended;
  assert.deepEqual(first.members.map((member) => member.id), second.members.map((member) => member.id));
  assert.equal(new Set(first.members.map((member) => member.id)).size, first.members.length);
  first.members.forEach((member) => first.wall.openings.forEach((opening) => {
    assert.equal(core.candidateRules.overlapsClearOpening(member, opening), false, `${member.id}/${opening.id}`);
  }));
});

test('chaque masse de composant provient de longueur × kg/m fabricant', () => {
  const candidate = core.runWorkflow(core.DEFAULT_INPUT).recommended;
  candidate.members.forEach((member) => {
    const expected = core.math.round(member.lengthMm / 1000 * member.profile.massKgPerM, 4);
    assert.equal(member.massKg, expected, member.id);
  });
});

test('la BOM et la somme géométrique de masse se recoupent', () => {
  const candidate = core.runWorkflow(core.DEFAULT_INPUT).recommended;
  assert.equal(candidate.crossValidation.massReconciliation.status, 'MATCH');
  assert.equal(candidate.bom.reduce((sum, row) => sum + row.quantity, 0), candidate.members.length);
  assert.ok(Math.abs(candidate.bom.reduce((sum, row) => sum + row.totalMassKg, 0) - candidate.metrics.steelMassKg) < 0.02);
});

test('le budget par défaut reproduit la moyenne régionale documentée', () => {
  const candidate = core.runWorkflow(core.DEFAULT_INPUT).recommended;
  assert.equal(candidate.metrics.priceBasis.valueEurPerKgExVat, 3.09);
  assert.equal(candidate.metrics.materialCostEstimateEurExVat, core.math.round(candidate.metrics.steelMassKg * 3.09, 2));
  assert.ok(candidate.metrics.materialCostRangeEurExVat.low < candidate.metrics.materialCostEstimateEurExVat);
  assert.ok(candidate.metrics.materialCostRangeEurExVat.high > candidate.metrics.materialCostEstimateEurExVat);
});

test('un scénario budgétaire utilisateur recalcule sans modifier la géométrie', () => {
  const baseline = core.runWorkflow(core.DEFAULT_INPUT);
  const custom = core.runWorkflow({
    ...core.DEFAULT_INPUT,
    budgetPriceEurPerKgExVat: 4.5,
    budgetLowEurPerKgExVat: 4,
    budgetHighEurPerKgExVat: 5,
    budgetPriceLabel: 'Scénario équipe',
    budgetPriceDate: '2026-11-03',
    budgetPriceSource: 'Saisie de test'
  });
  assert.deepEqual(custom.recommended.members.map((member) => member.id), baseline.recommended.members.map((member) => member.id));
  assert.equal(custom.recommended.metrics.priceBasis.status, 'USER_COST_SCENARIO');
  assert.equal(custom.recommended.metrics.materialCostEstimateEurExVat, core.math.round(custom.recommended.metrics.steelMassKg * 4.5, 2));
});

test('le classement couvre les géométries distinctes de l’espace déclaré', () => {
  const result = core.runWorkflow(core.DEFAULT_INPUT);
  assert.equal(result.search.evaluatedCandidateCount, result.search.searchSpace.length);
  assert.equal(result.search.candidates.length, result.search.uniqueCandidateCount);
  result.rankedCandidates.forEach((candidate, index) => {
    assert.equal(candidate.rank, index + 1);
    if (index) assert.ok(candidate.score >= result.rankedCandidates[index - 1].score);
  });
  assert.equal(result.recommended.score, Math.min(...result.rankedCandidates.map((candidate) => candidate.score)));
  assert.ok(result.rankedCandidates.some((candidate) => candidate.paretoOptimal));
});

test('le vrai fichier IFC4 buildingSMART est lu avec son unité millimètre', () => {
  const model = core.ifcImporter.parseIfc(officialIfc);
  assert.equal(model.schema, 'IFC4');
  assert.equal(model.unit.factorToMm, 1);
  assert.ok(model.entityCount > 100);
  assert.equal(model.buildings.length, 1);
  assert.equal(model.storeys.length, 1);
  assert.equal(model.walls.length, 1);
});

test('les dimensions IFC et la relation mur-ouverture-fenêtre sont exactes', () => {
  const wall = core.ifcImporter.parseIfc(officialIfc).walls[0];
  assert.deepEqual([wall.lengthMm, wall.heightMm, wall.thicknessMm], [3000, 2000, 300]);
  assert.equal(wall.storeyId, 38);
  assert.equal(wall.openings.length, 1);
  assert.deepEqual(
    [wall.openings[0].type, wall.openings[0].xMm, wall.openings[0].sillMm, wall.openings[0].widthMm, wall.openings[0].heightMm],
    ['WINDOW', 1000, 500, 1000, 1000]
  );
  assert.equal(wall.openings[0].sourceRef.fillerType, 'IFCWINDOW');
});

test('le flux IFC et le flux manuel réutilisent le même générateur', () => {
  const ifcResult = core.runIfcWorkflow(officialIfc);
  const manualResult = core.runWorkflow(core.DEFAULT_INPUT);
  assert.equal(ifcResult.ok, true);
  assert.equal(ifcResult.input.sourceMode, 'IFC');
  assert.equal(ifcResult.recommended.metrics.steelMassKg, manualResult.recommended.metrics.steelMassKg);
  assert.equal(ifcResult.recommended.members.length, manualResult.recommended.members.length);
});

test('les placements, profils centrés et axes X/Y IFC sont normalisés', () => {
  const transformed = officialIfc
    .replace('#47 = IFCAXIS2PLACEMENT3D(#24, $, $);', '#47 = IFCAXIS2PLACEMENT3D(#134, #27, #135);')
    .replace('ENDSEC;\nEND-ISO-10303-21;', '#134 = IFCCARTESIANPOINT((100., 200., 0.));\n#135 = IFCDIRECTION((0., 1., 0.));\nENDSEC;\nEND-ISO-10303-21;');
  const wall = core.ifcImporter.parseIfc(transformed).walls[0];
  assert.deepEqual([wall.placement.xMm, wall.placement.yMm, wall.placement.zMm], [100, 200, 0]);
  assert.equal(wall.placement.rotationDeg, 90);

  const model = core.ifcImporter.parseIfc(multiWallIfc);
  assert.equal(model.schema, 'IFC4');
  assert.equal(model.unit.name, 'METRE');
  assert.equal(model.walls.length, 4);
  assert.equal(model.warnings.length, 0);

  const walls = Object.fromEntries(model.walls.map((wall) => [wall.name, wall]));
  assert.deepEqual(
    [walls['Mur Sud'].lengthMm, walls['Mur Sud'].heightMm, walls['Mur Sud'].thicknessMm],
    [10000, 2500, 300]
  );
  assert.deepEqual(
    [walls['Mur Ouest'].lengthMm, walls['Mur Ouest'].heightMm, walls['Mur Ouest'].thicknessMm],
    [1900, 2500, 300]
  );
  assert.deepEqual(
    [walls['Mur Est'].lengthMm, walls['Mur Est'].heightMm, walls['Mur Est'].thicknessMm],
    [1900, 2500, 300]
  );
  assert.equal(walls['Mur Ouest'].normalization.sourceLengthAxis, 'Y');
  assert.equal(walls['Mur Ouest'].placement.rotationDeg, 90);
  assert.deepEqual(
    walls['Mur Sud'].openings.map((opening) => [opening.type, opening.xMm, opening.sillMm, opening.widthMm, opening.heightMm]),
    [['WINDOW', 1750, 500, 1500, 1500], ['DOOR', 7100, 0, 800, 1750]]
  );

  model.walls.forEach((wall) => {
    const result = core.runIfcWorkflow(multiWallIfc, { wallEntityId: wall.entityId });
    assert.equal(result.ok, true, wall.name);
    assert.equal(result.search.searchSpaceSize, 9, wall.name);
    assert.equal(result.search.evaluatedCandidateCount, 9, wall.name);
    assert.equal(result.search.validCandidates.length, wall.openings.length ? 9 : 6, wall.name);
  });
});

test('un faux fichier renommé .ifc est rejeté', () => {
  assert.throws(() => core.ifcImporter.parseIfc('this is not IFC'), /ISO 10303-21/);
});

test('l’adaptateur STEP exige une géométrie réelle et trois axes distincts', () => {
  const parsed = {
    success: true,
    meshes: [{ attributes: { position: { array: [0, 0, 0, 3000, 0, 0, 0, 100, 2400, 3000, 100, 2400] } } }]
  };
  const model = core.stepAdapter.modelFromOcct(parsed, 'panel.step');
  assert.deepEqual(model.dimensionsMm, { X: 3000, Y: 100, Z: 2400 });
  const input = core.stepAdapter.inputFromModel(model, { length: 'X', height: 'Z', thickness: 'Y' });
  assert.deepEqual([input.wallLengthMm, input.wallHeightMm, input.wallThicknessMm], [3000, 2400, 100]);
  assert.equal(input.openings.length, 0);
  assert.equal(input.stepContext.conversionMode, 'BOUNDING_BOX_ENVELOPE');
  assert.throws(() => core.stepAdapter.inputFromModel(model, { length: 'X', height: 'X', thickness: 'Y' }), /sans doublon/);
});

test('les exports neutres et FabLab proviennent du même modèle', () => {
  const result = core.runWorkflow(core.DEFAULT_INPUT);
  const candidate = result.recommended;
  assert.ok(core.stl.stlForCandidate(candidate, 20).startsWith('solid'));
  assert.ok(core.stl.stlForMember(candidate.members[0], 20).startsWith('solid'));
  assert.match(core.dxf.dxfForCandidate(candidate), /3DFACE/);
  const step = core.stepExport.stepForCandidate(candidate, { timestamp: '2026-11-03T00:00:00Z' });
  assert.match(step, /^ISO-10303-21;/);
  assert.match(step, /FILE_SCHEMA\(\('CONFIG_CONTROL_DESIGN'\)\)/);
  assert.equal((step.match(/MANIFOLD_SOLID_BREP\(/g) || []).length, candidate.members.length);
  assert.match(core.svg.svgForCandidate(candidate), /<svg/);
  assert.match(core.serialize.bomCsv(candidate), /total_mass_kg/);
  assert.match(core.serialize.cuttingListCsv(candidate), /manufacturing_release/);
});

test('le paquet complet contient les interfaces et bloque explicitement la machine', () => {
  const result = core.runWorkflow(core.DEFAULT_INPUT);
  const files = core.packageBuilder.buildExportFiles(result, result.recommended, 20);
  [
    '01_input/noov_request_proposal.json',
    '02_design/model_3d_profile_envelopes.step',
    '02_design/model_3d_profile_envelopes.dxf',
    '03_manufacturing/bom.csv',
    '03_manufacturing/cutting_list.csv',
    '04_quality/validation_report.json',
    '05_interfaces/logistics_handover.json',
    '05_interfaces/Bloc1_Bloc2_Interface_Schema.md'
  ].forEach((name) => assert.ok(Object.hasOwn(files, name), name));
  assert.match(files['02_design/model_3d_profile_envelopes.step'], /^ISO-10303-21;/);
  assert.equal(files['05_interfaces/Bloc1_Bloc2_Interface_Schema.md'], core.BLOC1_BLOC2_INTERFACE_MD);
  const handover = JSON.parse(files['03_manufacturing/manufacturing_handover.json']);
  assert.equal(handover.releaseStatus, 'BLOCKED_PENDING_AVELIS_CAPABILITY_CONFIRMATION');
  assert.equal(handover.toleranceMm, null);
  assert.equal(Object.keys(files).filter((name) => name.includes('/parts/')).length, result.recommended.members.length);
  const zip = core.packageBuilder.buildExportZip(result, result.recommended, 20);
  assert.deepEqual(Array.from(zip.slice(0, 2)), [0x50, 0x4b]);
  assert.ok(zip.length > 1000);
});

process.stdout.write(`\n${passed} test(s) passed.\n`);
if (process.exitCode) process.exit(process.exitCode);
