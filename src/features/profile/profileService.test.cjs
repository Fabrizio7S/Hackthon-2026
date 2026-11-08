const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'profileService.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(code, sandbox);
const { createProfileService, normalizeDisplayName, profileErrorMessage, isPlaceholderName } = sandbox.exports;

const own = { id: 'A', display_name: 'Ana', personal_code: 'server-generated-code' };

function fakeClient(responses) {
  const calls = [];
  return { calls, from: table => {
    const call = { table };
    calls.push(call);
    const query = {
      select: columns => { call.columns = columns; return query; },
      eq: (column, value) => { call.filter = { column, value }; return query; },
      insert: values => { call.insert = values; return query; },
      update: values => { call.update = values; return query; },
      maybeSingle: finish,
      single: finish,
    };
    function finish() {
      if (!responses.length) throw new Error('Unexpected query');
      return Promise.resolve(responses.shift());
    }
    return query;
  } };
}

test('valida nombre vacío, controles y límite unicode antes de consultar datos', async () => {
  const client = fakeClient([]);
  const service = createProfileService(client, 'A');
  for (const value of ['', '   ', 'Ana\nMaría', 'a'.repeat(101)]) {
    await assert.rejects(service.save(value));
  }
  assert.equal(client.calls.length, 0);
  assert.equal(normalizeDisplayName('  Ana María  '), 'Ana María');
  assert.equal(normalizeDisplayName('𐐀'.repeat(100)).length, 200);
});

test('la consulta se limita al identificador de la sesión y no expone correo', async () => {
  const client = fakeClient([{ data: own, error: null }]);
  const profile = await createProfileService(client, 'A').load();
  assert.equal(profile.id, 'A');
  assert.equal(client.calls[0].filter.value, 'A');
  assert.equal(client.calls[0].columns.includes('email'), false);
});

test('el registro envía solo nombre; identidad y código provienen del backend', async () => {
  const client = fakeClient([{ data: null, error: null }, { data: own, error: null }]);
  const result = await createProfileService(client, 'A').save(' Ana ');
  assert.equal(Object.keys(client.calls[1].insert).join(','), 'display_name');
  assert.equal(client.calls[1].insert.display_name, 'Ana');
  assert.equal(result.personal_code, own.personal_code);
});

test('la edición nunca envía identidad o código y conserva el código confirmado', async () => {
  const client = fakeClient([{ data: own, error: null }, { data: { ...own, display_name: 'Ana María' }, error: null }]);
  const result = await createProfileService(client, 'A').save('Ana María');
  assert.equal(Object.keys(client.calls[1].update).join(','), 'display_name');
  assert.equal(client.calls[1].filter.value, 'A');
  assert.equal(result.personal_code, own.personal_code);
});

test('si otro intento ya creó el perfil, reutiliza la fila y no cambia su código', async () => {
  const client = fakeClient([
    { data: null, error: null }, { data: null, error: { code: '23505' } },
    { data: own, error: null }, { data: { ...own, display_name: 'Ana María' }, error: null },
  ]);
  const result = await createProfileService(client, 'A').save('Ana María');
  assert.equal(client.calls.filter(call => call.insert).length, 1);
  assert.equal(result.personal_code, own.personal_code);
  assert.equal(result.display_name, 'Ana María');
});

test('rechaza una respuesta de otra cuenta sin entregarla a la pantalla', async () => {
  const client = fakeClient([{ data: { ...own, id: 'B' }, error: null }]);
  await assert.rejects(createProfileService(client, 'A').load());
});

test('bloquea guardados simultáneos y permite reintentar tras error de red', async () => {
  let finish;
  let reads = 0;
  const client = { from: () => {
    const query = { select: () => query, eq: () => query,
      maybeSingle: () => { reads++; return new Promise(resolve => { finish = resolve; }); } };
    return query;
  } };
  const service = createProfileService(client, 'A');
  const first = service.save('Ana');
  await assert.rejects(service.save('Ana'));
  assert.equal(reads, 1);
  finish({ data: null, error: { code: 'network' } });
  await assert.rejects(first);
  const second = service.save('Ana');
  assert.equal(reads, 2);
  finish({ data: null, error: { code: 'network' } });
  await assert.rejects(second);
});

test('un fallo de backend nunca se presenta como perfil guardado ni revela diagnósticos', async () => {
  const client = fakeClient([{ data: own, error: null }, { data: null, error: { code: '42501' } }]);
  await assert.rejects(createProfileService(client, 'A').save('Ana'));
  assert.equal(profileErrorMessage({ code: 'unknown', message: 'internal diagnosis' }).includes('internal diagnosis'), false);
});

test('el nombre provisional «Vecino» pide completar el perfil; un nombre propio no', () => {
  for (const value of ['Vecino', ' vecino ', 'VECINO']) assert.equal(isPlaceholderName(value), true, value);
  for (const value of ['Ana', 'Vecino Pérez', 'Mi vecino', '', null, undefined]) assert.equal(isPlaceholderName(value), false, String(value));
});
