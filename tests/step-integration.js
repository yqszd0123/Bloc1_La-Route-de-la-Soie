'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const occtimportjs = require('../third_party/occt-import-js/dist/occt-import-js.js');
const { loadCore, root } = require('./load-core');

(async () => {
  const core = loadCore();
  const engine = await occtimportjs({
    wasmBinary: fs.readFileSync(path.join(root, 'third_party', 'occt-import-js', 'dist', 'occt-import-js.wasm')),
    locateFile: (name) => path.join(root, 'third_party', 'occt-import-js', 'dist', name)
  });
  const bytes = fs.readFileSync(path.join(root, 'test-data', 'step', 'cube.stp'));
  const parsed = engine.ReadStepFile(new Uint8Array(bytes), { linearUnit: 'millimeter' });
  const model = core.stepAdapter.modelFromOcct(parsed, 'cube.stp');
  assert.equal(model.format, 'ISO 10303-21 STEP');
  assert.equal(model.meshCount, 1);
  assert.equal(model.vertexCount, 24);
  assert.deepEqual(model.dimensionsMm, { X: 300, Y: 300, Z: 300 });
  const result = core.runStepWorkflow(model, { length: 'X', height: 'Z', thickness: 'Y' });
  assert.equal(result.ok, true);
  assert.equal(result.input.sourceMode, 'STEP');
  assert.equal(result.project.source.step.conversionMode, 'BOUNDING_BOX_ENVELOPE');
  assert.equal(result.stepAudit.sourceFingerprint, model.sourceFingerprint);
  assert.throws(() => core.stepAdapter.inputFromModel(model, { length: 'X', height: 'X', thickness: 'Z' }), /sans doublon/);

  for (const frameMaterial of ['STEEL', 'TIMBER']) {
    const imported = core.runStepWorkflow(model, { length: 'X', height: 'Z', thickness: 'Y' }, { frameMaterial });
    assert.equal(imported.ok, true, frameMaterial);
    assert.equal(imported.input.frameMaterial, frameMaterial);
    assert.equal(imported.recommended.wall.openings.length, 0);
    const generated = core.runWorkflow({ ...core.DEFAULT_INPUT, frameMaterial }).recommended;
    const exportedStep = core.stepExport.stepForCandidate(generated, {
      fileName: 'round-trip-profile-envelopes.step',
      timestamp: '2026-11-03T00:00:00Z'
    });
    const parsedExport = engine.ReadStepFile(new TextEncoder().encode(exportedStep), { linearUnit: 'millimeter' });
    const roundTrip = core.stepAdapter.modelFromOcct(parsedExport, 'round-trip-profile-envelopes.step');
    const expectedMin = ['x', 'y', 'z'].map((axis) => Math.min(...generated.members.map((member) => member.bounds.min[axis])));
    const expectedMax = ['x', 'y', 'z'].map((axis) => Math.max(...generated.members.map((member) => member.bounds.max[axis])));
    assert.deepEqual(roundTrip.dimensionsMm, {
      X: expectedMax[0] - expectedMin[0],
      Y: expectedMax[1] - expectedMin[1],
      Z: expectedMax[2] - expectedMin[2]
    });
    assert.equal((exportedStep.match(/MANIFOLD_SOLID_BREP\(/g) || []).length, generated.members.length);
  }
  process.stdout.write('PASS  vrai fichier STEP lu et exports acier + bois relus par Open CASCADE\n');
})().catch((error) => {
  process.stderr.write(`FAIL  intégration STEP\n${error.stack}\n`);
  process.exit(1);
});
