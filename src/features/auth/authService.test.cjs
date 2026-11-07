const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Usa TypeScript ya instalado, sin añadir runner ni modificar configuración compartida.
const source = fs.readFileSync(path.join(__dirname, 'authService.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(compiled, sandbox);
const { createAuthService, validateCredentials, authErrorMessage } = sandbox.exports;

test('rechaza entradas inválidas antes de solicitar registro al backend', async () => {
  let calls = 0;
  const service = createAuthService({ auth: { signUp: async () => { calls++; } } });
  await assert.rejects(service.submit('signUp', 'correo-inválido', 'clave'));
  await assert.rejects(service.submit('signUp', 'vecino@example.com', ''));
  assert.equal(calls, 0);
  assert.equal(validateCredentials(' vecino@example.com ', 'clave'), null);
});

test('normaliza espacios del correo sin modificar la contraseña', async () => {
  let received;
  const service = createAuthService({ auth: { signInWithPassword: async (credentials) => {
    received = credentials;
    return { data: { session: { user: { id: 'test' } } }, error: null };
  } } });
  const session = await service.submit('signIn', ' vecino@example.com ', ' clave ');
  assert.equal(received.email, 'vecino@example.com');
  assert.equal(received.password, ' clave ');
  assert.equal(session.user.id, 'test');
});

test('un registro pendiente de confirmación no se convierte en sesión', async () => {
  const service = createAuthService({ auth: { signUp: async () => ({
    data: { user: { id: 'test' }, session: null }, error: null,
  }) } });
  assert.equal(await service.submit('signUp', 'vecino@example.com', 'clave'), null);
});

test('bloquea solicitudes simultáneas y libera el bloqueo tras un fallo', async () => {
  let finish;
  let calls = 0;
  const failure = { code: 'invalid_credentials' };
  const service = createAuthService({ auth: { signInWithPassword: () => {
    calls++;
    return new Promise(resolve => { finish = resolve; });
  } } });
  const first = service.submit('signIn', 'vecino@example.com', 'clave');
  await assert.rejects(service.submit('signIn', 'vecino@example.com', 'clave'), error => error.code === 'auth_busy');
  assert.equal(calls, 1);
  finish({ data: {}, error: failure });
  await assert.rejects(first, error => error === failure);
  const retry = service.submit('signIn', 'vecino@example.com', 'clave');
  assert.equal(calls, 2);
  finish({ data: { session: null }, error: null });
  await retry;
});

test('el cierre usa alcance local y propaga errores para permitir reintento', async () => {
  let scope;
  const failure = { code: 'network_error' };
  const service = createAuthService({ auth: { signOut: async options => {
    scope = options.scope;
    return { error: failure };
  } } });
  await assert.rejects(service.signOut(), error => error === failure);
  assert.equal(scope, 'local');
});

test('no expone mensajes internos del servicio en la interfaz', () => {
  const message = authErrorMessage({ message: 'internal diagnostic', code: 'unknown' });
  assert.equal(message.includes('internal diagnostic'), false);
  assert.match(authErrorMessage({ code: 'email_not_confirmed' }), /Confirma tu correo/);
});
