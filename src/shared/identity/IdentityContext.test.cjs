const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const source = fs.readFileSync(path.join(__dirname, './IdentityContext.tsx'), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
  },
}).outputText;
const sandbox = { exports: {}, require };
vm.runInNewContext(code, sandbox);
const {
  SessionIdentityProvider,
  CommunityIdentityProvider,
  useSessionIdentity,
  useSessionActions,
  useCommunityIdentity,
  useCommunityActions,
} = sandbox.exports;

test('consumidores leen las fuentes provistas y reutilizan las mismas acciones', async () => {
  const session = { status: 'authenticated', user: { id: 'A' }, error: null };
  const community = {
    status: 'withoutCommunity',
    userId: 'A',
    community: null,
    membership: null,
    hasProfile: true,
    canCreateCommunity: false,
    canInviteNeighbors: false,
    error: null,
  };
  let closes = 0,
    refreshes = 0;
  const sessionActions = {
    signOut: async () => {
      closes++;
      return true;
    },
    retry: () => {},
  };
  const communityActions = {
    refresh: () => {
      refreshes++;
    },
  };
  let receivedSessionActions, receivedCommunityActions;
  function Consumer() {
    assert.equal(useSessionIdentity(), session);
    assert.equal(useCommunityIdentity(), community);
    receivedSessionActions = useSessionActions();
    receivedCommunityActions = useCommunityActions();
    return React.createElement('span', null, useSessionIdentity().user.id);
  }
  const html = renderToStaticMarkup(
    React.createElement(
      SessionIdentityProvider,
      { value: session, actions: sessionActions },
      React.createElement(
        CommunityIdentityProvider,
        { value: community, actions: communityActions },
        React.createElement(Consumer),
      ),
    ),
  );
  assert.equal(html, '<span>A</span>');
  assert.equal(receivedSessionActions, sessionActions);
  assert.equal(receivedCommunityActions, communityActions);
  assert.equal(await receivedSessionActions.signOut(), true);
  receivedCommunityActions.refresh();
  assert.equal(closes, 1);
  assert.equal(refreshes, 1);
});

test('sin proveedor los hooks no inventan usuario ni comunidad', () => {
  for (const [hook, providerName] of [
    [useSessionIdentity, 'SessionIdentityProvider'],
    [useSessionActions, 'SessionIdentityProvider'],
    [useCommunityIdentity, 'CommunityIdentityProvider'],
    [useCommunityActions, 'CommunityIdentityProvider'],
  ]) {
    function Consumer() {
      hook();
      return null;
    }
    assert.throws(
      () => renderToStaticMarkup(React.createElement(Consumer)),
      (error) => error.message.includes(providerName),
    );
  }
});

test('un nuevo alcance de sesión no recibe valores de la cuenta anterior', () => {
  function Consumer() {
    const session = useSessionIdentity();
    return React.createElement('span', null, session.user?.id ?? session.status);
  }
  const actions = { signOut: async () => true, retry: () => {} };
  const render = (value) =>
    renderToStaticMarkup(
      React.createElement(
        SessionIdentityProvider,
        { value, actions },
        React.createElement(Consumer),
      ),
    );
  assert.equal(
    render({ status: 'authenticated', user: { id: 'A' }, error: null }),
    '<span>A</span>',
  );
  assert.equal(render({ status: 'signedOut', user: null, error: null }), '<span>signedOut</span>');
  assert.equal(
    render({ status: 'authenticated', user: { id: 'B' }, error: null }),
    '<span>B</span>',
  );
});
