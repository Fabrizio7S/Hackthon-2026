const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'invitationService.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(code, sandbox);
const { createInvitationService, normalizePersonalCode, invitationErrorMessage } = sandbox.exports;
const personalCode = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const invitation = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', community_id: 'community-A', community_name: 'Barrio',
  status: 'pending', direction: 'incoming', recipient_name: null,
};

test('valida código completo antes de consultar y normaliza mayúsculas/espacios', async () => {
  let calls = 0;
  const service = createInvitationService({ rpc: async () => { calls++; } });
  await assert.rejects(service.find('incompleto'));
  await assert.rejects(service.send(''));
  await assert.rejects(service.process('otro-id', true));
  assert.equal(calls, 0);
  assert.equal(normalizePersonalCode(` ${personalCode.toUpperCase()} `), personalCode);
});

test('búsqueda usa el código exacto y entrega solo nombre/código', async () => {
  const service = createInvitationService({ rpc: async (name, args) => {
    assert.equal(name, 'find_neighbor');
    assert.equal(Object.keys(args).join(','), 'p_code');
    assert.equal(args.p_code, personalCode);
    return { data: { display_name: 'Vecino', personal_code: personalCode, ignored: 'not exposed' }, error: null };
  } });
  const neighbor = await service.find(personalCode);
  assert.equal(Object.keys(neighbor).sort().join(','), 'display_name,personal_code');
});

test('búsqueda vacía no inventa vecino y un código distinto en la respuesta se rechaza', async () => {
  const empty = createInvitationService({ rpc: async () => ({ data: null, error: null }) });
  assert.equal(await empty.find(personalCode), null);
  const wrong = createInvitationService({ rpc: async () => ({ data: { display_name: 'Otro', personal_code: invitation.id }, error: null }) });
  await assert.rejects(wrong.find(personalCode));
});

test('envío no incluye comunidad, actor, destinatario o rol del cliente', async () => {
  const service = createInvitationService({ rpc: async (name, args) => {
    assert.equal(name, 'send_invitation');
    assert.equal(Object.keys(args).join(','), 'p_code');
    return { data: { ...invitation, direction: 'outgoing', recipient_name: 'Vecino' }, error: null };
  } });
  assert.equal((await service.send(personalCode)).status, 'pending');
});

test('el procesamiento utiliza únicamente id y decisión y respeta el estado final del servidor', async () => {
  const service = createInvitationService({ rpc: async (name, args) => {
    assert.equal(name, 'process_invitation');
    assert.equal(Object.keys(args).sort().join(','), 'p_accept,p_id');
    assert.equal(args.p_accept, true);
    return { data: { ...invitation, status: 'rejected' }, error: null };
  } });
  // Otro dispositivo ya la rechazó: no anunciar aceptación por la acción solicitada.
  assert.equal((await service.process(invitation.id, true)).status, 'rejected');
});

test('se rechazan respuestas de otra invitación, dirección incorrecta o estado desconocido', async () => {
  for (const data of [
    { ...invitation, id: personalCode }, { ...invitation, direction: 'outgoing' }, { ...invitation, status: 'other' },
  ]) {
    const service = createInvitationService({ rpc: async () => ({ data, error: null }) });
    await assert.rejects(service.process(invitation.id, true));
  }
});

test('la lista vacía es válida y los datos de lista malformados se rechazan', async () => {
  const empty = createInvitationService({ rpc: async name => {
    assert.equal(name, 'get_my_invitations'); return { data: [], error: null };
  } });
  assert.equal((await empty.load()).length, 0);
  for (const data of [null, {}, [{ ...invitation, direction: 'unknown' }]]) {
    const service = createInvitationService({ rpc: async () => ({ data, error: null }) });
    await assert.rejects(service.load());
  }
});

test('doble procesamiento se bloquea y un error libera el servicio para reintentar', async () => {
  let complete;
  let calls = 0;
  const service = createInvitationService({ rpc: () => {
    calls++; return new Promise(resolve => { complete = resolve; });
  } });
  const first = service.process(invitation.id, true);
  await assert.rejects(service.process(invitation.id, true));
  assert.equal(calls, 1);
  complete({ data: null, error: { code: 'network' } });
  await assert.rejects(first);
  const retry = service.process(invitation.id, true);
  assert.equal(calls, 2);
  complete({ data: { ...invitation, status: 'accepted' }, error: null });
  assert.equal((await retry).status, 'accepted');
});

test('la denegación remota no confirma aceptación y no expone diagnósticos internos', async () => {
  const service = createInvitationService({ rpc: async () => ({ data: null, error: { code: '42501' } }) });
  await assert.rejects(service.process(invitation.id, true));
  assert.match(invitationErrorMessage({ code: '42501' }), /No tienes permiso/);
  assert.equal(invitationErrorMessage({ message: 'internal diagnostics' }).includes('internal diagnostics'), false);
});
