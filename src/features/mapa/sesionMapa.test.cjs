const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'types.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(code, sandbox);
const { crearSesionMapa, NOMBRE_CATEGORIA } = sandbox.exports;

test('la sesión del mapa empieza sin filtros, sin selección y sin cámara guardada', () => {
  const sesion = crearSesionMapa();
  assert.equal(sesion.busqueda, '');
  assert.equal(sesion.filtro, 'todos');
  assert.equal(sesion.seleccionId, null);
  assert.equal(sesion.vista, null);
  assert.equal(sesion.explorado, false);
});

test('cada sesión es independiente y conserva lo que se le escribe', () => {
  const a = crearSesionMapa();
  const b = crearSesionMapa();
  a.filtro = 'emergencia';
  a.vista = { latitude: -12.1, longitude: -77.0, zoom: 16 };
  a.explorado = true;
  assert.equal(b.filtro, 'todos');
  assert.equal(b.vista, null);
  assert.equal(a.filtro, 'emergencia');
  assert.equal(a.vista.zoom, 16);
});

test('toda categoría tiene un nombre hablado para lectores de pantalla', () => {
  for (const categoria of ['servicio', 'producto', 'emergencia', 'recurso']) {
    assert.ok(NOMBRE_CATEGORIA[categoria].length > 0);
  }
});
