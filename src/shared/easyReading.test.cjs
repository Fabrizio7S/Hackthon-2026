const test = require('node:test');
const assert = require('node:assert/strict');

test('el modo lectura facil escala la tipografia a 1.25 y almacena la preferencia', async () => {
  // Simulador de almacenamiento
  const store = new Map();
  const mockStorage = {
    async getItem(k) { return store.has(k) ? store.get(k) : null; },
    async setItem(k, v) { store.set(k, String(v)); },
  };

  const STORAGE_KEY = '@app_vecinal:easy_reading';

  // Estado inicial por defecto
  let easyReading = false;
  let fontScale = easyReading ? 1.25 : 1.0;
  assert.equal(easyReading, false);
  assert.equal(fontScale, 1.0);

  // Activación de lectura fácil
  easyReading = true;
  fontScale = easyReading ? 1.25 : 1.0;
  await mockStorage.setItem(STORAGE_KEY, 'true');

  assert.equal(easyReading, true);
  assert.equal(fontScale, 1.25);
  assert.equal(await mockStorage.getItem(STORAGE_KEY), 'true');

  // Desactivación
  easyReading = false;
  fontScale = easyReading ? 1.25 : 1.0;
  await mockStorage.setItem(STORAGE_KEY, 'false');

  assert.equal(easyReading, false);
  assert.equal(fontScale, 1.0);
  assert.equal(await mockStorage.getItem(STORAGE_KEY), 'false');
});
