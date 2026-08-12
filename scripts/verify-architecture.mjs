import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import ts from 'typescript';

const appRoot = path.resolve('src/app');
const files = await collectTypeScriptFiles(appRoot);
const fileSet = new Set(files);
const dependencies = new Map();

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const imports = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      imports.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  dependencies.set(
    file,
    imports
      .filter((specifier) => specifier.startsWith('.'))
      .map((specifier) => resolveTypeScriptImport(file, specifier))
      .filter((dependency) => dependency && fileSet.has(dependency)),
  );
}

const visited = new Set();
const active = new Set();
const stack = [];

for (const file of files) {
  const cycle = findCycle(file);
  if (cycle) {
    const summary = cycle.map((item) => path.relative(appRoot, item)).join(' -> ');
    throw new Error(`Circular frontend dependency detected: ${summary}`);
  }
}

console.log(`Architecture check passed (${files.length} production TypeScript files, no cycles).`);

function findCycle(file) {
  if (active.has(file)) {
    const cycleStart = stack.indexOf(file);
    return [...stack.slice(cycleStart), file];
  }
  if (visited.has(file)) return null;

  active.add(file);
  stack.push(file);
  for (const dependency of dependencies.get(file) ?? []) {
    const cycle = findCycle(dependency);
    if (cycle) return cycle;
  }
  stack.pop();
  active.delete(file);
  visited.add(file);
  return null;
}

async function collectTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const location = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectTypeScriptFiles(location);
      return entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')
        ? [location]
        : [];
    }),
  );
  return nested.flat();
}

function resolveTypeScriptImport(importer, specifier) {
  const base = path.resolve(path.dirname(importer), specifier);
  const candidates = [`${base}.ts`, path.join(base, 'index.ts')];
  return candidates.find((candidate) => fileSet.has(candidate)) ?? null;
}
