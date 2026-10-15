import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { transform } from 'esbuild';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const sourceRoot = new URL('src/', root);
const outputRoot = new URL('dist/', root);
await rm(outputRoot, { recursive: true, force: true });
let count = 0;
async function walk(relative = '') {
  for (const entry of await readdir(new URL(relative, sourceRoot), { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) { await walk(`${name}/`); continue; }
    if (name.includes('.test.')) continue;
    const outputName = name.replace(/\.tsx?$/, '.js');
    const output = new URL(outputName, outputRoot);
    await mkdir(new URL('./', output), { recursive: true });
    let text = await readFile(new URL(name, sourceRoot), 'utf8');
    if (/\.tsx?$/.test(name)) {
      const source = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true);
      const edits = [];
      function visit(node) {
        let literal;
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) literal = node.moduleSpecifier;
        if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) literal = node.arguments[0];
        if (literal?.text.startsWith('.')) {
          const spec = literal.text;
          const replacement = spec.endsWith('.css') ? spec : /\.tsx?$/.test(spec) ? spec.replace(/\.tsx?$/, '.js') : `${spec}.js`;
          edits.push({ start: literal.getStart(source) + 1, end: literal.end - 1, replacement });
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
      for (const edit of edits.sort((a, b) => b.start - a.start)) text = text.slice(0, edit.start) + edit.replacement + text.slice(edit.end);
      const result = await transform(text, { loader: name.endsWith('.tsx') ? 'tsx' : 'ts', format: 'esm', target: 'es2023', jsx: 'automatic', sourcemap: 'external', sourcefile: name });
      text = `${result.code}\n//# sourceMappingURL=${path.posix.basename(outputName)}.map\n`;
      await writeFile(new URL(`${outputName}.map`, outputRoot), result.map);
    }
    await writeFile(output, text);
    count++;
  }
}
await walk();
console.log(`Built ${count} production files`);
