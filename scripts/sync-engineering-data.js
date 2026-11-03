'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'data', 'engineering_sources.json');
const outputPath = path.join(root, 'packages', 'core', 'src', 'data', 'engineering-catalog.js');
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const banner = [
  '/* GENERATED FILE — do not edit directly.',
  ' * Authoritative source: data/engineering_sources.json',
  ' * Regenerate with: npm run sync-data',
  ' */'
].join('\n');
const body = `${banner}\n(function initEngineeringCatalog(global) {\n  'use strict';\n  const core = global.AvelisCore = global.AvelisCore || {};\n  core.ENGINEERING_DATA = Object.freeze(${JSON.stringify(data, null, 2)});\n})(typeof globalThis !== 'undefined' ? globalThis : window);\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, body, 'utf8');
process.stdout.write(`Synchronized ${path.relative(root, outputPath)} from ${path.relative(root, sourcePath)}\n`);
