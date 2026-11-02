'use strict';

const assert = require('node:assert/strict');
const { loadCore } = require('./load-core');

const core = loadCore();
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

test('la configuration par défaut affiche une fenêtre et une porte valides', () => {
  const result = core.runWorkflow(core.DEFAULT_INPUT);
  assert.equal(result.ok, true);
  assert.equal(result.search.searchSpaceSize, 16);
  assert.ok(result.rankedCandidates.length >= 3);
  assert.equal(result.recommended.rank, 1);
  assert.equal(result.recommended.wall.openings.length, 2);
  const door = result.recommended.wall.openings.find((opening) => opening.type === 'DOOR');
  assert.ok(door);
  const frame = result.recommended.members.filter((member) => member.openingId === door.id);
  assert.equal(frame.filter((member) => member.role === 'king_stud').length, 2);
  assert.equal(frame.filter((member) => member.role === 'jack_stud').length, 2);
  assert.ok(frame.some((member) => member.role === 'header'));
});

test('les quatre cas d’expérience traversent le flux complet', () => {
  core.EXPERIMENT_PRESETS.forEach((preset) => {
    const result = core.runWorkflow({ ...core.DEFAULT_INPUT, ...preset.input, wallId: preset.id.toUpperCase() });
    assert.equal(result.ok, true, preset.id);
    assert.ok(result.recommended.members.length > 0, preset.id);
    assert.ok(result.processingTimeMs < 5000, preset.id);
  });
});

test('chaque composant possède un identifiant unique et reste hors de toutes les ouvertures', () => {
  const result = core.runWorkflow(core.DEFAULT_INPUT);
  result.rankedCandidates.forEach((candidate) => {
    const ids = candidate.members.map((member) => member.id);
    assert.equal(new Set(ids).size, ids.length);
    candidate.members.forEach((member) => {
      candidate.wall.openings.forEach((opening) => {
        assert.equal(core.candidateRules.overlapsClearOpening(member, opening, 0.01), false, `${member.id}/${opening.id}`);
      });
    });
  });
});

test('la variante fenêtre + porte traverse le même flux sans logique parallèle', () => {
  const preset = core.EXPERIMENT_PRESETS.find((entry) => entry.id === 'variant-d-window-door');
  const result = core.runWorkflow({ ...core.DEFAULT_INPUT, ...preset.input });
  assert.equal(result.ok, true);
  assert.equal(result.recommended.wall.openings.length, 2);
  const door = result.recommended.wall.openings.find((opening) => opening.type === 'DOOR');
  assert.ok(door);
  const doorFrame = result.recommended.members.filter((member) => member.openingId === door.id);
  assert.equal(doorFrame.filter((member) => member.role === 'king_stud').length, 2);
  assert.equal(doorFrame.filter((member) => member.role === 'jack_stud').length, 2);
  assert.ok(doorFrame.some((member) => member.role === 'header'));
  assert.equal(doorFrame.some((member) => member.role === 'sill'), false);
});

test('une porte qui chevauche la fenêtre est refusée avant génération', () => {
  const result = core.runWorkflow({ ...core.DEFAULT_INPUT, doorEnabled: true, doorXMm: 1200, doorWidthMm: 800 });
  assert.equal(result.ok, false);
  assert.ok(result.inputValidation.issues.some((entry) => entry.code === 'OPENING_SEPARATION'));
});

test('une baie impossible est refusée avant la génération', () => {
  const result = core.runWorkflow({ ...core.DEFAULT_INPUT, windowXMm: 50 });
  assert.equal(result.ok, false);
  assert.equal(result.search.searchSpaceSize, 0);
  assert.ok(result.inputValidation.issues.some((entry) => entry.code === 'OPENING_EDGE_CLEARANCE'));
});

test('le classement est stable, croissant et contient une solution Pareto', () => {
  const result = core.runWorkflow(core.DEFAULT_INPUT);
  result.rankedCandidates.forEach((candidate, index) => {
    assert.equal(candidate.rank, index + 1);
    if (index > 0) assert.ok(candidate.score >= result.rankedCandidates[index - 1].score);
  });
  assert.ok(result.rankedCandidates.some((candidate) => candidate.paretoOptimal));
});

test('les métriques et la BOM sont cohérentes avec le modèle sémantique', () => {
  const candidate = core.runWorkflow(core.DEFAULT_INPUT).recommended;
  assert.equal(candidate.metrics.componentCount, candidate.members.length);
  assert.equal(candidate.bom.reduce((sum, row) => sum + row.quantity, 0), candidate.members.length);
  assert.ok(candidate.metrics.timberVolumeM3 > 0);
  assert.ok(candidate.metrics.estimatedCostEur > 0);
});

test('les exports STL, DXF, SVG et CSV sont formés', () => {
  const result = core.runWorkflow(core.DEFAULT_INPUT);
  const candidate = result.recommended;
  assert.ok(core.stl.stlForCandidate(candidate, 15).startsWith('solid'));
  assert.match(core.dxf.dxfForCandidate(candidate), /SECTION/);
  assert.match(core.svg.svgForCandidate(candidate), /<svg/);
  assert.match(core.serialize.bomCsv(candidate), /component_ids/);
});

test('le paquet de remise contient toutes les interfaces et un ZIP valide', () => {
  const result = core.runWorkflow(core.DEFAULT_INPUT);
  const files = core.packageBuilder.buildExportFiles(result, result.recommended, 15);
  const required = [
    '01_entree/noov_request_proposal.json',
    '02_conception/model_3d_neutral.dxf',
    '03_fabrication/bom.csv',
    '04_qualite/validation_report.json',
    '05_interfaces/logistics_handover.json'
  ];
  required.forEach((name) => assert.ok(Object.hasOwn(files, name), name));
  const zip = core.packageBuilder.buildExportZip(result, result.recommended, 15);
  assert.equal(zip[0], 0x50);
  assert.equal(zip[1], 0x4b);
  assert.ok(zip.length > 1000);
});

process.stdout.write(`\n${passed} test(s) réussi(s).\n`);
if (process.exitCode) process.exit(process.exitCode);
