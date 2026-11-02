'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { loadCore, root } = require('../tests/load-core');

const core = loadCore();
const outputRoot = path.join(root, 'experiments', 'results');
fs.mkdirSync(outputRoot, { recursive: true });

const summary = [];
const manifest = {
  schema: 'avelis.experiment-manifest.v1',
  generatedAt: new Date().toISOString(),
  softwareVersion: core.VERSION,
  cases: []
};

core.EXPERIMENT_PRESETS.forEach((preset) => {
  const input = { ...core.DEFAULT_INPUT, ...preset.input, projectId: 'AVELIS-IAM-2026', wallId: preset.id.toUpperCase(), version: '1.0' };
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

const header = ['caseId', 'wallLengthMm', 'wallHeightMm', 'windowWidthMm', 'windowHeightMm', 'doorEnabled', 'doorWidthMm', 'doorHeightMm', 'validCandidates', 'processingTimeMs', 'candidateId', 'score', 'timberVolumeM3', 'componentCount', 'estimatedCostEur', 'estimatedMachineTimeMin'];
const rows = summary.map((entry) => [
  entry.caseId,
  entry.input.wallLengthMm,
  entry.input.wallHeightMm,
  entry.input.windowWidthMm,
  entry.input.windowHeightMm,
  entry.input.doorEnabled,
  entry.input.doorEnabled ? entry.input.doorWidthMm : '',
  entry.input.doorEnabled ? entry.input.doorHeightMm : '',
  entry.validCandidateCount,
  entry.processingTimeMs,
  entry.recommendedCandidateId,
  entry.score,
  entry.metrics.timberVolumeM3,
  entry.metrics.componentCount,
  entry.metrics.estimatedCostEur,
  entry.metrics.estimatedMachineTimeMin
]);
fs.writeFileSync(path.join(outputRoot, 'summary.csv'), [header, ...rows].map((row) => row.join(';')).join('\n') + '\n');
fs.writeFileSync(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
process.stdout.write(`${summary.length} cas générés dans ${outputRoot}\n`);
