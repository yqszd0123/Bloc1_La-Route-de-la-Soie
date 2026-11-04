'use strict';

const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceFiles = [
  'packages/core/src/data/engineering-catalog.js',
  'packages/core/src/data/bloc1-bloc2-interface.js',
  'packages/core/src/domain/constants.js',
  'packages/core/src/utils/math.js',
  'packages/core/src/domain/engineering.js',
  'packages/core/src/domain/project.js',
  'packages/core/src/rules/input-rules.js',
  'packages/core/src/generation/member-factory.js',
  'packages/core/src/generation/frame-layout.js',
  'packages/core/src/generation/steel-panel-generator.js',
  'packages/core/src/generation/timber-panel-generator.js',
  'packages/core/src/manufacturing/assembly-priority.js',
  'packages/core/src/rules/candidate-rules.js',
  'packages/core/src/optimization/metrics.js',
  'packages/core/src/optimization/candidate-search.js',
  'packages/core/src/optimization/ranker.js',
  'packages/core/src/ifc/step-parser.js',
  'packages/core/src/ifc/ifc-importer.js',
  'packages/core/src/step/step-adapter.js',
  'packages/core/src/export/serialize.js',
  'packages/core/src/export/stl.js',
  'packages/core/src/export/dxf.js',
  'packages/core/src/export/step.js',
  'packages/core/src/export/svg.js',
  'packages/core/src/export/zip.js',
  'packages/core/src/export/package-builder.js',
  'packages/core/src/prototype/layered-wall-model.js',
  'packages/core/src/core.js'
];

function loadCore() {
  delete globalThis.AvelisCore;
  sourceFiles.forEach((relativePath) => {
    const absolutePath = path.join(root, relativePath);
    delete require.cache[require.resolve(absolutePath)];
    require(absolutePath);
  });
  return globalThis.AvelisCore;
}

module.exports = { loadCore, root, sourceFiles };
