#!/usr/bin/env node
// Drift guard for pipeline.json: assert every file it points at actually exists.
// No dependencies. Run: node scripts/validate-pipeline.js
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'pipeline.json'), 'utf8'));

const refs = new Set();
const addRef = (p) => { if (typeof p === 'string' && p.includes('/') && !p.includes('://')) refs.add(p); };

for (const stage of [...manifest.stages, ...manifest.alternateEntries]) {
  addRef(stage.implementedBy);
  (stage.harnessEntries || []).forEach(addRef);
}
addRef(manifest.observability && manifest.observability.metricsReport);

const missing = [...refs].filter((rel) => !fs.existsSync(path.join(root, rel)));

if (missing.length) {
  console.error('pipeline.json references files that do not exist:');
  missing.forEach((m) => console.error('  - ' + m));
  process.exit(1);
}
console.log(`pipeline.json OK — ${refs.size} referenced paths all exist.`);
