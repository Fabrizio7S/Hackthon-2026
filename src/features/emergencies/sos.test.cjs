const test = require('node:test');
const assert = require('node:assert/strict');

test('la alerta SOS requiere una ubicacion valida y genera reporte critico de salud', () => {
  function isValidCoordinate(lat, lng) {
    return (
      typeof lat === 'number' && typeof lng === 'number' &&
      Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
      !(lat === 0 && lng === 0)
    );
  }

  function resolveReportLocation(device, zone) {
    if (device && isValidCoordinate(device.latitude, device.longitude)) {
      return { lat: device.latitude, lng: device.longitude, origin: 'dispositivo' };
    }
    if (zone && isValidCoordinate(zone.lat, zone.lng)) {
      return { lat: zone.lat, lng: zone.lng, origin: 'zona_comunidad' };
    }
    return null;
  }

  function createSosReport(device, zone, clientRequestId) {
    const loc = resolveReportLocation(device, zone);
    if (!loc) {
      return { ok: false, error: 'Ubicacion requerida para alerta SOS' };
    }
    return {
      ok: true,
      report: {
        category: 'salud',
        level: 'critica',
        description: '¡ALERTA SOS! Solicitud de auxilio urgente en el sector.',
        vulnerable: false,
        lat: loc.lat,
        lng: loc.lng,
        locationOrigin: loc.origin,
        clientRequestId,
      },
    };
  }

  // 1. Sin ubicación falla de manera defensiva
  const sinUbicacion = createSosReport(null, null, 'req-1');
  assert.equal(sinUbicacion.ok, false);
  assert.equal(sinUbicacion.error, 'Ubicacion requerida para alerta SOS');

  // 2. Con zona comunitaria genera reporte con origen zona_comunidad
  const conZona = createSosReport(null, { lat: -12.0464, lng: -77.0428 }, 'req-2');
  assert.equal(conZona.ok, true);
  assert.equal(conZona.report.category, 'salud');
  assert.equal(conZona.report.level, 'critica');
  assert.equal(conZona.report.locationOrigin, 'zona_comunidad');
  assert.equal(conZona.report.lat, -12.0464);

  // 3. Con GPS del dispositivo prefiere el dispositivo
  const conGps = createSosReport(
    { latitude: -12.0500, longitude: -77.0400 },
    { lat: -12.0464, lng: -77.0428 },
    'req-3'
  );
  assert.equal(conGps.ok, true);
  assert.equal(conGps.report.locationOrigin, 'dispositivo');
  assert.equal(conGps.report.lat, -12.0500);
  assert.equal(conGps.report.lng, -77.0400);
});
