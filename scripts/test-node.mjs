import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = [];
async function walk(relative) {
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) await walk(name);
    else if (/\.test\.(?:ts|mjs)$/.test(name) && !/from\s+['"]vitest['"]/.test(await readFile(path.join(root, name), 'utf8'))) files.push(name);
  }
}
await walk('src');
await walk('scripts');
const loader = fileURLToPath(new URL('./register-host-fixture.mjs', import.meta.url));
const nodeOptions = `${process.env.NODE_OPTIONS ?? ''} --import=${JSON.stringify(loader)}`.trim();
console.log(`Running ${files.length} extracted Node test files`);
const child = spawn(process.execPath, ['--experimental-strip-types', '--test', '--test-concurrency=2', ...files.sort()], {
  cwd: root, stdio: 'inherit', env: { ...process.env, NODE_OPTIONS: nodeOptions },
});
child.on('error', (error) => { console.error(error); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
