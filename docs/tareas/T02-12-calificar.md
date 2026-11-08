# Tarea T02.12: Calificar una oferta con estrellas

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 4 «Calificaciones»: «Implementar estrellas según Q04», «Actualizar los valores después de una operación confirmada» y «Comprobar consistencia al recargar».
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: implementada; verificada en navegador con API **simulada**. Sin probar con Supabase real ni en teléfono.
- Dependencias y decisiones: D18 (resuelve Q04). Reglas validadas en backend por la migración [T02.7](T02-7-migracion-ofertas.md), sin aplicar. Sesión de Persona 1.

## Resultado
Como vecino, en el detalle de una oferta toco de 1 a 5 estrellas; cuando el
servidor confirma, veo «Calificaste con N estrellas» y el promedio y la
cantidad actualizados. Si vuelvo a calificar, cambia mi nota sin sumar otra.

## Alcance
- Incluye: `StarRatingInput` (5 estrellas accesibles) e integración en `OfferDetailScreen` con `offersApi.rate`, `useSubmitOnce` y recarga del resumen tras la confirmación.
- Excluye: ocultar las estrellas en la oferta propia y marcar la nota previa del vecino (requieren saber quién es el usuario: sesión de Persona 1).
- Archivos: `src/features/services/rating/StarRatingInput.tsx` y cambio en `src/features/services/screens/OfferDetailScreen.tsx`.

## Decisiones técnicas
- El resumen se vuelve a pedir solo cuando `rate` responde bien: no se actualiza con datos supuestos.
- No se califica una oferta retirada: la sección no aparece (y la base de datos lo rechaza).
- En la oferta propia, la base de datos rechaza la calificación y se muestra «No tienes permiso para hacer esto.».
- Las estrellas miden al menos 48×48 para tocarlas con facilidad.

## Aceptación
- Calificar actualiza promedio y cantidad tras la confirmación.
- Cambiar la nota no suma otra valoración.
- Varios toques seguidos envían una sola calificación.
- Al recargar, promedio y cantidad coinciden (criterio del issue).
- La propia oferta no se puede calificar (D18).

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Calificar y actualizar | Expo web en el puerto 8082, `App.tsx` temporal no versionado con **API simulada** que guarda notas en memoria (dos previas: 5 y 3) | De «★ 4.0 (2)» a «★ 4.0 (3)» tras tocar 4 estrellas y «Calificaste con 4 estrellas.» | API simulada, no la vista real de Supabase. |
| Un solo envío | Tres toques seguidos en 4 estrellas | 1 llamada a `rate` | — |
| Cambiar la nota | Tocar 1 estrella después | «★ 3.0 (3)»: cambia el promedio, no la cantidad | Upsert simulado; el real se probó en T02.7 con PGlite. |
| Consistencia al recargar | Volver a montar la pantalla | Sigue «★ 3.0 (3)» | Con datos reales falta probarlo con dos cuentas. |
| Oferta propia | Calificar una oferta del mismo usuario (rechazo simulado como en RLS) | «No tienes permiso para hacer esto.»; el resumen no cambia | La pantalla aún muestra las estrellas en la oferta propia. |
| Accesibilidad | Árbol de accesibilidad | `radio "1 estrella"` … `radio "5 estrellas"` | Sin probar con TalkBack o VoiceOver. |
| Tipos | `npx tsc --noEmit` | Salida 0 | — |

## Cierre y continuación
- Cambios realizados: calificar desde el detalle con actualización confirmada.
- Fallos y pendientes: ocultar estrellas en la oferta propia y marcar la nota previa cuando exista la sesión; probar con dos cuentas reales.
- Siguiente paso: editar y retirar las ofertas propias (issue, bloque 1).
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
