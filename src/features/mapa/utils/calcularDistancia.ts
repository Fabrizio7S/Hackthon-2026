
/**
 * Calcula la distancia aproximada entre dos
 * coordenadas geográficas utilizando Haversine.
 *
 * El resultado se expresa en kilómetros.
 * Es una distancia en línea recta, no por calles.
 */
export function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const radioTierra = 6371;
  const radianes = Math.PI / 180;

  const diferenciaLatitud = (lat2 - lat1) * radianes;
  const diferenciaLongitud = (lon2 - lon1) * radianes;

  const a =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos(lat1 * radianes) *
      Math.cos(lat2 * radianes) *
      Math.sin(diferenciaLongitud / 2) ** 2;

  return (
    2 *
    radioTierra *
    Math.asin(Math.min(1, Math.sqrt(a)))
  );
}
