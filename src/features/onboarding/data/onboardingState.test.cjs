const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const sandbox = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync(path.join(__dirname, './onboardingState.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  sandbox,
);
const { createOnboardingState } = sandbox.exports;

function memoryStorage() {
  const values = new Map();
  return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
  };
}

test('cuenta nueva inicia; completar o saltar persiste al reabrir y no afecta otra cuenta', async () => {
  const storage = memoryStorage();
  const first = createOnboardingState(storage, 'vecino-a');
  assert.equal(await first.shouldStart(), true);
  await first.finish();
  assert.equal(await createOnboardingState(storage, 'vecino-a').shouldStart(), false);
  assert.equal(await createOnboardingState(storage, 'vecino-b').shouldStart(), true);
});

test('un recorrido ya visto se puede iniciar manualmente sin borrar lo guardado', async () => {
  const storage = memoryStorage();
  await createOnboardingState(storage, 'a').finish();
  const tour = createOnboardingState(storage, 'a');
  tour.start();
  assert.equal(await tour.shouldStart(), false);
  await tour.finish();
  assert.equal(await createOnboardingState(storage, 'a').shouldStart(), false);
});

test('una lectura tardía no reabre el recorrido después de saltarlo o iniciarlo manualmente', async () => {
  for (const action of ['start', 'finish']) {
    let resolve;
    const tour = createOnboardingState(
      {
        getItem: () =>
          new Promise((r) => {
            resolve = r;
          }),
        setItem: async () => {},
      },
      'a',
    );
    const pending = tour.shouldStart();
    await tour[action]();
    resolve(null);
    assert.equal(await pending, false);
  }
});

test('fallos de almacenamiento se propagan y guardar puede reintentarse', async () => {
  let fail = true;
  const storage = memoryStorage();
  const tour = createOnboardingState(
    {
      ...storage,
      setItem: async (...args) => {
        if (fail) throw new Error('sin espacio');
        return storage.setItem(...args);
      },
    },
    'a',
  );
  await assert.rejects(tour.finish(), /sin espacio/);
  assert.equal(tour.dismissed, true);
  assert.equal(await tour.shouldStart(), false);
  fail = false;
  await tour.finish();
  assert.equal(await createOnboardingState(storage, 'a').shouldStart(), false);
  await assert.rejects(
    createOnboardingState(
      {
        ...storage,
        getItem: async () => {
          throw new Error('no disponible');
        },
      },
      'a',
    ).shouldStart(),
    /no disponible/,
  );
});
