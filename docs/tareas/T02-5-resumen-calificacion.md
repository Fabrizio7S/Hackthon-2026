# Tarea T02.5: Mostrar promedio y cantidad de valoraciones

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 4 «Calificaciones», punto «Mostrar promedio y cantidad de valoraciones».
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: implementada; verificada en navegador con datos de ejemplo, sin verificar en teléfono.
- Dependencias y decisiones: Q04 define escala, quién califica y cuántas veces. Esta tarea solo muestra valores ya calculados y no decide ninguna de esas reglas.

## Resultado
Como vecino que consulta una oferta, veo su calificación como «★ 4.8 (32)» o
«Sin valoraciones» si todavía no tiene, y el lector de pantalla lo anuncia
como «4.8 de 5 estrellas, 32 valoraciones».

## Alcance
- Incluye: `formatRatingSummary` (lógica pura) y el componente `RatingSummary`, de solo lectura.
- Excluye: calificar, elegibilidad, límite de repeticiones, cálculo del promedio y almacenamiento (Q04 y backend).
- Archivos: `src/features/services/rating/formatRating.ts` y `src/features/services/rating/RatingSummary.tsx`. Usa la paleta de `src/features/services/theme.ts`.

## Decisiones técnicas
- La escala (`maxStars`) es un parámetro obligatorio hasta resolver Q04; no se fija 5 en el código.
- El promedio se muestra con un decimal. Si no hay valoraciones o los datos no son válidos (cantidad no entera o ≤ 0, promedio fuera de la escala o no numérico), se muestra «Sin valoraciones» y no se inventa un promedio.
- La estrella usa `colors.star` solo como icono; los números usan `text` y `textMuted`, con contraste AA.
- El archivo de lógica se llama `formatRating.ts` y no `ratingSummary.ts`: en Windows ese nombre choca con `RatingSummary.tsx`, porque solo cambian las mayúsculas (TypeScript dio el error TS1261).

## Aceptación
- Con valoraciones se ve estrella, promedio con un decimal y cantidad entre paréntesis.
- Sin valoraciones o con datos inválidos se ve «Sin valoraciones».
- El lector de pantalla recibe una etiqueta completa con singular y plural correctos.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Formato y datos inválidos | Script con Node 22.18 fuera del repositorio: 4.8/32, 4.25/1, 5/3 y nueve combinaciones inválidas | Todas las aserciones pasan | El script no se versionó porque el proyecto no tiene marco de pruebas. |
| Tipos | `npx tsc --noEmit` | Salida 0 | — |
| Vista en navegador | Pantalla temporal no versionada en `App.tsx` con datos **de ejemplo**, Expo web en el puerto 8082 | Se vio «★ 4.8 (32)», «★ 4.3 (1)» y «Sin valoraciones»; etiquetas accesibles «4.8 de 5 estrellas, 32 valoraciones» y «4.3 de 5 estrellas, 1 valoración». `App.tsx` se restauró después | La web no sustituye al teléfono; sin datos reales. |

## Cierre y continuación
- Cambios realizados: resumen de calificación de solo lectura.
- Fallos y pendientes: probar en teléfono; conectar con datos reales cuando existan tabla y reglas de calificación (Q04).
- Siguiente paso: usar `RatingSummary` en la tarjeta y el detalle de la oferta.
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
