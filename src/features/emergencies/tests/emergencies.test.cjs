const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Los objetos creados dentro de vm tienen otros prototipos: se comparan como datos planos.
const plain = (value) => JSON.parse(JSON.stringify(value));
const same = (actual, expected) => assert.deepStrictEqual(plain(actual), plain(expected));

// Carga módulos TypeScript del directorio (solo lógica pura, sin React Native) resolviendo imports relativos.
const { createTypeScriptLoader } = require('../../../../tests/helpers/loadTypeScript.cjs');
const load = createTypeScriptLoader({ baseDir: __dirname, globals: { console } });

const { mapEmergencyError, isRetryableLater, emergencyError } = load('../model/errors');
const { parseEmergency, parseFeed, parseEmergencyDetail, parseSupportDirectory, parseCreated } =
  load('../data/mappers');
const logic = load('../model/logic');
const { createOutbox } = load('../data/outbox');
const { submitNewReport, retryEntry, flushPending } = load('../data/submitReport');
const { toEmergencyMapPoints, toResourceMapPoints } = load('../model/mapPoints');

function memoryStorage() {
  const data = new Map();
  return {
    data,
    getItem: async (k) => (data.has(k) ? data.get(k) : null),
    setItem: async (k, v) => {
      data.set(k, v);
    },
    removeItem: async (k) => {
      data.delete(k);
    },
  };
}

const emergency = (over = {}) => ({
  id: 'e1',
  category: 'agua',
  level: 'alta',
  status: 'abierta',
  description: 'Sin agua',
  vulnerable: false,
  restricted: false,
  lat: -12.05,
  lng: -77.04,
  locationOrigin: 'dispositivo',
  approximate: false,
  mine: false,
  authorName: 'Ana',
  canManage: false,
  offersCount: 0,
  acceptedCount: 0,
  myOffer: null,
  isDemo: false,
  createdAt: '2026-11-07T10:00:00Z',
  updatedAt: '2026-11-07T10:00:00Z',
  attendedAt: null,
  closedAt: null,
  ...over,
});

const report = (over = {}) => ({
  category: 'agua',
  level: 'alta',
  description: 'No hay agua en la cuadra',
  vulnerable: false,
  lat: -12.05,
  lng: -77.04,
  locationOrigin: 'dispositivo',
  clientRequestId: 'req-1',
  ...over,
});

// ---------- errores ----------

test('mapEmergencyError traduce códigos del backend y oculta mensajes técnicos', () => {
  assert.equal(
    mapEmergencyError({ code: '42501', message: 'Debes iniciar sesión' }).kind,
    'sin_sesion',
  );
  assert.equal(
    mapEmergencyError({ code: '42501', message: 'Debes pertenecer a una comunidad' }).kind,
    'sin_comunidad',
  );
  const denied = mapEmergencyError({
    code: '42501',
    message: 'Solo el autor o el representante pueden hacerlo',
  });
  assert.equal(denied.kind, 'sin_permiso');
  assert.match(denied.message, /autor o el representante/);
  assert.equal(
    mapEmergencyError({ code: '22023', message: 'Descripción muy corta' }).kind,
    'validacion',
  );
  assert.equal(
    mapEmergencyError({ code: 'P0001', message: 'No se puede pasar de solucionado a abierta' })
      .kind,
    'conflicto',
  );
  assert.equal(
    mapEmergencyError({ code: 'P0002', message: 'El reporte ya no está disponible' }).kind,
    'no_encontrado',
  );
  const technical = mapEmergencyError({
    code: '42501',
    message: 'permission denied for table emergencias',
  });
  assert.doesNotMatch(technical.message, /permission denied/);
  assert.equal(
    mapEmergencyError({ code: 'PGRST202', message: 'Could not find the function' }).kind,
    'sin_configuracion',
  );
  assert.equal(mapEmergencyError({ message: 'Network request failed' }).kind, 'conexion');
  assert.equal(mapEmergencyError(null).kind, 'desconocido');
});

