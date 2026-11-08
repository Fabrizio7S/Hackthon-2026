const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, './contracts.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(code, sandbox);
const { toSessionIdentity, toCommunityIdentity } = sandbox.exports;
const user = { id: 'A', email: 'fixture@example.invalid' };
const membership = {
  user_id: 'A',
  community_id: 'community-A',
  community_name: 'Barrio A',
  role: 'representative',
};
const data = { can_create: true, has_profile: true, membership };

test('carga, error y cierre no entregan la identidad anterior', () => {
  for (const [restoring, restoreError, nextUser, status] of [
    [true, null, user, 'loading'],
    [false, 'Error de restauración', user, 'error'],
    [false, null, null, 'signedOut'],
  ]) {
    const result = toSessionIdentity({ restoring, restoreError, user: nextUser });
    assert.equal(result.status, status);
    assert.equal(result.user, null);
  }
});

test('identidad pública no contiene tokens, roles globales ni metadatos del SDK', () => {
  const raw = {
    ...user,
    access_token: 'fixture-token',
    refresh_token: 'fixture-refresh',
    user_metadata: { role: 'representative' },
  };
  const identity = toSessionIdentity({ restoring: false, restoreError: null, user: raw });
  assert.equal(Object.keys(identity.user).sort().join(','), 'email,id');
  assert.equal(identity.user.id, 'A');
  raw.id = 'B';
  assert.equal(identity.user.id, 'A');
});

test('carga y error de comunidad retiran pertenencia antes de permitir uso del contexto', () => {
  const loading = toCommunityIdentity('A', { loading: true, error: null, data });
  assert.equal(loading.status, 'loading');
  assert.equal(loading.community, null);
  assert.equal(loading.membership, null);
  const failure = toCommunityIdentity('A', { loading: false, error: 'Sin red', data: null });
  assert.equal(failure.status, 'error');
  assert.equal(failure.membership, null);
});

test('pertenencia de otra cuenta o rol desconocido nunca se presenta como válida', () => {
  for (const row of [
    { ...membership, user_id: 'B' },
    { ...membership, role: 'admin' },
    { ...membership, community_id: '' },
  ]) {
    const result = toCommunityIdentity('A', {
      loading: false,
      error: null,
      data: { ...data, membership: row },
    });
    assert.equal(result.status, 'error');
    assert.equal(result.community, null);
    assert.equal(result.membership, null);
  }
});

test('sin comunidad solo habilita creación si hay perfil y autorización de backend', () => {
  for (const has_profile of [true, false]) {
    for (const can_create of [true, false]) {
      const result = toCommunityIdentity('A', {
        loading: false,
        error: null,
        data: { has_profile, can_create, membership: null },
      });
      assert.equal(result.status, 'withoutCommunity');
      assert.equal(result.canCreateCommunity, has_profile && can_create);
      assert.equal(result.canInviteNeighbors, false);
    }
  }
});

test('rol representante por sí solo no habilita invitaciones ni creación de otra comunidad', () => {
  for (const role of ['representative', 'member']) {
    for (const can_create of [true, false]) {
      const result = toCommunityIdentity('A', {
        loading: false,
        error: null,
        data: { ...data, can_create, membership: { ...membership, role } },
      });
      assert.equal(result.status, 'member');
      assert.equal(result.canInviteNeighbors, role === 'representative' && can_create);
      assert.equal(result.canCreateCommunity, false);
    }
  }
});

test('miembro sin perfil confirmado se rechaza como respuesta inconsistente', () => {
  const result = toCommunityIdentity('A', {
    loading: false,
    error: null,
    data: { ...data, has_profile: false },
  });
  assert.equal(result.status, 'error');
  assert.equal(result.membership, null);
});

test('contrato de membresía copia solo sus campos y no conserva alias del SDK', () => {
  const raw = { ...membership, internal_metadata: 'fixture' };
  const result = toCommunityIdentity('A', {
    loading: false,
    error: null,
    data: { ...data, membership: raw },
  });
  assert.equal(result.community.id, result.membership.community_id);
  assert.equal(
    Object.keys(result.membership).sort().join(','),
    'community_id,community_name,invite_code,role,user_id',
  );
  raw.role = 'member';
  assert.equal(result.membership.role, 'representative');
});

test('error de una escritura no inventa ausencia de una membresía ya confirmada', () => {
  const result = toCommunityIdentity('A', { loading: false, error: 'Error de acción', data });
  assert.equal(result.status, 'member');
  assert.equal(result.membership.user_id, 'A');
});
