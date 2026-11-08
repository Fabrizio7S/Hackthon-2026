# Tarea T02.16: Calificación previa del vecino y autoría en el detalle

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 4 «Calificaciones» y D18 («cualquier vecino que pueda ver la oferta califica una vez por oferta, puede cambiar su nota y no califica su propia oferta»).
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (`@Fabrizio7S` en GitHub) con agente asignado.
- Estado: implementada; verificada con pruebas de lógica y tipos. Pendiente de probar con dos cuentas reales en Supabase.
- Dependencias y decisiones: D18, pendiente registrado en [T02.12](T02-12-calificar.md).

## Resultado
Como vecino que abre el detalle de una oferta, si ya la califiqué antes veo mis
estrellas marcadas al cargar la pantalla; y si la oferta es mía, en lugar del
selector de estrellas veo el aviso «Es tu oferta; otros vecinos pueden
calificarla.».

## Alcance
- Incluye:
  - `offersApi.viewerRating(offerId)` en `src/features/services/data/offersApi.ts`: consulta el usuario actual de la sesión y su calificación previa en `service_offer_ratings`.
  - Integración en `src/features/services/screens/OfferDetailScreen.tsx`: inicializa `myStars` con la nota previa del vecino y oculta `StarRatingInput` cuando `viewerUserId === offer.authorId`.
- Excluye: cambios en el esquema de base de datos (la política RLS de T02.7 ya impide calificar la propia oferta en backend).
- Archivos: `src/features/services/data/offersApi.ts` y `src/features/services/screens/OfferDetailScreen.tsx`.

## Decisiones técnicas
- `viewerRating` es opcional en el tipo `Props['api']` de `OfferDetailScreen` para mantener compatibilidad con pruebas anteriores que solo inyectan `getById`, `ratingSummaries` y `rate`.
- Si no hay sesión activa al consultar el detalle, `viewerRating` devuelve `{ userId: null, stars: null }` sin impedir que se muestre el detalle.

## Aceptación
- Sin cliente configurado devuelve error `sin_configuracion`.
- Sin sesión devuelve `{ userId: null, stars: null }`.
- Con sesión y calificación previa devuelve `{ userId, stars }` y `OfferDetailScreen` muestra esa nota seleccionada.
- Cuando `viewerUserId === offer.authorId`, no se muestra `StarRatingInput` y se informa que es una oferta propia.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Consulta de usuario y nota previa | Script con Node 22.18 (`verify-t02-15-16.mjs`) fuera del repositorio con cliente simulado (sin cliente, sin sesión y con sesión + 4 estrellas) | Todas las comprobaciones pasan | Cliente simulado; falta probar con dos cuentas reales en Supabase. |
| Tipos | `npx tsc --noEmit` | Salida 0 | — |

## Cierre y continuación
- Cambios realizados: consulta de calificación previa del vecino y ocultación del selector de estrellas en ofertas propias.
- Fallos y pendientes: probar con dos cuentas reales cuando se aplique la migración en Supabase.
- Siguiente paso: recorrido interno del módulo G02 con navegación atrás y recarga coherente (T02.17).
- Propuesta de archivos para git add y mensaje de commit: la indica el agente en el chat; la ejecuta el integrante.
