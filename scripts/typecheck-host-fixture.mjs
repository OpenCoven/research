import { hostFixture } from './host-fixture.mjs';
import ts from 'typescript';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const fixture = hostFixture();
const configPath = path.resolve(fixture, 'tsconfig.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
if (config.error) throw Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
const files = ts.sys.readDirectory(path.join(root, 'src'), ['.ts', '.tsx'], ['**/*.test.ts', '**/*.test.tsx']);
files.push(path.resolve(fixture, 'node_modules/next/types/global.d.ts'));
const options = {
  ...parsed.options,
  incremental: false,
  paths: {
    ...Object.fromEntries(Object.entries(parsed.options.paths ?? {}).map(([alias, targets]) => [
      alias, targets.map((target) => path.resolve(fixture, target)),
    ])),
    'next': [path.resolve(fixture, 'node_modules/next/types/index.d.ts')],
    'next/*': [path.resolve(fixture, 'node_modules/next/*')],
    '@/*': [path.resolve(fixture, 'src/*')],
    '@opencoven/research-host/*': [path.resolve(fixture, 'src/lib/research-host/*')],
  },
  typeRoots: [path.join(root, 'node_modules/@types'), path.resolve(fixture, 'node_modules/@types')],
};
const program = ts.createProgram(files, options);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (name) => name,
    getCurrentDirectory: () => root,
    getNewLine: () => '\n',
  }));
  process.exitCode = 1;
} else console.log(`Typechecked ${files.length} production modules against explicit Cave host adapters`);
