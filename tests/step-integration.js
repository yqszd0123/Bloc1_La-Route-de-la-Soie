'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const occtimportjs = require('../third_party/occt-import-js/dist/occt-import-js.js');
const { loadCore, root } = require('./load-core');

(async () => {
  const core = loadCore();
  const engine = await occtimportjs({
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
  process.stdout.write('PASS  vrai fichier STEP lu par Open CASCADE et transmis au moteur acier\n');
})().catch((error) => {
  process.stderr.write(`FAIL  intégration STEP\n${error.stack}\n`);
  process.exit(1);
});
