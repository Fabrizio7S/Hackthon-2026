const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, 'membersService.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(compiled, sandbox);
const { createMembersService, observeMembers, membersErrorMessage } = sandbox.exports;
const own = { display_name: 'Ana', role: 'representative', is_current_user: true };
const settle = () => new Promise(resolve => setImmediate(resolve));

test('resuelve la comunidad en servidor sin enviar un identificador escogido por cliente', async () => {
  const service = createMembersService({ rpc: async (...args) => {
    assert.equal(args.length, 1);
    assert.equal(args[0], 'get_my_community_members');
    return { data: { community_id: 'A', members: [own] }, error: null };
  } }, 'A');
  assert.equal((await service.load())[0].display_name, 'Ana');
});

test('el servicio solo entrega nombre, rol y marca propia', async () => {
  const service = createMembersService({ rpc: async () => ({ data: { community_id: 'A', members: [{
    ...own, email: 'fixture@example.invalid', personal_code: 'not-exposed', user_id: 'not-exposed',
  }] }, error: null }) }, 'A');
  const member = (await service.load())[0];
  assert.equal(Object.keys(member).sort().join(','), 'display_name,is_current_user,role');
});

test('no expone una lista de otra comunidad ni respuestas malformadas', async () => {
  for (const data of [
    { community_id: 'B', members: [own] }, { community_id: 'A', members: null },
    { community_id: 'A', members: [{ ...own, role: 'admin' }] },
    { community_id: 'A', members: [{ ...own, is_current_user: 'true' }] },
  ]) {
    await assert.rejects(createMembersService({ rpc: async () => ({ data, error: null }) }, 'A').load());
  }
});

test('maneja lista vacía sin inventar integrantes', async () => {
  const members = await createMembersService({ rpc: async () => ({ data: { community_id: 'A', members: [] }, error: null }) }, 'A').load();
  assert.equal(members.length, 0);
});

test('lectura atrasada de una cuenta desmontada no actualiza la vista', async () => {
  let complete;
  const states = [];
  const stop = observeMembers({ load: () => new Promise(resolve => { complete = resolve; }) }, state => states.push(state));
  assert.equal(states[0].status, 'loading');
  stop();
  complete([own]);
  await settle();
  assert.equal(states.length, 1);
});

test('fallo de lectura limpia la lista y permite una nueva lectura de reintento', async () => {
  const first = [];
  const stop = observeMembers({ load: async () => { throw { code: 'network' }; } }, state => first.push(state));
  await settle();
  assert.equal(first.at(-1).status, 'error');
  assert.equal(first.at(-1).members.length, 0);
  stop();
  const retry = [];
  const stopRetry = observeMembers({ load: async () => [own] }, state => retry.push(state));
  await settle();
  assert.equal(retry.at(-1).status, 'ready');
  assert.equal(retry.at(-1).members[0].display_name, 'Ana');
  stopRetry();
});

test('error tardío tras cancelación no sobrescribe otra sesión', async () => {
  let fail;
  const states = [];
  const stop = observeMembers({ load: () => new Promise((_, reject) => { fail = reject; }) }, state => states.push(state));
  stop();
  fail(new Error('fixture network failure'));
  await settle();
  assert.equal(states.length, 1);
});

test('denegación remota no devuelve lista y no expone diagnósticos internos', async () => {
  const service = createMembersService({ rpc: async () => ({ data: null, error: { code: '42501' } }) }, 'A');
  await assert.rejects(service.load());
  assert.match(membersErrorMessage({ code: '42501' }), /No tienes acceso/);
  assert.equal(membersErrorMessage({ message: 'internal diagnostics' }).includes('internal diagnostics'), false);
});
