// Cálculo y formato de la distancia entre el vecino y una oferta («0.4 km»).
// Lógica pura, sin dependencias, para poder probarla aparte.

/**
 * Forma mínima de una ubicación, igual a la de `expo-location`.
 * Provisional hasta que Persona 5 publique el contrato de ubicación.
 */
export type Coordinates = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;

/**
 * Comprueba que la ubicación existe y está dentro de rangos reales.
 * (0, 0) se descarta porque suele ser un valor por defecto, no una ubicación real.
 */
export function isValidCoordinates(c: Coordinates | null | undefined): c is Coordinates {
  if (!c) return false;
  const { latitude, longitude } = c;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return false;
  return !(latitude === 0 && longitude === 0);
}

/** Distancia en línea recta (fórmula del haversine), en kilómetros. */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Texto de distancia para mostrar, o `null` si falta alguna ubicación válida.
 * Con `null` la pantalla no debe mostrar distancia: nunca se inventa una.
 * - Menos de 100 m: «A menos de 100 m».
 * - Menos de 10 km: un decimal, p. ej. «0.4 km».
 * - Desde 10 km: sin decimales, p. ej. «12 km».
 */
export function formatDistance(
  from: Coordinates | null | undefined,
  to: Coordinates | null | undefined,
): string | null {
  if (!isValidCoordinates(from) || !isValidCoordinates(to)) return null;
  const km = distanceKm(from, to);
  if (km < 0.1) return 'A menos de 100 m';
  const oneDecimal = Math.round(km * 10) / 10;
  if (oneDecimal < 10) return `${oneDecimal.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
