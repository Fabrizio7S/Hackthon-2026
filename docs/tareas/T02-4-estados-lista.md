# Tarea T02.4: Estados de carga, vacío, error y reintento del listado

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 2 «Descubrimiento», punto «Implementar estados de carga, vacío, error y reintento».
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: implementada; verificada en navegador con datos simulados, sin verificar en teléfono.
- Dependencias y decisiones: no depende del contrato de oferta; el tipo de elemento es genérico. El contrato compartido de «Errores» (Persona 5) podría sustituir el mensaje fijo.

## Resultado
Como vecino que abre el listado de ofertas, veo «Cargando…» mientras llegan los
datos, un mensaje si no hay ofertas y, si falla la carga, un mensaje con el
botón «Reintentar» que vuelve a intentarlo.

## Alcance
- Incluye: `createListLoader` (lógica pura con estados `cargando`, `vacio`, `listo` y `error`), el hook `useListLoader` (carga al montar y `reload`) y el componente `ListStateView`.
- Excluye: consulta real a Supabase, diseño de las tarjetas de oferta, búsqueda y filtros.
- Archivos: `src/features/services/list/listLoader.ts`, `useListLoader.ts` y `ListStateView.tsx`. No modifica archivos compartidos ni dependencias.

## Decisiones técnicas
- Solo se aplica la respuesta de la última carga iniciada: un reintento rápido no queda pisado por una respuesta lenta anterior.
- El error muestra un mensaje fijo en español sin detalles técnicos; no distingue todavía entre sin conexión y error del servidor.
- Colores de la paleta de G02 (`src/features/services/theme.ts`), tomada de la imagen de referencia por indicación de Persona 2: botón verde `#18803A` con texto blanco (contraste 5.01:1) y texto `#1B1B1B` sobre blanco (17.22:1). Pendiente de que el equipo confirme la paleta.
- Accesibilidad: el error usa `accessibilityRole="alert"`, el botón `accessibilityRole="button"` y el estado de carga una región `polite`.

## Aceptación
- Al cargar se ve «Cargando…».
- Sin elementos se ve el mensaje de lista vacía.
- Si falla se ve el error con «Reintentar» y, al pulsarlo, vuelve a cargar.
- Una respuesta antigua no sobrescribe a una más reciente.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Lógica de estados | Script con Node 22.18 fuera del repositorio: lista con elementos, vacía, error y reintento, y respuestas desordenadas | Todas las aserciones pasan | El script no se versionó porque el proyecto no tiene marco de pruebas. |
| Tipos | `npx tsc --noEmit` | Salida 0 | — |
| Vista en navegador | Pantalla temporal no versionada en `App.tsx` con datos **simulados** (primer intento falla, el segundo devuelve dos ejemplos), Expo web en el puerto 8082 | Se vio el error con «Reintentar»; al pulsarlo, «Cargando…» y luego «Ejemplo 1» y «Ejemplo 2». `App.tsx` se restauró después | Estado vacío comprobado solo en la lógica; la web no sustituye al teléfono; sin Supabase. |
| Teléfono | — | No ejecutado | Pendiente de una pantalla real de listado. |

## Cierre y continuación
- Cambios realizados: estados de lista reutilizables para el listado de ofertas.
- Fallos y pendientes: probar en teléfono; conectar con la consulta real cuando exista la tabla de ofertas.
- Siguiente paso: usar `useListLoader` y `ListStateView` en la pantalla de listado con la consulta a Supabase.
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