test('solo conexión y sesión se reintentan más tarde', () => {
  assert.equal(isRetryableLater(emergencyError('conexion')), true);
  assert.equal(isRetryableLater(emergencyError('sin_sesion')), true);
  assert.equal(isRetryableLater(emergencyError('validacion')), false);
  assert.equal(isRetryableLater(emergencyError('sin_permiso')), false);
});

// ---------- mapeadores ----------

test('el mensaje SOS identifica al autor en alertas, detalle y mapa', () => {
  for (const name of ['María Pérez', 'José Díaz']) {
    const raw = {
      id: 'sos',
      descripcion: '¡ALERTA SOS! Solicitud de auxilio urgente en el sector.',
      autor_nombre: ` ${name} `,
      lat: -12.05,
      lng: -77.04,
    };
    const expected = `¡ALERTA SOS! ${name} solicita auxilio urgente en el sector.`;
    const feed = parseFeed({ community_id: 'c1', community_name: 'Barrio', items: [raw] });
    assert.equal(feed.items[0].description, expected);
    assert.equal(parseEmergencyDetail(raw).description, expected);
    assert.equal(toEmergencyMapPoints(feed.items)[0].descripcion, expected);
  }
});

test('SOS sin nombre conserva el mensaje y no personaliza reportes restringidos ni ordinarios', () => {
  const description = '¡ALERTA SOS! Solicitud de auxilio urgente en el sector.';
  for (const name of [null, '', '   ']) {
    assert.equal(
      parseEmergency({ id: 'sos', descripcion: description, autor_nombre: name }).description,
      description,
    );
  }
  assert.equal(
    parseEmergency({
      id: 'sos',
      descripcion: description,
      autor_nombre: 'Ana',
      detalle_restringido: true,
    }).description,
    description,
  );
  assert.equal(
    parseEmergency({ id: 'normal', descripcion: 'Sin agua', autor_nombre: 'Ana' }).description,
    'Sin agua',
  );
});

test('parseEmergency es defensivo con valores desconocidos y conserva la privacidad', () => {
  const e = parseEmergency({
    id: 'x',
    categoria: 'inventada',
    nivel: '???',
    estado: 'rara',
    descripcion: null,
    detalle_restringido: true,
    es_persona_vulnerable: true,
    lat: 'no',
    lng: null,
    apoyos_ofrecidos: '3',
    creado_en: '2026-11-07T10:00:00Z',
  });
  assert.equal(e.category, 'otro');
  assert.equal(e.level, 'media');
  assert.equal(e.status, 'abierta');
  assert.equal(e.description, null);
  assert.equal(e.restricted, true);
  assert.equal(e.lat, null);
  assert.equal(e.offersCount, 3);
  assert.equal(e.myOffer, null);
});

test('parseEmergency marca aproximada la ubicación tomada de la zona', () => {
  const e = parseEmergency({
    id: 'x',
    ubicacion_origen: 'zona_comunidad',
    creado_en: '2026-11-07T10:00:00Z',
  });
  assert.equal(e.approximate, true);
});

test('parseFeed y parseSupportDirectory exigen la comunidad y degradan listas', () => {
  assert.throws(() => parseFeed({ items: [] }));
  const feed = parseFeed({
    community_id: 'c1',
    community_name: 'Norte',
    zona: { lat: -12, lng: -77, nombre: 'Z' },
    soy_representante: true,
    items: [{ id: 'a', creado_en: 'x' }],
  });
  assert.equal(feed.items.length, 1);
  assert.equal(feed.isRepresentative, true);
  same(feed.zone, { lat: -12, lng: -77, name: 'Z' });
  const dir = parseSupportDirectory({
    community_id: 'c1',
    recursos: [{ id: 'r', tipo: 'raro', disponible: true, es_demo: true }],
    grupos: [{ id: 'g', integrantes: 2 }],
  });
  assert.equal(dir.resources[0].type, 'otro');
  assert.equal(dir.resources[0].isDemo, true);
  assert.equal(dir.groups[0].active, true);
  assert.equal(dir.groups[0].members, 2);
  assert.throws(() => parseSupportDirectory(null));
});

