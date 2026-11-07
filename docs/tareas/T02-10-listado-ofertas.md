# Tarea T02.10: Listado de ofertas disponibles

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 2 «Descubrimiento»: «Implementar listado de ofertas disponibles» y «estados de carga, vacío, error y reintento».
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: implementada; verificada en navegador con datos **simulados**. Sin probar con Supabase real ni en teléfono.
- Dependencias y decisiones: D16, D18. Migración [T02.7](T02-7-migracion-ofertas.md) sin aplicar, sesión de Persona 1, navegación y ubicación de Persona 5.

## Resultado
Como vecino, veo las ofertas activas con su tipo, título, calificación y
distancia; si falla la carga veo el motivo y puedo reintentar, y al tocar una
oferta se abre su detalle.

## Alcance
- Incluye: `OfferListScreen`; `loadOfferListItems`, que junta ofertas y resúmenes de calificación; `ListLoadError` en el cargador de T02.4 para mostrar el mensaje concreto («Inicia sesión para continuar.»).
- Excluye: búsqueda y filtros (sin acordar), pantalla de detalle, mapa y registro en la navegación.
- Archivos: `src/features/services/screens/OfferListScreen.tsx`, `src/features/services/list/offerListItems.ts` y cambio en `src/features/services/list/listLoader.ts`.

## Decisiones técnicas
- Si fallan los resúmenes de calificación, la oferta se muestra sin calificación en lugar de «Sin valoraciones», para no presentar un dato desconocido.
- Sin ubicación del vecino o de la oferta no se muestra distancia (criterio de aceptación del issue).
- `onOpenOffer` queda como parámetro: la navegación al detalle la conecta Persona 5.
- No se añadió «deslizar para recargar»: el issue no lo pide.

## Aceptación
- Se ven las ofertas activas con tipo, título, calificación y distancia cuando existe.
- Una oferta sin ubicación no muestra distancia.
- Un error muestra su mensaje con «Reintentar»; al reintentar se carga la lista.
- Tocar una oferta la entrega a `onOpenOffer`.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Unión de ofertas y calificaciones | Script con Node 22.18 fuera del repositorio con API simulada | 4 comprobaciones pasan: con resumen, sin valoraciones (`null`), resúmenes fallidos (`undefined`) y error convertido en mensaje | — |
| Mensaje de error específico | Script del cargador de T02.4 ampliado | `ListLoadError` muestra su mensaje; otros errores, el genérico | — |
| Pantalla | Expo web en el puerto 8082, `App.tsx` temporal no versionado con **datos simulados** | Primero «Inicia sesión para continuar.» con «Reintentar»; después tres tarjetas: «★ 4.8 (32) 0.8 km», «Sin valoraciones · A menos de 100 m» y una sin distancia por falta de ubicación. Tocar «Pan casero» entregó su id | Datos simulados; la web no sustituye al teléfono. |
| Tipos | `npx tsc --noEmit` | Salida 0 | — |
| Supabase real y teléfono | — | No ejecutado | Faltan la migración aplicada y la sesión. |

## Cierre y continuación
- Cambios realizados: listado de ofertas.
- Fallos y pendientes: búsqueda y filtros sin acordar; probar con datos reales y en teléfono.
- Siguiente paso: detalle de la oferta con contacto (issue, bloques 2 y 3).
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
