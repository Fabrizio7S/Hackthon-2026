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

function setup() {
  let callback, resolve, reject;
  let unsubscribed = 0;
  const states = [];
  const initial = new Promise((yes, no) => { resolve = yes; reject = no; });
  const client = { auth: {
    getSession: () => initial,
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
  for (const session of [null, { user: { id: 'A' } }]) {
    const h = setup();
    h.resolve({ data: { session }, error: null });
    await settle();
    assert.equal(h.states.length, 1);
    assert.equal(h.states[0].status, 'ready');
    assert.equal(h.states[0].session, session);
    h.stop();
  }
});

test('un cierre posterior gana a la lectura inicial atrasada', async () => {
  const h = setup();
  h.emit('SIGNED_OUT', null);
  h.resolve({ data: { session: { user: { id: 'A' } } }, error: null });
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
  const next = { user: { id: 'B' } };
  h.emit('SIGNED_IN', next);
  const refreshed = { user: { id: 'B' }, access_token: 'simulated-token' };
  h.emit('TOKEN_REFRESHED', refreshed);
  assert.equal(h.states[1].session, null);
  assert.equal(h.states[2].session, next);
  assert.equal(h.states[3].session, refreshed);
  h.stop();
});
