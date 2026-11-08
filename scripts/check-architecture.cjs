const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..', 'src');
function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? collect(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}
function resolve(importer, specifier) {
  const base = path.resolve(path.dirname(importer), specifier);
  return ['.ts', '.tsx', '.native.tsx', '.web.tsx', '/index.ts', '/index.tsx']
    .map((extension) => base + extension)
    .filter((file) => fs.existsSync(file));
}
const graph = new Map();
const errors = [];
for (const file of collect(root)) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const edges = [];
  for (const node of source.statements) {
    if ((!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) || !node.moduleSpecifier)
      continue;
    const specifier = node.moduleSpecifier.text;
    if (!specifier.startsWith('.')) continue;
    const targets = resolve(file, specifier);
    if (!targets.length)
      errors.push(`Importación sin destino: ${path.relative(root, file)} -> ${specifier}`);
    const origin = path.relative(root, file).split(path.sep)[0];
    for (const target of targets) {
      const destination = path.relative(root, target).split(path.sep)[0];
      if (
        (origin === 'shared' && ['app', 'features'].includes(destination)) ||
        (origin === 'features' && destination === 'app')
      ) {
        errors.push(
          `Dependencia entre capas no permitida: ${path.relative(root, file)} -> ${path.relative(root, target)}`,
        );
      }
    }
    const clause = ts.isImportDeclaration(node) ? node.importClause : null;
    const onlyTypes =
      node.isTypeOnly ||
      clause?.isTypeOnly ||
      (clause?.namedBindings &&
        ts.isNamedImports(clause.namedBindings) &&
        !clause.name &&
        clause.namedBindings.elements.every((item) => item.isTypeOnly));
    if (!onlyTypes) edges.push(...targets);
  }
  graph.set(file, edges);
}
const visited = new Set();
const active = new Set();
const stack = [];
function visit(file) {
  if (active.has(file)) {
    errors.push(
      'Ciclo: ' +
        [...stack.slice(stack.indexOf(file)), file]
          .map((item) => path.relative(root, item))
          .join(' -> '),
    );
    return;
  }
  if (visited.has(file)) return;
  visited.add(file);
  active.add(file);
  stack.push(file);
  for (const target of graph.get(file) ?? []) visit(target);
  stack.pop();
  active.delete(file);
}
for (const file of graph.keys()) visit(file);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Arquitectura correcta: ${graph.size} módulos, sin imports locales rotos, ciclos ni dependencias inversas entre capas.`,
);
