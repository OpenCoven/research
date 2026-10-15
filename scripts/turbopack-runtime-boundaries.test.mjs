import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Migrated from Cave's runtime filesystem trace guard. The published ESM
// must preserve these annotations as well as the authoring source.
for (const file of ['src/lib/server/research-topic-discovery-store.ts', 'dist/lib/server/research-topic-discovery-store.js']) {
  test(`${file} keeps runtime discovery directories outside the packaged trace`, async () => {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const [directory, count] of [['jobsDir', 2], ['proposalsDir', 1]]) {
      const boundary = new RegExp(`readdir\\(\\s*/\\* turbopackIgnore: true \\*/\\s*layout\\.${directory}\\s*\\)`, 'g');
      assert.equal([...source.matchAll(boundary)].length, count, `${file}: ${directory} must retain its reviewed runtime boundary`);
    }
  });
}
