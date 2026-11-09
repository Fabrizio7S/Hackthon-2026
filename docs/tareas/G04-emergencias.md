# Tarea: G04 Emergencias y recursos de apoyo

- Grupo: G04
- Responsable humano y agente: Persona 4 (pendiente de nombre) con Claude
- Estado: implementada y verificada en base de datos, pruebas unitarias y compilación. Falta la verificación en teléfono con dos cuentas y la prueba real sin conexión.
- Dependencias y decisiones: Q06 resuelta para esta entrega en D26–D29. Q07 (offline compartido) y Q09 (adjuntos) siguen pendientes; ver límites.

## Resultado
Como vecino, puedo reportar una emergencia, ver las alertas de mi comunidad y encontrar recursos y grupos de apoyo. Como autor del reporte o representante, puedo atenderlo y cerrarlo, y aceptar o rechazar los ofrecimientos de ayuda de otros vecinos.

## Alcance
- Incluye: reporte con validación y sin envíos duplicados; lista con filtro por estado y detalle; estados abierta, en atención y solucionada; ofrecimiento de ayuda con nota; recursos críticos y grupos de apoyo con origen y disponibilidad; privacidad para reportes sobre personas vulnerables; cola local de reportes sin conexión; adaptador al mapa compartido; botón «Emergencias» en la navegación principal y atajos en Comunidad.
- Excluye: adjuntos (Q09 no aprobada), SMS o contacto con servicios oficiales, modo emergencia global, «estoy bien», reacciones, comentarios y polígonos de zonas afectadas.
- Archivos y contratos: `src/features/emergencies/`, `supabase/migrations/20261108050000_g04_emergencias.sql`, `supabase/tests/emergencias.test.sql`, cambio mínimo en `src/app/AppRoot.tsx`.
- Decisiones: D26–D29 en [decisiones.md](../decisiones.md).

## Modelo y permisos
| Elemento | Regla (aplicada en la base de datos) |
| --- | --- |
| Estados | `abierta` → `en_atencion` o `solucionado`; `en_atencion` → `abierta` o `solucionado`; `solucionado` es final y no se reabre. |
| Quién atiende y cierra | El autor del reporte o el representante de la comunidad. Otro vecino no puede cambiar el estado. |
| Ayuda | Cualquier vecino de la comunidad (salvo el autor) ofrece ayuda con una nota de hasta 200 caracteres. El autor o el representante acepta o rechaza. Aceptar mueve un reporte abierto a «en atención». |
| Recursos y grupos | Solo el representante los registra y cambia su disponibilidad. Los vecinos se unen o salen de grupos activos. |
| Personas vulnerables | Quien no es autor, representante ni ayudante aceptado no recibe descripción ni autor, y la ubicación se redondea a 0,01° (≈1 km). |
| Duplicados | Cada envío lleva un `client_request_id`; el servidor devuelve el mismo reporte si se repite. |
| Datos de demostración | Marcados con `es_demo` en la base de datos y rotulados «Datos de demostración» en pantalla; un recurso de demostración nunca se muestra como disponible. |

Los permisos y las transiciones se validan en triggers y funciones `SECURITY DEFINER`; la interfaz solo oculta botones. Los clientes no tienen INSERT, UPDATE ni DELETE directos sobre `emergencias`.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Migración y permisos | Migración aplicada en el proyecto `yrbpzewksiohmpxbneik`; `supabase/tests/emergencias.test.sql` suplanta usuarios con `request.jwt.claims` y `set local role authenticated`. | 96 comprobaciones, 0 fallos: reporte idempotente, RLS, escritura directa denegada, actores y transiciones, ofrecimientos, cierre, privacidad, recursos, grupos y aislamiento entre comunidades. | Usuarios de prueba dentro de una transacción que se revierte. No se probó concurrencia real entre dos sesiones. |
| Lógica y cola local | `node --test src/features/emergencies/tests/emergencies.test.cjs` | 23 pruebas, 0 fallos: errores, mapeadores, orden y filtros, validación, ubicación, cola, reintento con el mismo identificador, «pendiente» frente a «enviado», adaptador de mapa. | Almacenamiento y API simulados. |
| Tipos | `npm run typecheck` | Sin errores. | — |
| Exportación | `npx expo export --platform all --output-dir <carpeta temporal>` | Web, iOS y Android empaquetan sin errores (416, 750 y 748 módulos). | `npm run export` falla en este entorno porque no puede borrar la carpeta `dist/` existente (EPERM); no es un error del código. Repetirlo en el equipo del integrante. |
| Dos cuentas en teléfono | — | No ejecutado. | Requiere dos cuentas reales de la misma comunidad. |
| Pérdida real de conexión | — | No ejecutado. | Requiere un teléfono con modo avión; el flujo está cubierto solo por pruebas unitarias. |
| Accesibilidad | — | No verificada con lector de pantalla. Los controles tienen etiquetas y objetivo táctil de al menos 44 px. | — |

## Contrato de mapa (Persona 5)
`toEmergencyMapPoints(items, { includeClosed })` y `toResourceMapPoints(resources)` en `src/features/emergencies/model/mapPoints.ts` devuelven puntos con `latitud`, `longitud`, `estado`, `aproximada` y `esDemo`. Omiten registros sin coordenadas válidas y las emergencias cerradas (salvo `includeClosed`). Mientras `features/mapa` no exista, el módulo no dibuja mapa.

## Contrato de cola local (Persona 5, Q07)
`createOutbox(storage, userId)` guarda reportes en `emergencias.salida.v1:<usuario>` con los estados `guardado_local`, `enviando`, `pendiente` y `error`. «Enviado» solo existe cuando el servidor confirma, y entonces la entrada se elimina. El reintento reutiliza el mismo `client_request_id`. El almacenamiento es inyectable: si se aprueba una capa offline compartida, solo hay que sustituirlo.

