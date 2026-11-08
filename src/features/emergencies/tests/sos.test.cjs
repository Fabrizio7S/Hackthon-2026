const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Componentes reales, con hooks/GPS/red controlados. No sustituye probar en telefono.
function harness({ device = null, zone = null, outcome = { state: 'enviado' } } = {}) {
  const submitted = [],
    states = [],
    timers = [];
  const react = {
    useState: (value) => {
      const index = states.push(value) - 1;
      return [
        value,
        (next) => {
          states[index] = next;
        },
      ];
    },
    useRef: (current) => ({ current }),
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
    useEffect: () => {},
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
  };
  const animation = { setValue() {}, interpolate() {}, start() {} };
  const mocks = {
    react,
    'react-native': {
      View: 'View',
      Text: 'Text',
      Pressable: 'Pressable',
      StyleSheet: { create: (value) => value },
      Platform: { OS: 'web' },
      Animated: {
        Value: function () {
          return animation;
        },
        timing: () => animation,
      },
    },
    '@react-native-async-storage/async-storage': {},
    '../../../shared/theme': { colors: {} },
    '../../../shared/ui/AppIcon': { AppIcon: 'AppIcon' },
    '../../../shared/ui/tour/TourTargets': { useTourTargets: () => () => false },
    '../../../shared/location/useUbicacion': { useUbicacion: () => ({ ubicacion: device }) },
    '../screens/AlertsScreen': { AlertsScreen: 'AlertsScreen' },
    '../screens/EmergencyDetailScreen': {},
    '../screens/ReportScreen': {},
    '../screens/SupportScreen': {},
    '../data/emergenciesApi': { newClientRequestId: () => 'sos-request' },
    '../hooks': {
      useResource: () => ({ state: { data: { zone } }, reload: async () => {} }),
      useReportOutbox: () => ({
        entries: [],
        submit: async (report) => {
          submitted.push(report);
          return outcome;
        },
      }),
    },
  };
  const { createTypeScriptLoader } = require('../../../../tests/helpers/loadTypeScript.cjs');
  mocks['../hooks/useResource'] = mocks['../hooks'];
  mocks['../hooks/useReportOutbox'] = mocks['../hooks'];
  const loadSource = createTypeScriptLoader({
    baseDir: __dirname,
    mocks,
    jsx: ts.JsxEmit.React,
    globals: {
      React: react,
      setTimeout: (fn) => {
        timers.push(fn);
        return 1;
      },
      clearTimeout() {},
    },
  });
  const aliases = {
    EmergenciesScreen: '../screens/EmergenciesScreen',
    SosButton: '../components/SosButton',
    mapPoints: '../model/mapPoints',
  };
  const load = (name) => loadSource(aliases[name] ?? name);
  function find(node, type) {
    if (!node || typeof node !== 'object') return null;
    if (node.type === type) return node;
    return (node.props?.children ?? [])
      .flat(Infinity)
      .map((child) => find(child, type))
      .find(Boolean);
  }
  const screen = load('EmergenciesScreen').EmergenciesScreen({
    client: null,
    userId: 'neighbor',
    api: {},
  });
  return {
    load,
    find,
    submitted,
    states,
    timers,
    trigger: find(screen, 'AlertsScreen').props.onTriggerSos,
  };
}

test('SOS obtiene el GPS sin prop y conserva sus coordenadas hasta el adaptador del mapa', async () => {
  const h = harness({
    device: { latitude: -12.05, longitude: -77.04 },
    zone: { lat: -12.1, lng: -77.1 },
  });
  assert.equal((await h.trigger()).ok, true);
  assert.equal(h.submitted[0].locationOrigin, 'dispositivo');
  assert.equal(h.submitted[0].level, 'critica');
  const points = h.load('mapPoints').toEmergencyMapPoints([
    {
      ...h.submitted[0],
      id: 'sos',
      status: 'abierta',
      approximate: false,
    },
  ]);
  assert.equal(points.length, 1);
  assert.equal(points[0].latitud, -12.05);
  assert.equal(points[0].longitud, -77.04);
});

test('SOS informa respaldo aproximado y no envia sin ninguna ubicacion', async () => {
  const withZone = harness({ zone: { lat: -12.1, lng: -77.1 } });
  assert.match((await withZone.trigger()).message, /aproximada/);
  assert.equal(withZone.submitted[0].locationOrigin, 'zona_comunidad');
  const missing = harness();
  assert.equal((await missing.trigger()).ok, false);
  assert.equal(missing.submitted.length, 0);
});

test('SOS distingue pendiente guardado, fallo de almacenamiento y rechazo', async () => {
  for (const saved of [true, false]) {
    const h = harness({
      device: { latitude: -12.05, longitude: -77.04 },
      outcome: { state: 'pendiente', saved },
    });
    const result = await h.trigger();
    assert.equal(result.ok, false);
    assert.match(result.message, saved ? /pendiente de envío/ : /ni pudo guardarse/);
  }
  const h = harness({
    zone: { lat: -12.1, lng: -77.1 },
    outcome: { state: 'error', error: { message: 'Sin permisos' } },
  });
  assert.equal((await h.trigger()).ok, false);
});

test('el boton muestra como error un fallo y como exito solo un envio confirmado', async () => {
  for (const ok of [false, true]) {
    const h = harness(),
      offset = h.states.length;
    const button = h
      .load('SosButton')
      .SosButton({ onTriggerSos: async () => ({ ok, message: 'Resultado' }) });
    h.find(button, 'Pressable').props.onPressIn();
    await h.timers[0]();
    assert.equal(h.states[offset + 2], ok ? 'Resultado' : null);
    assert.equal(h.states[offset + 3], ok ? null : 'Resultado');
  }
});
