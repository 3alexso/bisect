// Concatenates src/*.js + src/styles.css into a single bisect.js
// Run this locally (node build.js) before pushing to GitHub Pages.
// The extension only ever fetches the final bisect.js — nothing about
// the extension needs to change when you edit these source files.

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outFile = path.join(__dirname, 'bisect.js');

const script1 = fs.readFileSync(path.join(srcDir, 'script1.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(srcDir, 'styles.css'), 'utf8');
const constants = fs.readFileSync(path.join(srcDir, '01-constants.js'), 'utf8');
const logic = fs.readFileSync(path.join(srcDir, '02-logic.js'), 'utf8');
const render = fs.readFileSync(path.join(srcDir, '03-render.js'), 'utf8');

const body = [
  constants.trim(),
  `const SCRIPT1_SOURCE = ${JSON.stringify(script1)};`,
  logic.trim(),
  `const PANEL_STYLES = ${JSON.stringify(stylesCss)};`,
  render.trim(),
].join('\n\n');

const indented = body
  .split('\n')
  .map((line) => (line ? '    ' + line : line))
  .join('\n');

const output = `(() => {\n  function main() {\n${indented}\n  }\n\n  main();\n})();\n`;

fs.writeFileSync(outFile, output);
console.log('Built bisect.js —', Buffer.byteLength(output), 'bytes');
