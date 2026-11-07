const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'communityService.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(code, sandbox);
const { createCommunityService, normalizeCommunityName, communityErrorMessage } = sandbox.exports;
const membership = { user_id: 'A', community_id: 'community-A', community_name: 'Barrio', role: 'representative' };

test('valida nombre antes de enviar una solicitud', async () => {
  let calls = 0;
  const service = createCommunityService({ rpc: async () => { calls++; } }, 'A');
  for (const name of ['', '   ', 'Dos\nlíneas', 'a'.repeat(101)]) await assert.rejects(service.create(name));
  assert.equal(calls, 0);
  assert.equal(normalizeCommunityName('  Barrio  '), 'Barrio');
});

test('la creación envía solo el nombre; no envía actor ni rol', async () => {
  let received;
  const service = createCommunityService({ rpc: async (name, args) => {
    received = { name, args }; return { data: membership, error: null };
  } }, 'A');
  const result = await service.create(' Barrio ');
  assert.equal(received.name, 'create_community');
  assert.equal(Object.keys(received.args).join(','), 'p_name');
  assert.equal(received.args.p_name, 'Barrio');
  assert.equal(result.community_id, membership.community_id);
});

test('sin comunidad devuelve estado del servidor, sin inventar pertenencia ni permisos', async () => {
  const service = createCommunityService({ rpc: async name => {
    assert.equal(name, 'get_my_community');
    return { data: { can_create: false, has_profile: true, membership: null }, error: null };
  } }, 'A');
  const status = await service.load();
  assert.equal(status.membership, null);
  assert.equal(status.can_create, false);
});

test('no entrega datos de otra identidad ni acepta un rol inesperado', async () => {
  for (const wrong of [{ ...membership, user_id: 'B' }, { ...membership, role: 'admin' }, { ...membership, role: 'member' }]) {
    const service = createCommunityService({ rpc: async () => ({ data: wrong, error: null }) }, 'A');
    await assert.rejects(service.create('Barrio'));
  }
});

test('un estado de permisos incompleto o de otra cuenta se rechaza', async () => {
  for (const data of [{ membership: null }, { can_create: true, has_profile: true, membership: { ...membership, user_id: 'B' } }]) {
    const service = createCommunityService({ rpc: async () => ({ data, error: null }) }, 'A');
    await assert.rejects(service.load());
  }
});

test('bloquea doble envío y permite reintento al fallar', async () => {
  let complete;
  let calls = 0;
  const service = createCommunityService({ rpc: () => {
    calls++; return new Promise(resolve => { complete = resolve; });
  } }, 'A');
  const first = service.create('Barrio');
  await assert.rejects(service.create('Barrio'));
  assert.equal(calls, 1);
  complete({ data: null, error: { code: 'network' } });
  await assert.rejects(first);
  const retry = service.create('Barrio');
  complete({ data: membership, error: null });
  assert.equal((await retry).community_id, membership.community_id);
});

test('una denegación del backend no se presenta como creación confirmada', async () => {
  const service = createCommunityService({ rpc: async () => ({ data: null, error: { code: '42501' } }) }, 'A');
  await assert.rejects(service.create('Barrio'));
  assert.match(communityErrorMessage({ code: '42501' }), /no está autorizada/);
  assert.equal(communityErrorMessage({ message: 'internal diagnostics' }).includes('internal diagnostics'), false);
});
