# Tarea T02.14: Búsqueda por texto y filtro por tipo en el listado de ofertas

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 2 «Descubrimiento»: «Implementar búsqueda y filtros mínimos acordados».
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (`@Fabrizio7S` en GitHub) con agente asignado.
- Estado: implementada; lógica verificada con Node y tipos comprobados. Pendiente de probar con Supabase real y en teléfono.
- Dependencias y decisiones: D16, D20. Listado base implementado en [T02.10](T02-10-listado-ofertas.md).

## Resultado
Como vecino que consulta el listado de ofertas, puedo buscar por texto en el
título o descripción y filtrar entre «Todos», «Servicios» y «Productos»; si la
combinación no tiene coincidencias veo un mensaje claro y un botón «Ver todas
las ofertas» para restablecer los filtros.

## Alcance
- Incluye:
  - `src/features/services/list/filterOffers.ts`: normalización de texto sin distinguir mayúsculas ni tildes (`normalizeSearchText`) y función pura `filterOfferListItems`.
  - `src/features/services/screens/OfferListScreen.tsx`: buscador accesible, selector `radiogroup` (`Todos`, `Servicios`, `Productos`) con `aria-checked`, y estado sin coincidencias con botón «Ver todas las ofertas».
- Excluye: filtros por categoría o precio (descartados en D16), filtro por distancia (depende de ubicación de Persona 5), búsqueda en servidor (las ofertas activas de la comunidad ya se cargan en el listado).
- Archivos: `src/features/services/list/filterOffers.ts`, `src/features/services/screens/OfferListScreen.tsx`, `docs/decisiones.md`, `docs/tareas/README.md` y esta ficha.

## Decisiones técnicas
- La búsqueda normaliza con `NFD` para ignorar tildes y mayúsculas, y comprueba que todas las palabras buscadas aparezcan en la unión de título y descripción.
- Cuando la comunidad no tiene ninguna oferta (`state.status === 'vacio'`), se mantiene el mensaje vacío general de `ListStateView` sin mostrar controles vacíos.
- Cuando hay ofertas en la comunidad pero el filtro/búsqueda devuelve cero resultados, se mantienen visibles los controles y se ofrece el botón «Ver todas las ofertas» para limpiar `query` y volver a `todos`.

## Aceptación
- El filtro «Servicios» muestra solo servicios; «Productos», solo productos; «Todos», ambos.
- Escribir una o varias palabras filtra por título y descripción sin distinguir mayúsculas ni tildes.
- Si ningún elemento coincide con la búsqueda o el filtro, se muestra «No encontramos ofertas que coincidan con tu búsqueda.» y «Ver todas las ofertas» restablece la vista completa.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Lógica de normalización y filtrado | Script con Node 22.18 (`--experimental-strip-types`) fuera del repositorio (`verify-t02-14.mjs`): 9 comprobaciones (normalización de tildes/ñ, filtro por defecto sin mutar, solo servicios, solo productos, búsqueda sin tildes, mayúsculas, varios términos en descripción, combinación tipo+texto y caso vacío) | 9 de 9 comprobaciones pasan | Prueba de lógica pura; no sustituye prueba visual en teléfono. |
| Tipos | `npm run typecheck` | Salida 0 | — |
| Teléfono y datos reales | — | No ejecutado | Pendiente de aplicar migración en Supabase, sesión de Persona 1 y prueba en Expo Go. |

## Cierre y continuación
- Cambios realizados: búsqueda por texto y filtro por tipo en el listado de ofertas, más acuerdo D20.
- Fallos y pendientes: conectar el recorrido completo del módulo G02 o integrar con la navegación de Persona 5; verificar con Supabase real y en teléfono.
- Siguiente paso: recorrido interno del módulo o mostrar calificación previa / ocultar estrellas en oferta propia cuando hay sesión.
- Propuesta de archivos para git add y mensaje de commit: la indica el agente en el chat; la ejecuta el integrante.
