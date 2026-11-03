'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'data', 'engineering_sources.json');
const engineeringOutputPath = path.join(root, 'packages', 'core', 'src', 'data', 'engineering-catalog.js');
const interfaceSourcePath = path.join(root, 'docs', 'Bloc1_Bloc2_Interface_Schema.md');
const interfaceOutputPath = path.join(root, 'packages', 'core', 'src', 'data', 'bloc1-bloc2-interface.js');
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const banner = [
  '/* GENERATED FILE — do not edit directly.',
  ' * Authoritative source: data/engineering_sources.json',
  ' * Regenerate with: npm run sync-data',
  ' */'
].join('\n');
const body = `${banner}\n(function initEngineeringCatalog(global) {\n  'use strict';\n  const core = global.AvelisCore = global.AvelisCore || {};\n  core.ENGINEERING_DATA = Object.freeze(${JSON.stringify(data, null, 2)});\n})(typeof globalThis !== 'undefined' ? globalThis : window);\n`;

fs.mkdirSync(path.dirname(engineeringOutputPath), { recursive: true });
fs.writeFileSync(engineeringOutputPath, body, 'utf8');
process.stdout.write(`Synchronized ${path.relative(root, engineeringOutputPath)} from ${path.relative(root, sourcePath)}\n`);

const interfaceMarkdown = fs.readFileSync(interfaceSourcePath, 'utf8');
const interfaceBody = `/* GENERATED FILE — do not edit directly.\n * Authoritative source: docs/Bloc1_Bloc2_Interface_Schema.md\n * Regenerate with: npm run sync-data\n */\n(function initBloc1Bloc2Interface(global) {\n  'use strict';\n  const core = global.AvelisCore = global.AvelisCore || {};\n  core.BLOC1_BLOC2_INTERFACE_MD = ${JSON.stringify(interfaceMarkdown)};\n})(typeof globalThis !== 'undefined' ? globalThis : window);\n`;
fs.writeFileSync(interfaceOutputPath, interfaceBody, 'utf8');
process.stdout.write(`Synchronized ${path.relative(root, interfaceOutputPath)} from ${path.relative(root, interfaceSourcePath)}\n`);
