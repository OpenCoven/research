import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
const root = new URL('../', import.meta.url);
const contract = JSON.parse(await readFile(new URL('contracts/host-imports.json', root), 'utf8'));
let count = 0;
async function walk(relative) {
  for (const entry of await readdir(new URL(relative, root), { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) { await walk(`${name}/`); continue; }
    if (!/\.(tsx?|js)$/.test(name)) continue;
    const text = await readFile(new URL(name, root), 'utf8');
    const source = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true);
    const imports = [];
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text);
      ts.forEachChild(node, visit);
    }
    visit(source);
    for (const spec of imports) {
      if (spec.startsWith('@opencoven/research-host-test/') && !name.includes('.test.')) throw Error(`${name}: test fixture import in production`);
      if (spec.startsWith('@/')) throw Error(`${name}: private Cave import ${spec}`);
      if (spec.startsWith('@opencoven/research-host/') && !contract.modules[spec.slice('@opencoven/research-host/'.length)]) throw Error(`${name}: undeclared host contract ${spec}`);
      if (spec.startsWith('.')) {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(name), spec));
        if (!resolved.startsWith(relative.startsWith('src') ? 'src/' : 'dist/') && !(name.includes('.test.') && (resolved.startsWith('tests/') || resolved.startsWith('schemas/')))) throw Error(`${name}: package escape ${spec}`);
        await access(new URL(resolved, root));
      }
    }
    count++;
  }
}
await walk('src/');
await walk('dist/');
console.log(`Validated ${count} source and compiled module boundaries`);
