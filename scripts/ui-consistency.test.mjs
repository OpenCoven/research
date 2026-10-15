import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { hostFixture } from './host-fixture.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const { scanSource, compareFindings } = await import(pathToFileURL(path.join(hostFixture(), 'scripts/ui-consistency.mjs')));

test('extracted Research UI retains the host consistency ratchet', () => {
  const findings = [];
  let scanned = 0;
  function walk(relative) {
    for (const entry of readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const file = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (file.endsWith('.tsx') && !file.includes('.test.')) {
        scanned++;
        findings.push(...scanSource({ path: file, source: readFileSync(path.join(root, file), 'utf8') }));
      }
    }
  }
  walk('src/components');
  assert.ok(scanned > 0, 'the package UI scan must not be empty');
  const baseline = JSON.parse(readFileSync(new URL('../contracts/ui-consistency-baseline.json', import.meta.url), 'utf8'));
  const result = compareFindings(findings, baseline.findings, []);
  assert.equal(result.ok, true, JSON.stringify(result, null, 2));
});
