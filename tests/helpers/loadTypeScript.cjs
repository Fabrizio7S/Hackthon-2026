const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Resolve each import relative to its actual module, so reorganizing folders does
// not require weakening assertions or replacing the production implementation.
function createTypeScriptLoader({
  baseDir,
  mocks = {},
  globals = {},
  jsx = ts.JsxEmit.ReactJSX,
} = {}) {
  const cache = new Map();
  function resolve(name, from) {
    const base = path.resolve(from, name);
    return (
      ['', '.ts', '.tsx', '.cjs', '/index.ts', '/index.tsx']
        .map((extension) => base + extension)
        .find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) ?? base
    );
  }
  const localMocks = new Map(
    Object.entries(mocks)
      .filter(([name]) => name.startsWith('.'))
      .map(([name, value]) => [resolve(name, baseDir), value]),
  );
  function load(name, from = baseDir) {
    const file = resolve(name, from);
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx,
        esModuleInterop: true,
      },
    }).outputText;
    const sandbox = {
      exports,
      ...globals,
      require: (id) => {
        if (id in mocks) return mocks[id];
        if (!id.startsWith('.')) throw new Error(`Unexpected require: ${id} in ${file}`);
        const target = resolve(id, path.dirname(file));
        return localMocks.has(target) ? localMocks.get(target) : load(id, path.dirname(file));
      },
    };
    vm.runInNewContext(code, sandbox, { filename: file });
    return sandbox.exports;
  }
  return load;
}
module.exports = { createTypeScriptLoader };
