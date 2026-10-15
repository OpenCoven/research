import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { hostFixture } from './host-fixture.mjs';

const fixture = hostFixture();
const { PDF_WORKER_URL_PATH, installedPdfjsVersion } = await import(pathToFileURL(path.join(fixture, 'scripts/copy-pdf-worker.mjs')));

test('Research viewer uses the worker URL and pdf.js version staged by Cave', () => {
  const viewer = readFileSync(new URL('../src/components/research-paper-viewer.tsx', import.meta.url), 'utf8');
  assert.ok(viewer.includes(`workerSrc = "${PDF_WORKER_URL_PATH}"`), 'workerSrc and the staged public path must stay the same URL');
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(manifest.dependencies['pdfjs-dist'], installedPdfjsVersion(), 'viewer and host worker must use matching pdf.js versions');
});
