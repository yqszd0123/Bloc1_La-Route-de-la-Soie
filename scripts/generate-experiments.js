'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { loadCore, root } = require('../tests/load-core');

const core = loadCore();
const outputRoot = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'experiments', 'results');
fs.mkdirSync(outputRoot, { recursive: true });

const summary = [];
const manifest = {
  schema: 'avelis.experiment-manifest.v2',
  generatedAt: new Date().toISOString(),
  softwareVersion: core.VERSION,
  cases: []
};

const cases = ['STEEL', 'TIMBER'].flatMap((frameMaterial) => core.EXPERIMENT_PRESETS.map((preset) => ({
  ...preset,
  id: frameMaterial === 'STEEL' ? preset.id : `${preset.id}-timber`,
  input: { ...preset.input, frameMaterial }
})));
cases.push({id:'avelis-reference-timber',label:core.timberReference.preset().label,input:{...core.timberReference.preset().input,frameMaterial:'TIMBER',timberReferenceId:core.timberReference.preset().id}});
cases.forEach((preset) => {
  const input = { ...core.DEFAULT_INPUT, ...preset.input, projectId: 'AVELIS-IAM-2026', wallId: preset.id.toUpperCase(), version: core.VERSION };
  const result = core.runWorkflow(input);
  if (!result.ok) throw new Error(`Échec du cas ${preset.id}`);
  const candidate = result.recommended;
  const caseFolder = path.join(outputRoot, preset.id);
  fs.mkdirSync(caseFolder, { recursive: true });

  const files = core.packageBuilder.buildExportFiles(result, candidate, input.prototypeScale);
  Object.entries(files).forEach(([relativePath, contents]) => {
    const target = path.join(caseFolder, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  });
  fs.writeFileSync(path.join(caseFolder, `${preset.id}-handover.zip`), core.packageBuilder.buildExportZip(result, candidate, input.prototypeScale));

  const record = {
    caseId: preset.id,
    label: preset.label,
    input,
    searchSpaceSize: result.search.searchSpaceSize,
    validCandidateCount: result.rankedCandidates.length,
    rejectedCandidateCount: result.search.rejectedCandidates.length,
    processingTimeMs: result.processingTimeMs,
    recommendedCandidateId: candidate.id,
    recommendedRank: candidate.rank,
    score: candidate.score,
    paretoOptimal: candidate.paretoOptimal,
    metrics: candidate.metrics
  };
  fs.writeFileSync(path.join(caseFolder, 'experiment-result.json'), JSON.stringify(record, null, 2) + '\n');
  summary.push(record);
  manifest.cases.push({ caseId: preset.id, folder: preset.id, result: `${preset.id}/experiment-result.json` });
});

const header = ['caseId', 'frameMaterial', 'wallLengthMm', 'wallHeightMm', 'windowEnabled', 'doorEnabled', 'validCandidates', 'processingTimeMs', 'candidateId', 'score', 'materialMassKg', 'timberVolumeM3', 'componentCount', 'uniqueLengthCount', 'materialCostEurExVat', 'engineeringStatus'];
const rows = summary.map((entry) => [
  entry.caseId,
  entry.input.frameMaterial,
  entry.input.wallLengthMm,
  entry.input.wallHeightMm,
  entry.input.windowEnabled,
  entry.input.doorEnabled,
  entry.validCandidateCount,
  entry.processingTimeMs,
  entry.recommendedCandidateId,
  entry.score,
  entry.metrics.materialMassKg,
  entry.metrics.timberVolumeM3 ?? '',
  entry.metrics.componentCount,
  entry.metrics.uniqueLengthCount,
  entry.metrics.materialCostEstimateEurExVat,
  'ENGINEERING_REVIEW_REQUIRED'
]);
fs.writeFileSync(path.join(outputRoot, 'summary.csv'), [header, ...rows].map((row) => row.join(';')).join('\n') + '\n');
fs.writeFileSync(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
process.stdout.write(`${summary.length} cas générés dans ${outputRoot}\n`);
