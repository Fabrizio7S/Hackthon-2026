const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, 'observeSession.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(compiled, sandbox);
const { observeSession } = sandbox.exports;

function setup(verify = async token => ({ data: { user: { id: token } }, error: null })) {
  let callback, resolve, reject;
  let unsubscribed = 0;
  const states = [];
  const initial = new Promise((yes, no) => { resolve = yes; reject = no; });
  const client = { auth: {
    getSession: () => initial,
    getUser: verify,
    onAuthStateChange: listener => {
      callback = listener;
      return { data: { subscription: { unsubscribe: () => { unsubscribed++; } } } };
    },
  } };
  const stop = observeSession(client, state => states.push(state));
  return {
    states, stop, resolve, reject,
    emit: (event, session) => callback(event, session),
    unsubscribed: () => unsubscribed,
  };
}

const settle = () => new Promise(resolve => setImmediate(resolve));

test('recupera una sesión o el estado sin sesión desde la lectura inicial', async () => {
  for (const session of [null, { user: { id: 'A' }, access_token: 'A' }]) {
    const h = setup();
    h.resolve({ data: { session }, error: null });
    await settle();
    assert.equal(h.states.at(-1).status, 'ready');
    assert.equal(h.states.at(-1).session?.user.id ?? null, session?.user.id ?? null);
    h.stop();
  }
});

test('un cierre posterior gana a la lectura inicial atrasada', async () => {
  const h = setup();
  h.emit('SIGNED_OUT', null);
  h.resolve({ data: { session: { user: { id: 'A' }, access_token: 'A' } }, error: null });
  await settle();
  assert.equal(h.states.length, 1);
  assert.equal(h.states[0].session, null);
  h.stop();
});

test('INITIAL_SESSION no oculta un error de restauración', async () => {
  const h = setup();
  h.emit('INITIAL_SESSION', null);
  h.resolve({ data: { session: null }, error: { message: 'storage failure' } });
  await settle();
  assert.equal(h.states.length, 1);
  assert.equal(h.states[0].status, 'error');
  assert.equal(h.states[0].session, null);
  h.stop();
});

test('un rechazo de lectura deja error y puede reintentarse con una nueva suscripción', async () => {
  const first = setup();
  first.reject(new Error('network failure'));
  await settle();
  assert.equal(first.states[0].status, 'error');
  first.stop();
  const retry = setup();
  retry.resolve({ data: { session: null }, error: null });
  await settle();
  assert.equal(retry.states[0].status, 'ready');
  retry.stop();
});

test('cancelar ignora lecturas y eventos tardíos y libera la suscripción', async () => {
  const h = setup();
  h.stop();
  h.emit('SIGNED_IN', { user: { id: 'A' } });
  h.resolve({ data: { session: { user: { id: 'A' } } }, error: null });
  await settle();
  assert.equal(h.states.length, 0);
  assert.equal(h.unsubscribed(), 1);
});

test('renovación y cambio de cuenta reemplazan el estado de la cuenta anterior', async () => {
  const h = setup();
  h.resolve({ data: { session: { user: { id: 'A' } } }, error: null });
  await settle();
  h.emit('SIGNED_OUT', null);
  const next = { user: { id: 'B' }, access_token: 'B' };
  h.emit('SIGNED_IN', next);
  await settle();
  const refreshed = { user: { id: 'B' }, access_token: 'B' };
  h.emit('TOKEN_REFRESHED', refreshed);
  await settle();
  assert.equal(h.states.filter(state => state.session?.user.id === 'A').length, 0);
  assert.equal(h.states.at(-1).session.user.id, 'B');
  h.stop();
});

test('no muestra una sesión que el servidor rechaza o atribuye a otra identidad', async () => {
  for (const response of [
    { data: { user: null }, error: { code: 'bad_jwt' } },
    { data: { user: { id: 'otro' } }, error: null },
  ]) {
    const h = setup(async () => response);
    h.resolve({ data: { session: { user: { id: 'A' }, access_token: 'A' } }, error: null });
    await settle();
    assert.equal(h.states.at(-1).status, 'error');
    assert.equal(h.states.every(state => state.session === null), true);
    h.stop();
  }
});

test('una verificación de identidad atrasada no reabre una sesión cerrada', async () => {
  let complete;
  const h = setup(() => new Promise(resolve => { complete = resolve; }));
  h.resolve({ data: { session: { user: { id: 'A' }, access_token: 'A' } }, error: null });
  await settle();
  assert.equal(h.states.at(-1).status, 'checking');
  h.emit('SIGNED_OUT', null);
  complete({ data: { user: { id: 'A' } }, error: null });
  await settle();
  assert.equal(h.states.at(-1).status, 'ready');
  assert.equal(h.states.at(-1).session, null);
  h.stop();
});
