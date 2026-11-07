// Formato del resumen de calificaciones («★ 4.8 (32)»).
// Solo presenta datos ya calculados: quién califica, cuántas veces y la escala
// dependen de Q04 y se validan en backend.

export type RatingSummaryText =
  | { status: 'sin_valoraciones'; text: string; accessibilityLabel: string }
  | { status: 'con_valoraciones'; average: string; count: string; accessibilityLabel: string };

/**
 * Convierte promedio y cantidad en textos para pantalla y lector de pantalla.
 * Si no hay valoraciones o los datos no son válidos, no inventa un promedio.
 * `maxStars` es la escala; queda como parámetro hasta resolver Q04.
 */
export function formatRatingSummary(
  average: number | null | undefined,
  count: number | null | undefined,
  maxStars: number,
): RatingSummaryText {
  const validCount = typeof count === 'number' && Number.isInteger(count) && count > 0;
  const validAverage =
    typeof average === 'number' && Number.isFinite(average) && average >= 0 && average <= maxStars;

  if (!validCount || !validAverage) {
    return {
      status: 'sin_valoraciones',
      text: 'Sin valoraciones',
      accessibilityLabel: 'Sin valoraciones todavía',
    };
  }

  const rounded = average.toFixed(1);
  const noun = count === 1 ? 'valoración' : 'valoraciones';
  return {
    status: 'con_valoraciones',
    average: rounded,
    count: `(${count})`,
    accessibilityLabel: `${rounded} de ${maxStars} estrellas, ${count} ${noun}`,
  };
}
