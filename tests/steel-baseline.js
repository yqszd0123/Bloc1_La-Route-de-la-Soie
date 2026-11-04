'use strict';
// Captured before the Avelis timber-only changes, at dd3627f.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { loadCore, root } = require('./load-core');
const RealDate = Date;
global.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : ['2026-11-04T12:00:00Z'])); }
  static now() { return new RealDate('2026-11-04T12:00:00Z').getTime(); }
};
const core = loadCore();
const digest = (value) => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const inputs = [core.DEFAULT_INPUT, ...core.EXPERIMENT_PRESETS.map((p) => ({...core.DEFAULT_INPUT, ...p.input})),
  {...core.DEFAULT_INPUT, windowEnabled:false, doorEnabled:false},
  {...core.DEFAULT_INPUT, wallLengthMm:4200, wallHeightMm:2800, budgetPriceEurPerKgExVat:5, priority:'manufacturing'}];
const runs = inputs.map((input) => core.runWorkflow(input));
runs.push(core.runIfcWorkflow(fs.readFileSync(path.join(root,'test-data/ifc/wall-with-opening-and-window.ifc'),'utf8')));
const snapshot = runs.map((result) => {
  assert.ok(result.ok);
  const files = core.packageBuilder.buildExportFiles(result);
  // Shared source bibliography/docs may gain timber references; operational files must be identical.
  const operational = Object.fromEntries(Object.entries(files).filter(([name]) =>
    name !== '04_quality/engineering_data_snapshot.json' && name !== '05_interfaces/Bloc1_Bloc2_Interface_Schema.md')
    .map(([name,data]) => [name,digest(data)]));
  return {input:result.input, candidates:digest(result.rankedCandidates), operational,
    layers:digest(core.prototypeLayers.build(result.recommended,'COMPLETE'))};
});
const file = path.join(__dirname,'steel-baseline.json');
if (process.argv.includes('--capture')) fs.writeFileSync(file,JSON.stringify(snapshot,null,2)+'\n');
else { assert.deepEqual(snapshot,JSON.parse(fs.readFileSync(file,'utf8'))); console.log('PASS steel baseline: 7 cases, all candidates, quantities, costs, BOM, CAD, STL parts, handovers and layers unchanged'); }
global.Date = RealDate;
