import { hostFixture } from './scripts/host-fixture.mjs';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
const root = fileURLToPath(new URL('./', import.meta.url));
const fixture = hostFixture();
const imports = JSON.parse(readFileSync(path.join(root, 'contracts/host-imports.json'), 'utf8'));
const exports = JSON.parse(readFileSync(path.join(root, 'contracts/host-exports.json'), 'utf8'));
const alias = Object.fromEntries(Object.entries(imports.modules).map(([id, entry]) => [
  `@opencoven/research-host/${id}`,
  path.resolve(fixture, exports.modules[id]?.production ? `src/lib/research-host/${id}.ts` : (entry as { source: string }).source),
]));
export default defineConfig({
  test: { include: ['src/**/*.test.tsx', 'src/components/role-surfaces/research-evidence-components.test.ts'], passWithNoTests: false },
  resolve: {
    alias: {
      ...alias,
      ...Object.fromEntries(Object.entries(imports.modules).map(([id, entry]) => [
        `@opencoven/research-host-test/${id}`, path.resolve(fixture, (entry as { source: string }).source),
      ])),
      '@': path.resolve(fixture, 'src'),
      'react': path.resolve(fixture, 'node_modules/react'),
      'react-dom': path.resolve(fixture, 'node_modules/react-dom'),
      'react-test-renderer': path.resolve(fixture, 'node_modules/react-test-renderer'),
    },
    dedupe: ['react', 'react-dom', 'react-test-renderer', 'next'],
  },
});
