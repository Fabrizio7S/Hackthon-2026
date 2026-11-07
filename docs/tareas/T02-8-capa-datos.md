# Tarea T02.8: Capa de datos de ofertas y calificaciones

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloques 1, 2, 4 y 5 (validación, consultas y escritura).
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: implementada; verificada con cliente simulado y contra Supabase real sin tablas. Sin probar con datos reales.
- Dependencias y decisiones: D16–D19, migración [T02.7](T02-7-migracion-ofertas.md) (sin aplicar) y sesión de Persona 1 (sin implementar).

## Resultado
Las pantallas de G02 pueden listar, consultar, publicar, editar, retirar,
reactivar y calificar ofertas con una sola API, y reciben errores con un
mensaje en español y un tipo que indica qué hacer.

## Alcance
- Incluye:
  - `offerTypes.ts`: tipos `Offer` y conversión de filas.
  - `offerValidation.ts`: validación del formulario con mensajes por campo; el teléfono se guarda normalizado (`+51…`).
  - `dataError.ts`: traducción de errores de Supabase y de red.
  - `offersApi.ts`: `listActive`, `listMine`, `getById`, `create`, `update`, `setStatus`, `rate` y `ratingSummaries`.
  - `index.ts`: instancia conectada al cliente compartido de `src/lib/supabase.ts`.
- Excluye: pantallas, sesión, filtros y búsqueda, mapa, offline.
- Archivos: `src/features/services/data/`. No modifica `src/lib/supabase.ts` ni dependencias.

## Decisiones técnicas
- `createOffersApi(client)` recibe el cliente para poder probarla sin conexión.
- `create` usa `client_request_id`: si el mismo envío llega dos veces, devuelve la oferta existente en lugar de duplicarla.
- `newClientRequestId` usa `crypto.randomUUID` si existe; si no (Hermes), un UUID v4 no criptográfico. Suficiente para evitar duplicados; no es un dato de seguridad.
- `update` no envía el tipo (D19). Si RLS no devuelve filas, se informa `sin_permiso`.
- `rate` hace upsert por (oferta, vecino): calificar de nuevo cambia la nota (D18).
- Una tabla inexistente (`PGRST205`) se informa como `sin_configuracion`.
- La app valida para dar mensajes claros; la base de datos vuelve a validar y es la que decide.

## Aceptación
- Datos inválidos devuelven errores por campo y no llegan a Supabase.
- Reenviar el mismo envío no duplica la oferta.
- Editar o retirar una oferta ajena informa falta de permiso.
- Sin sesión no se puede calificar; sin red se informa conexión.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Validación, errores, conversión y API | Script con Node 22.18 fuera del repositorio; la API se probó con un **cliente de Supabase simulado** que registra las llamadas | 22 de 22 comprobaciones pasan | El cliente simulado no demuestra la integración real. |
| Supabase real (sin migración) | Script temporal con `@supabase/supabase-js` y la configuración de `.env` | `listActive` → `sin_configuracion` (tabla inexistente); `rate` sin sesión → `sin_sesion` | No hay tablas ni usuarios; no se probó leer ni escribir datos reales. |
| Tipos | `npx tsc --noEmit` | Salida 0 | — |

## Cierre y continuación
- Cambios realizados: capa de datos completa del módulo.
- Fallos y pendientes: aplicar la migración (T02.7), tener sesión (Persona 1) y repetir la prueba con dos cuentas reales.
- Siguiente paso: formulario de publicar con `validateOffer`, `offersApi.create` y `useSubmitOnce`.
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
