# T01.4 — Invitaciones por código personal

- Grupo G01; Persona 1 (nombre/GitHub pendientes), agente Codex.
- Issue: https://github.com/Fabrizio7S/Hackthon-2026/issues/1
- Rama: `feature/accesos-perfiles-comunidades`.
- Estado: implementada y comprobada localmente; integración remota y teléfono pendientes.
- Dependencias: T01.2 y T01.3; D17–D19 aprobadas.

## Resultado y alcance

El representante autorizado busca por código y envía una invitación a su comunidad. El vecino consulta sus invitaciones y acepta o rechaza. La aceptación crea la membresía y confirma la invitación en una sola transacción. Una cuenta ajena no consulta ni procesa invitaciones de otros.

Incluye búsqueda mínima, envío, listas entrante/saliente, procesamiento, reintentos, estado e interfaz. Excluye listado completo de integrantes, contratos de personas 2–5, notificaciones push, salida de comunidad y administración de roles.

## Coordinación

G01 modifica archivos de invitaciones bajo `src/features/community/`, monta el panel en CommunityPanel y actualiza la comunidad después de procesar una invitación. Prepara una migración posterior a perfil y creación de comunidad; no añade dependencias, no cambia App.tsx ni el cliente compartido y no aplica SQL remoto. Persona 5 debe revisar el montaje cuando esté disponible.

## Aceptación

- Búsqueda solo por código exacto; solo nombre/código para representante autorizado.
- Envío exclusivamente a la comunidad del representante, sin aceptar un rol o actor del cliente.
- Una invitación pendiente por comunidad y destinatario; reenviar pendiente devuelve la misma fila. Tras rechazo se permite una nueva.
- Solo destinatario procesa; repetir un procesamiento devuelve el estado final existente sin modificarlo, incluso si se pide la acción contraria.
- Aceptación atómica, una sola membresía por usuario; no aceptar otra comunidad si ya pertenece a una distinta.
- Las invitaciones permiten identificar la comunidad que invita sin dar acceso al resto de sus datos antes de aceptar.
- Carga, vacío, error, reintento y doble pulsación; sin confirmaciones ficticias. Al aceptar se vuelve a consultar la pertenencia.
- SQL/RLS y pruebas locales con remitente, destinatario y tercero. Pruebas reales y teléfono siguen pendientes por acceso y dispositivo.

## Implementación

- `invitationService.ts`: búsqueda, envío, lista y procesamiento por RPC. Envío solo de código; procesamiento solo de id/decisión. Nunca acepta actor, comunidad o rol del cliente. Valida respuestas y respeta el estado final que devuelve el servidor.
- `useInvitations.ts`: estado, carga, error, vacío, reintento, bloqueo de operaciones y descarte de respuestas tras desmontar/recargar. Solo muestra envío/procesamiento confirmado.
- `InvitationPanel.tsx`: búsqueda habilitada para representante, listas entrantes/salientes, aceptación/rechazo y actualización manual. Campo y acciones se deshabilitan durante operaciones. Cambiar código elimina el resultado anterior.
- `CommunityPanel.tsx` monta el panel bajo el usuario actual; después de aceptación confirmada vuelve a consultar la pertenencia. No se guardan datos privados offline.
- Migración `20261107232444_community_invitations.sql`: tabla con RLS sin acceso directo del cliente, unicidad de pendiente, wrappers públicos SECURITY INVOKER y operaciones privadas SECURITY DEFINER con search_path vacío/actores comprobados. Los auxiliares no son ejecutables por el cliente.
- Todas las operaciones que pueden crear membresía bloquean antes el perfil del destinatario, igual que creación de comunidad. La PK de membresía impide dos comunidades; aceptación y cambio de estado son atómicos.

## Verificación observada

| Comprobación | Comando/pasos | Resultado | Límites |
| --- | --- | --- | --- |
| Servicios | `node --test src/features/auth/authService.test.cjs src/features/auth/observeSession.test.cjs src/features/profile/profileService.test.cjs src/features/community/communityService.test.cjs src/features/community/invitationService.test.cjs` | 38 correctas; nueve nuevas de invitaciones | Clientes simulados. No prueba React ni permisos remotos. |
| SQL | `node --test supabase/tests/own_profile.test.cjs supabase/tests/community_creation.test.cjs supabase/tests/community_invitations.test.cjs`, con PROFILE_SQL_RUNTIME de PGlite 0.5.15 | 30 casos correctos, once de invitaciones. Node cuenta además tres contenedores: 33 pruebas | PostgreSQL temporal con fixtures de Auth. No equivale a Supabase Auth/PostgREST ni concurrencia real entre conexiones. |
| TypeScript | `npm run typecheck` | Código 0 | Incluye servicio, estado e interfaz. |
| Exportación | `npm run export` fuera del sandbox | Android, iOS y web; código 0 | No acredita ejecución en teléfono. |
| Supabase compartido | Sin aplicación ni pruebas remotas | Pendiente | El conector no tiene acceso al proyecto de .env. Inspección, coordinación, aplicación en orden y asesores pendientes. |
| Teléfono y dos cuentas reales | No ejecutado | Pendiente | El usuario informó que no dispone de teléfono. No se crearon cuentas remotas. |

El SQL comprueba búsqueda mínima, bloqueo de metadatos falsos, tercero/remitente incapaz de procesar, rechazo/reenvío, aceptación repetida y contraria, dos invitaciones de distintas comunidades, fallos de escritura y reintento, prohibición de escritura directa y retirada de autorización.

La revisión de seguridad comprueba RLS, ausencia de escritura directa, funciones privadas con auth.uid, separación de funciones auxiliares, EXECUTE revocado para PUBLIC/anon y nombres cualificados. No se declara revisión remota mediante asesores ejecutada.

## Cierre y siguiente paso

El issue #1 sigue abierto. Siguiente tarea de implementación: listado de integrantes con los datos mínimos permitidos. Los contratos de identidad/comunidad/membresía para otros módulos y la verificación real integrada siguen pendientes.

Antes de aplicar las tres migraciones: abrir el proyecto correcto, inspeccionar tablas y políticas existentes, revisar el esquema con el equipo, mantener `community_internal` fuera de Data API y ejecutar asesores. No sustituir por otro proyecto accesible.

Archivos propuestos para git add humano:

- `README.md`, `docs/tareas/README.md`, `docs/tareas/T01-4-invitaciones.md`.
- `src/features/community/CommunityPanel.tsx`, `src/features/community/invitationService.ts`, `src/features/community/invitationService.test.cjs`, `src/features/community/useInvitations.ts`, `src/features/community/InvitationPanel.tsx`, `src/features/community/INVITATIONS.md`, `src/features/community/README.md`.
- `supabase/README.md`, `supabase/migrations/20261107232444_community_invitations.sql`, `supabase/tests/community_invitations.test.cjs`.

Mensaje sugerido: `feat(community): incorporar invitaciones por código con aceptación segura`.

No se ejecutaron git add, commit, push, despliegues ni cambios remotos.