test('parseEmergencyDetail incluye los ofrecimientos y parseCreated el indicador de duplicado', () => {
  const d = parseEmergencyDetail({
    id: 'e',
    creado_en: 'x',
    apoyos: [
      {
        id: 'a1',
        ayudante_id: 'u',
        ayudante_nombre: 'Luz',
        nota: 'Voy',
        estado: 'aceptado',
        es_mio: false,
        creado_en: 'x',
      },
    ],
  });
  assert.equal(d.offers.length, 1);
  assert.equal(d.offers[0].status, 'aceptado');
  same(parseCreated({ id: 'n', duplicado: true }), { id: 'n', duplicate: true });
  same(parseCreated({ id: 'n' }), { id: 'n', duplicate: false });
});

// ---------- lógica ----------

test('sortEmergencies ordena por estado, urgencia y fecha', () => {
  const sorted = logic.sortEmergencies([
    emergency({ id: 'cerrada', status: 'solucionado', level: 'critica' }),
    emergency({ id: 'media', level: 'media' }),
    emergency({ id: 'critica-vieja', level: 'critica', createdAt: '2026-11-06T10:00:00Z' }),
    emergency({ id: 'critica-nueva', level: 'critica' }),
    emergency({ id: 'atencion', status: 'en_atencion', level: 'critica' }),
  ]);
  same(
    sorted.map((e) => e.id),
    ['critica-nueva', 'critica-vieja', 'media', 'atencion', 'cerrada'],
  );
});

test('filterByStatus y countByStatus distinguen abiertas, en atención y solucionadas', () => {
  const items = [
    emergency({ id: '1' }),
    emergency({ id: '2', status: 'en_atencion' }),
    emergency({ id: '3', status: 'solucionado' }),
    emergency({ id: '4' }),
  ];
  same(logic.countByStatus(items), { todas: 4, abierta: 2, en_atencion: 1, solucionado: 1 });
  same(
    logic.filterByStatus(items, 'abierta').map((e) => e.id),
    ['1', '4'],
  );
  assert.equal(logic.filterByStatus(items, 'todas').length, 4);
});

test('nextStatuses refleja las transiciones permitidas y nada para quien no gestiona', () => {
  same(logic.nextStatuses('abierta', false), []);
  same(
    logic.nextStatuses('abierta', true).map((a) => a.to),
    ['en_atencion', 'solucionado'],
  );
  same(
    logic.nextStatuses('en_atencion', true).map((a) => a.to),
    ['solucionado', 'abierta'],
  );
  same(logic.nextStatuses('solucionado', true), []);
  assert.ok(logic.nextStatuses('abierta', true).find((a) => a.to === 'solucionado').confirm);
});

test('resolveReportLocation prefiere el dispositivo, cae a la zona y nunca inventa', () => {
  const zone = { lat: -12.1, lng: -77.0, name: 'Z' };
  same(logic.resolveReportLocation({ latitude: -12.05, longitude: -77.04 }, zone), {
    lat: -12.05,
    lng: -77.04,
    origin: 'dispositivo',
  });
  same(logic.resolveReportLocation(null, zone), {
    lat: -12.1,
    lng: -77.0,
    origin: 'zona_comunidad',
  });
  assert.equal(logic.resolveReportLocation(null, { lat: null, lng: null, name: null }), null);
  assert.equal(logic.resolveReportLocation({ latitude: 0, longitude: 0 }, null), null);
  assert.equal(logic.resolveReportLocation({ latitude: 200, longitude: 0 }, null), null);
});

test('validateReport exige campos y recorta la descripción', () => {
  const location = { lat: -12, lng: -77, origin: 'dispositivo' };
  const empty = logic.validateReport(
    { category: null, level: null, description: ' a ', vulnerable: false },
    null,
  );
  assert.equal(empty.ok, false);
  same(Object.keys(empty.errors).sort(), ['category', 'description', 'level', 'location']);
  const long = logic.validateReport(
    { category: 'agua', level: 'alta', description: 'x'.repeat(501), vulnerable: false },
    location,
  );
  assert.equal(long.ok, false);
  assert.ok(long.errors.description);
  const ok = logic.validateReport(
    { category: 'agua', level: 'alta', description: '  Sin agua en la calle  ', vulnerable: true },
    location,
  );
  assert.equal(ok.ok, true);
  assert.equal(ok.report.description, 'Sin agua en la calle');
  assert.equal(ok.report.vulnerable, true);
  assert.equal(ok.report.locationOrigin, 'dispositivo');
  assert.equal('clientRequestId' in ok.report, false);
});

