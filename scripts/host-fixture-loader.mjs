import { readFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';
import { pathToFileURL } from 'node:url';
let fixture;
const exports = JSON.parse(await readFile(new URL('../contracts/host-exports.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('../contracts/host-imports.json', import.meta.url), 'utf8'));
export function initialize(data) { fixture = data.fixture; }
export async function resolve(specifier, context, nextResolve) {
  const testOnly = specifier.startsWith('@opencoven/research-host-test/');
  const prefix = testOnly ? '@opencoven/research-host-test/' : '@opencoven/research-host/';
  if (!specifier.startsWith(prefix)) return nextResolve(specifier, context);
  const contract = manifest.modules[specifier.slice(prefix.length)];
  if (!contract) throw Error(`Undeclared host fixture import: ${specifier}`);
  const id = specifier.slice(prefix.length);
  const source = !testOnly && exports.modules[id]?.production ? `src/lib/research-host/${id}.ts` : contract.source;
  return nextResolve(pathToFileURL(resolvePath(fixture, source)).href, context);
}
