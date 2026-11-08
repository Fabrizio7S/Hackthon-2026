# Tarea T02.15: Adaptador de ofertas para el mapa compartido

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 2 «Descubrimiento»: «Conectar las ofertas al mapa compartido de Persona 5» y «Mantener coherencia entre lista, mapa y detalle».
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (`@Fabrizio7S` en GitHub) con agente asignado.
- Estado: implementada; verificada con pruebas de lógica y tipos. Pendiente de integrar en `main` con la rama `feature/mapa-offline` de Persona 5.
- Dependencias y decisiones: D16, D18. Compatible con `OfertaMapa` de `src/features/mapa/types.ts` (Persona 5).

## Resultado
Como módulo de servicios y productos, entrego `toMapOffers` y `loadMapOffers`
para que el mapa compartido (`MapaServicios` de Persona 5) muestre únicamente
las ofertas activas con ubicación real, conservando el mismo identificador,
título, descripción, tipo y resumen de calificación que la lista y el detalle.

## Alcance
- Incluye:
  - `src/features/services/map/toMapOffers.ts`: tipo `ServiceMapOffer` compatible con `OfertaMapa`, función pura `toMapOffers` y cargador `loadMapOffers`.
  - Adjuntar ubicación opcional `userLocation` al publicar en `src/features/services/screens/PublishOfferScreen.tsx` cuando se reciba una coordenada válida.
- Excluye: modificar archivos de `src/features/mapa/` (pertenecen a Persona 5 en su rama).
- Archivos: `src/features/services/map/toMapOffers.ts` y `src/features/services/screens/PublishOfferScreen.tsx`.

## Decisiones técnicas
- Se reutiliza `isValidCoordinates` de T02.6 para descartar ofertas sin ubicación o con `(0, 0)`, de modo que nunca se inventen marcadores ni distancias.
- Se descartan ofertas con estado `retirada` para garantizar que una oferta retirada no aparezca en el mapa.

## Aceptación
- Solo las ofertas activas con coordenadas válidas se convierten en marcadores.
- Ofertas sin coordenadas, con `(0, 0)` o retiradas quedan excluidas.
- El promedio y la cantidad de valoraciones coinciden con los del listado.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Conversión y filtrado de marcadores | Script con Node 22.18 (`verify-t02-15-16.mjs`) fuera del repositorio: 4 ofertas (activa con ubicación, activa sin ubicación, activa con `(0,0)` y retirada con ubicación) | Solo se proyecta la oferta activa con ubicación válida y sus datos de calificación coinciden | Prueba de lógica pura; falta unión con `feature/mapa-offline` en `main`. |
| Tipos | `npx tsc --noEmit` | Salida 0 | — |

## Cierre y continuación
- Cambios realizados: adaptador de ofertas para el mapa y soporte de `userLocation` opcional al publicar.
- Fallos y pendientes: conectar `loadMapOffers` dentro de la pantalla de mapa cuando Persona 5 integre `feature/mapa-offline` y `feature/servicios-productos`.
- Siguiente paso: consultar calificación previa del vecino y ocultar estrellas en oferta propia (T02.16).
- Propuesta de archivos para git add y mensaje de commit: la indica el agente en el chat; la ejecuta el integrante.
