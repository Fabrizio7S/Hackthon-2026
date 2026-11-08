const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(fileName, extraGlobals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, fileName), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const sandbox = {
    exports: {},
    require: (id) => {
      if (id === './demo') return extraGlobals.demo;
      throw new Error(`Unexpected require: ${id}`);
    },
    ...extraGlobals,
  };
  vm.runInNewContext(code, sandbox);
  return sandbox.exports;
}

const demo = loadModule('demo.ts');
const service = loadModule('favorsService.ts', { demo });

test('updateRequests evita solicitudes duplicadas y solicitudes al propio recurso', () => {
  const initial = [];
  const selfReq = demo.updateRequests(initial, {
    type: 'request',
    actor: 'carlos',
    publicationId: 'taladro',
    requester: 'carlos',
  });
  assert.equal(selfReq.length, 0);

  const validReq = demo.updateRequests(initial, {
    type: 'request',
    actor: 'ana',
    publicationId: 'taladro',
    requester: 'ana',
  });
  assert.equal(validReq.length, 1);
  assert.equal(validReq[0].status, 'pending');

  const duplicateReq = demo.updateRequests(validReq, {
    type: 'request',
    actor: 'ana',
    publicationId: 'taladro',
    requester: 'ana',
  });
  assert.equal(duplicateReq.length, 1);
});

test('updateRequests al aceptar una solicitud cierra las competidoras (D25)', () => {
  let state = [];
  state = demo.updateRequests(state, { type: 'request', actor: 'ana', publicationId: 'taladro', requester: 'ana' });
  state = demo.updateRequests(state, { type: 'request', actor: 'luz', publicationId: 'taladro', requester: 'luz' });
  assert.equal(state.length, 2);

  state = demo.updateRequests(state, { type: 'accept', actor: 'carlos', publicationId: 'taladro', requester: 'ana' });
  const anaReq = state.find((r) => r.requester === 'ana');
  const luzReq = state.find((r) => r.requester === 'luz');
  assert.equal(anaReq.status, 'accepted');
  assert.equal(luzReq.status, 'closed');
  assert.equal(demo.publicationStatus(state, 'taladro'), 'En coordinación');
});

test('updateRequests solo permite finalizar al solicitante aceptado y soporta hidratación', () => {
  let state = [
    { publicationId: 'taladro', requester: 'ana', requesterId: 'u-1', status: 'accepted' },
  ];
  const wrongActor = demo.updateRequests(state, {
    type: 'finish',
    actor: 'carlos',
    publicationId: 'taladro',
    requester: 'ana',
    requesterId: 'u-1',
  });
  assert.equal(wrongActor[0].status, 'accepted');

  const finished = demo.updateRequests(state, {
    type: 'finish',
    actor: 'ana',
    publicationId: 'taladro',
    requester: 'ana',
    requesterId: 'u-1',
  });
  assert.equal(finished[0].status, 'finished');
  assert.equal(demo.publicationStatus(finished, 'taladro'), 'Terminada');

  const hydrated = demo.updateRequests(finished, {
    type: 'hydrate',
    requests: [{ publicationId: 'plantas', requester: 'ana', requesterId: 'u-1', requesterName: 'Kirito', status: 'pending' }],
  });
  assert.equal(hydrated.length, 1);
  assert.equal(hydrated[0].publicationId, 'plantas');
  assert.equal(hydrated[0].requesterName, 'Kirito');
});

test('updateRequests cumple reglas de cancelación D25 antes y durante la coordinación', () => {
  let state = [];
  state = demo.updateRequests(state, { type: 'request', actor: 'ana', publicationId: 'taladro', requester: 'ana' });

  // Antes de aceptar, un tercero no puede cancelar la solicitud de Ana
  const wrongCancel = demo.updateRequests(state, { type: 'cancel', actor: 'luz', publicationId: 'taladro', requester: 'ana' });
  assert.equal(wrongCancel[0].status, 'pending');

  // El solicitante sí puede cancelar su solicitud pendiente
  const requesterCancel = demo.updateRequests(state, { type: 'cancel', actor: 'ana', publicationId: 'taladro', requester: 'ana' });
  assert.equal(requesterCancel[0].status, 'closed');

  // Tras cancelar, el solicitante puede volver a solicitar si sigue disponible
  const reRequest = demo.updateRequests(requesterCancel, { type: 'request', actor: 'ana', publicationId: 'taladro', requester: 'ana' });
  assert.equal(reRequest[0].status, 'pending');

  // Durante la coordinación ('accepted'), tanto el dueño como el solicitante pueden cancelar
  const accepted = demo.updateRequests(reRequest, { type: 'accept', actor: 'carlos', publicationId: 'taladro', requester: 'ana' });
  assert.equal(accepted[0].status, 'accepted');

  const ownerCancel = demo.updateRequests(accepted, { type: 'cancel', actor: 'carlos', publicationId: 'taladro', requester: 'ana' });
  assert.equal(ownerCancel[0].status, 'closed');
  assert.equal(demo.publicationStatus(ownerCancel, 'taladro'), 'Disponible');
});

test('mapRowToPublication, mapRowToRequest y mapRowToReview asignan identidad del usuario autenticado', () => {
  const ownPub = service.mapRowToPublication({
    id: 'pub-1',
    community_id: 'com-1',
    owner_id: 'user-123',
    owner_key: 'ana',
    owner_name: 'Kirito',
    kind: 'Préstamo',
    title: 'Sierra eléctrica',
    description: 'Para cortar madera',
    location: 'En tu comunidad',
    terms: 'Coordinar por mensaje',
    symbol: '🪚',
    color: '#e5eddf',
    image_uri: null,
  }, 'user-123');

  assert.equal(ownPub.owner, 'ana');
  assert.equal(ownPub.ownerId, 'user-123');
  assert.equal(ownPub.ownerName, 'Kirito');

  const otherPub = service.mapRowToPublication({
    id: 'pub-2',
    community_id: 'com-1',
    owner_id: 'user-999',
    owner_key: 'carlos',
    owner_name: 'Carlos Salazar',
    kind: 'Intercambio',
    title: 'Libros',
    description: 'Cuentos',
    location: 'Zona A',
    terms: 'Por la tarde',
    symbol: '📚',
    color: '#e4ebf4',
    image_uri: null,
  }, 'user-123');

  assert.equal(otherPub.owner, 'carlos');
  assert.equal(otherPub.ownerName, 'Carlos Salazar');

  const mappedReq = service.mapRowToRequest({
    id: 'req-1',
    publication_id: 'pub-2',
    requester_id: 'user-123',
    requester_name: 'Kirito',
    status: 'pending',
  }, 'user-123');

  assert.equal(mappedReq.requester, 'ana');
  assert.equal(mappedReq.requesterId, 'user-123');
  assert.equal(mappedReq.requesterName, 'Kirito');

  const mappedRev = service.mapRowToReview({
    id: 'rev-1',
    publication_id: 'pub-2',
    target_owner_id: 'user-999',
    target_owner_key: 'carlos',
    author_id: 'user-123',
    author_name: 'Kirito',
    stars: 5,
    comment: 'Excelente vecino y préstamo puntual.',
  });

  assert.equal(mappedRev.author, 'Kirito');
  assert.equal(mappedRev.stars, 5);
  assert.equal(mappedRev.targetOwnerKey, 'carlos');
});