test('validateNote limita la nota a 200 caracteres', () => {
  assert.equal(logic.validateNote('ok'), null);
  assert.ok(logic.validateNote('x'.repeat(201)));
});

test('formatRelative da textos legibles y tolera fechas inválidas', () => {
  const now = Date.parse('2026-11-07T12:00:00Z');
  assert.equal(logic.formatRelative('2026-11-07T11:59:40Z', now), 'justo ahora');
  assert.equal(logic.formatRelative('2026-11-07T11:30:00Z', now), 'hace 30 min');
  assert.equal(logic.formatRelative('2026-11-07T09:00:00Z', now), 'hace 3 h');
  assert.equal(logic.formatRelative('2026-11-06T09:00:00Z', now), 'ayer');
  assert.equal(logic.formatRelative('2026-11-04T09:00:00Z', now), 'hace 3 días');
  assert.equal(logic.formatRelative('no-fecha', now), '');
});

// ---------- cola local y envío ----------

test('submitNewReport confirma «enviado» solo si el servidor responde y limpia la cola', async () => {
  const storage = memoryStorage();
  const outbox = createOutbox(storage, 'u1');
  const api = { createReport: async () => ({ ok: true, data: { id: 'new', duplicate: false } }) };
  const outcome = await submitNewReport({ api, outbox }, report());
  same({ ...outcome }, { state: 'enviado', id: 'new', duplicate: false });
  assert.equal((await outbox.list()).length, 0);
});

test('sin conexión el reporte queda pendiente, guardado, y NO se informa como enviado', async () => {
  const storage = memoryStorage();
  const outbox = createOutbox(storage, 'u1');
  const api = { createReport: async () => ({ ok: false, error: emergencyError('conexion') }) };
  const outcome = await submitNewReport({ api, outbox }, report());
  assert.equal(outcome.state, 'pendiente');
  assert.equal(outcome.saved, true);
  const [entry] = await outbox.list();
  assert.equal(entry.status, 'pendiente');
  assert.equal(entry.attempts, 1);
  assert.equal(entry.clientRequestId, 'req-1');
});

test('el rechazo del servidor deja la entrada con error y no como pendiente', async () => {
  const outbox = createOutbox(memoryStorage(), 'u1');
  const api = {
    createReport: async () => ({
      ok: false,
      error: emergencyError('validacion', 'Descripción muy corta'),
    }),
  };
  const outcome = await submitNewReport({ api, outbox }, report());
  assert.equal(outcome.state, 'error');
  assert.equal((await outbox.list())[0].status, 'error');
});

test('el reintento reutiliza el mismo identificador y el duplicado se reconoce', async () => {
  const outbox = createOutbox(memoryStorage(), 'u1');
  const seen = [];
  let online = false;
  const api = {
    createReport: async (r) => {
      seen.push(r.clientRequestId);
      return online
        ? { ok: true, data: { id: 'e', duplicate: seen.length > 2 } }
        : { ok: false, error: emergencyError('conexion') };
    },
  };
  await submitNewReport({ api, outbox }, report());
  online = true;
  const [entry] = await outbox.list();
  const retried = await retryEntry({ api, outbox }, entry);
  assert.equal(retried.state, 'enviado');
  same(seen, ['req-1', 'req-1']);
  assert.equal((await outbox.list()).length, 0);
});