## Cierre y continuación
- Cambios realizados: ver Alcance. Se añadió una pestaña «Emergencias» a la barra principal y una tarjeta de atajos en Comunidad por petición expresa del usuario; AGENTS.md pide coordinar los cambios de navegación, por lo que Persona 5 debe revisarlos.
- Fallos y pendientes:
  - Corregido el 2026-11-08: `expo-location` ya estaba instalado, pero Emergencias no obtenía el GPS ni recibía `userLocation` desde su montaje. Ahora consume el hook existente `useUbicacion`; conserva la zona comunitaria como respaldo y avisa cuando es aproximada.
  - Reabrir un reporte solucionado no está permitido. Si un ayudante aceptado se retira, el reporte no vuelve solo a «abierta»; el autor o el representante pueden hacerlo.
  - No se comparte teléfono ni contacto entre vecinos.
  - La regla «emergencias siempre disponible» sigue provisional hasta cerrar Q07.
  - Las ubicaciones de recursos se redondean a 0,001° por el trigger existente.
  - Adjuntos no implementados (Q09).
- Siguiente paso: probar con dos cuentas de la misma comunidad (una reporta; la otra ofrece ayuda; el autor acepta y cierra), repetir con el teléfono en modo avión y confirmar D26–D29 con el equipo.
- Propuesta de archivos para git add y mensaje de commit: ver la respuesta final; la ejecución es humana.

## Corrección atómica: ubicación SOS (2026-11-08)
- Issue: #4; responsable del módulo: `@reydiazz`; corrección solicitada por el usuario y ejecutada por Codex en la rama existente `dev`.
- Acción y resultado: mantener SOS presionado envía las coordenadas obtenidas del dispositivo al reporte que consume el mapa; si no hay GPS, informa el respaldo aproximado de la comunidad. Sin ninguna ubicación no envía. Es una posición capturada, no seguimiento en vivo.
- Causa adicional: `SosButton` ignoraba `ok: false` y mostraba errores como confirmaciones verdes. Ahora reserva la confirmación para envío confirmado. Un pendiente distingue si realmente se guardó en el teléfono y aclara que todavía no aparece para los vecinos ni en el mapa.
- Archivos propios: `EmergenciesScreen.tsx`, `SosButton.tsx`, `sos.test.cjs` y esta ficha. Se reutiliza el hook de mapas sin modificarlo; sin cambios de navegación, contratos compartidos, dependencias ni backend.
- Evidencia: `node --test src/features/emergencies/tests/sos.test.cjs src/features/emergencies/tests/emergencies.test.cjs src/features/mapa/sesionMapa.test.cjs`: 30 pruebas pasan. `npm run typecheck`: pasa. Las pruebas nuevas ejecutan los componentes reales con GPS/hooks/red simulados; sustituyen una prueba anterior que copiaba lógica sin ejecutar la implementación.
- Exportación: primer intento en sandbox falla con Hermes código 6 (limitación ya registrada en README). Repetición fuera del sandbox con `npm run export -- --output-dir artifacts/sos-export-verified`: Android, iOS y web exportados correctamente. Persisten advertencias de imágenes locales del CSS de Leaflet; no impiden la exportación. No se publicó ni desplegó.
- Límites y siguiente paso: pendiente comprobar en teléfono con permiso concedido/denegado y con dos cuentas: enviar SOS, abrir Mapa sin filtro o con Emergencias y verificar la posición desde la otra cuenta. Los reportes antiguos conservan su ubicación registrada; esta corrección no los reubica. No se verificó una escritura real ni recepción entre dispositivos en esta revisión.
- Propuesta para revisión y staging humano: `src/features/emergencies/screens/EmergenciesScreen.tsx`, `src/features/emergencies/components/SosButton.tsx`, `src/features/emergencies/tests/sos.test.cjs`, `docs/tareas/G04-emergencias.md`. Mensaje sugerido: `fix(emergencies): conectar SOS con GPS y corregir confirmaciones de envío`. No incluir los bundles de `artifacts/`.

## Corrección atómica: nombre en el mensaje SOS (2026-11-08)

- Issue: #4; responsable del módulo: `@reydiazz`; cambio solicitado por el usuario y ejecutado por Codex en `dev`.
- Resultado: el mensaje SOS que ven los vecinos incluye el nombre del autor recibido del servidor; por ejemplo, «¡ALERTA SOS! María Pérez solicita auxilio urgente en el sector».
- Alcance: personalización de la descripción al leer el reporte, compartida por alertas, detalle y mapa. El texto almacenado y la cola offline no cambian; no se añaden consultas, dependencias, navegación, contratos ni migraciones. Sin nombre disponible se conserva el mensaje original. No se personalizan reportes restringidos ni reportes ordinarios.
- Archivos: `src/features/emergencies/data/mappers.ts`, `src/features/emergencies/tests/emergencies.test.cjs` y esta ficha.
- Verificación: 29 pruebas de Emergencias y SOS aprobadas (`node --test src/features/emergencies/tests/emergencies.test.cjs src/features/emergencies/tests/sos.test.cjs`); `npm run typecheck`, `npm run check:architecture` y `git diff --check` correctos. Las pruebas comprueban dos nombres distintos en alertas, detalle y mapa, y conservan el mensaje sin nombre y en reportes restringidos/ordinarios. No se enviaron señales SOS reales. Pendiente comprobar con dos cuentas en teléfono.
- Commit sugerido para revisión humana: `fix(emergencies): mostrar el nombre del vecino en el mensaje SOS`.
