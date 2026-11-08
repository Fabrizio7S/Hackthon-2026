# Tarea T02.3: Evitar publicaciones duplicadas por doble pulsación

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 1 «Publicaciones», punto «Evitar publicaciones duplicadas por doble pulsación o reintento».
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: implementada sin verificar en teléfono.
- Dependencias y decisiones: la parte de reintentos depende de Q07 y del campo `client_request_id` propuesto en [T02.1](T02-1-contrato-ofertas.md).

## Resultado
Como vecino que publica una oferta, si toco «Publicar» varias veces seguidas
se envía una sola vez, y si el envío falla puedo reintentarlo.

## Alcance
- Incluye: `createSingleFlight`, lógica pura que ignora llamadas mientras otra está en curso, y el hook `useSubmitOnce`, que expone `submit` y `submitting` para desactivar el botón.
- Excluye: duplicados por reintento tras perder conexión o cerrar la app (requiere `client_request_id` único en backend y Q07), formulario y botón reales.
- Archivos: `src/features/services/submit/singleFlight.ts` y `src/features/services/submit/useSubmitOnce.ts`. No modifica archivos compartidos ni dependencias.

## Decisiones técnicas
- La protección vive en G02. Si otros módulos (favores, emergencias) la necesitan, se puede mover a `src/shared/` coordinándolo con Persona 5.
- Un error libera el bloqueo para permitir reintentos; el resultado distingue `ejecutado`, `error` e `ignorado`.
- Solo protege el mismo dispositivo y la misma pantalla. La garantía definitiva contra duplicados debe estar en backend.

## Aceptación
- Varios toques rápidos ejecutan la operación una sola vez.
- Mientras se envía, `submitting` es verdadero para desactivar el botón.
- Tras un éxito o un error se puede volver a enviar.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Lógica de envío único | Script ejecutado con Node 22.18 fuera del repositorio: tres llamadas simultáneas, nuevo envío al terminar y reintento tras error | Todas las aserciones pasan; una sola ejecución, estados `true`→`false` | El script no se versionó porque el proyecto no tiene marco de pruebas. |
| Tipos | `npm run typecheck` | Sin errores, salida 0 | — |
| Hook en pantalla | — | No ejecutado | `useSubmitOnce` no se probó en React: aún no hay formulario que lo use. |

## Cierre y continuación
- Cambios realizados: lógica de envío único y hook para botones de envío.
- Fallos y pendientes: falta probar el hook en el formulario real; reintentos tras desconexión pendientes de Q07.
- Siguiente paso: usar `useSubmitOnce` en el botón «Publicar» cuando exista el formulario.
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