test('flushPending envía lo pendiente, deja el error de validación y se detiene sin conexión', async () => {
  const outbox = createOutbox(memoryStorage(), 'u1');
  const base = { attempts: 0, savedAt: '2026-11-07T10:00:00Z', lastError: null };
  await outbox.upsert({
    ...base,
    clientRequestId: 'a',
    report: report({ clientRequestId: 'a' }),
    status: 'pendiente',
  });
  await outbox.upsert({
    ...base,
    clientRequestId: 'b',
    report: report({ clientRequestId: 'b' }),
    status: 'error',
  });
  await outbox.upsert({
    ...base,
    clientRequestId: 'c',
    report: report({ clientRequestId: 'c' }),
    status: 'pendiente',
  });
  const calls = [];
  const api = {
    createReport: async (r) => {
      calls.push(r.clientRequestId);
      return r.clientRequestId === 'a'
        ? { ok: true, data: { id: '1', duplicate: false } }
        : { ok: false, error: emergencyError('conexion') };
    },
  };
  const results = await flushPending({ api, outbox });
  same(calls, ['a', 'c']);
  assert.equal(results.length, 2);
  const left = await outbox.list();
  same(left.map((e) => e.clientRequestId).sort(), ['b', 'c']);
});

test('recover devuelve a pendiente lo que quedó «enviando» al cerrar la app', async () => {
  const outbox = createOutbox(memoryStorage(), 'u1');
  await outbox.upsert({
    clientRequestId: 'a',
    report: report({ clientRequestId: 'a' }),
    status: 'enviando',
    attempts: 1,
    savedAt: 'x',
    lastError: null,
  });
  await outbox.recover();
  assert.equal((await outbox.list())[0].status, 'pendiente');
});

test('la cola es por usuario y descarta datos corruptos', async () => {
  const storage = memoryStorage();
  const a = createOutbox(storage, 'ana');
  const b = createOutbox(storage, 'beto');
  await a.upsert({
    clientRequestId: 'a',
    report: report({ clientRequestId: 'a' }),
    status: 'pendiente',
    attempts: 0,
    savedAt: 'x',
    lastError: null,
  });
  assert.equal((await b.list()).length, 0);
  storage.data.set('emergencias.salida.v1:ana', '{no json');
  same(await a.list(), []);
  storage.data.set(
    'emergencias.salida.v1:ana',
    JSON.stringify([{ clientRequestId: 'z', status: 'inventado' }]),
  );
  same(await a.list(), []);
});

test('si el teléfono no puede guardar, el envío sigue pero se avisa que no quedó guardado', async () => {
  const brokenStorage = {
    getItem: async () => null,
    setItem: async () => {
      throw new Error('lleno');
    },
    removeItem: async () => {},
  };
  const outbox = createOutbox(brokenStorage, 'u1');
  const offline = { createReport: async () => ({ ok: false, error: emergencyError('conexion') }) };
  const outcome = await submitNewReport({ api: offline, outbox }, report());
  assert.equal(outcome.state, 'pendiente');
  assert.equal(outcome.saved, false);
});

// ---------- mapa ----------

test('toEmergencyMapPoints omite cerradas y sin coordenadas, y respeta la privacidad', () => {
  const points = toEmergencyMapPoints([
    emergency({ id: 'ok' }),
    emergency({ id: 'cerrada', status: 'solucionado' }),
    emergency({ id: 'sin-coords', lat: null, lng: null }),
    emergency({ id: 'cero', lat: 0, lng: 0 }),
    emergency({ id: 'reservada', restricted: true, description: null, approximate: true }),
  ]);
  same(
    points.map((p) => p.id),
    ['ok', 'reservada'],
  );
  assert.equal(points[1].descripcion, 'Detalle reservado por privacidad');
  assert.equal(points[1].aproximada, true);
  assert.equal(
    toEmergencyMapPoints([emergency({ status: 'solucionado' })], { includeClosed: true }).length,
    1,
  );
});

test('toResourceMapPoints no marca como disponible un recurso de demostración', () => {
  const base = {
    id: 'r',
    type: 'agua',
    name: 'Tanque',
    place: 'Plaza',
    detail: '',
    lat: -12,
    lng: -77,
    available: true,
    isDemo: false,
    registeredBy: 'Rep',
    updatedAt: 'x',
  };
  const [real] = toResourceMapPoints([base]);
  assert.equal(real.disponible, true);
  const [demo] = toResourceMapPoints([{ ...base, id: 'd', isDemo: true }]);
  assert.equal(demo.disponible, false);
  assert.equal(demo.esDemo, true);
  assert.equal(toResourceMapPoints([{ ...base, lat: null, lng: null }]).length, 0);
});
