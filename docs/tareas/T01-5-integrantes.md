# T01.5 — Listado de integrantes de mi comunidad

- Grupo G01; Persona 1 (nombre/GitHub pendientes), agente Codex.
- Issue: https://github.com/Fabrizio7S/Hackthon-2026/issues/1
- Rama: `feature/accesos-perfiles-comunidades`.
- Estado: implementada y comprobada localmente; integración remota y teléfono pendientes.
- Dependencias: T01.2–T01.4; D17–D19 aprobadas.

## Resultado y alcance

Como integrante puedo consultar nombre visible y rol de los miembros de mi comunidad. Otro usuario no puede consultar esa lista ni perfiles completos. La vista identifica mi propia fila sin exponer identificadores de otras cuentas.

Incluye lectura autorizada, presentación, carga/vacío/error/reintento y actualización tras invitaciones aceptadas. Excluye administración de integrantes/roles, salida, contratos de otros módulos, notificaciones y cambios remotos.

## Coordinación y aceptación

G01 añade servicio/pantalla y migración de lectura bajo community, monta la lista en CommunityPanel y coordina su actualización con InvitationPanel. No introduce dependencias ni cambia App.tsx/cliente compartido. Persona 5 debe revisar el montaje cuando esté disponible.

- Backend obtiene la comunidad de auth.uid; no acepta una comunidad arbitraria del cliente.
- Solo devuelve nombre visible, rol y si la fila corresponde al solicitante. Sin correos, códigos o ubicación.
- Miembros de la misma comunidad reciben la misma composición, con marca propia distinta. Cuentas sin pertenencia y de otras comunidades no acceden a esa lista.
- Perfil completo y tablas de membresía siguen con sus permisos anteriores.
- Estado privado desmontado por usuario/comunidad; respuestas atrasadas descartadas.
- Reintentos, carga, vacío y error explícitos; no se presentan datos de ejemplo como integración.

## Implementación

- `membersService.ts`: RPC sin comunidad elegida por cliente; verifica el identificador de comunidad esperado y entrega solo campos permitidos. Incluye observación cancelable que limpia carga/error y descarta respuestas después del desmontaje.
- `MembersPanel.tsx`: carga, vacío, error, actualización manual, contador, nombre/rol y marca propia. No permite editar integrantes ni navegar a perfiles ajenos. Montaje por usuario/comunidad.
- `CommunityPanel.tsx`: monta la lista tras pertenencia confirmada. `InvitationPanel.tsx` avisa cuando la lista consultada incorpora aceptaciones; la lista de integrantes se vuelve a consultar. Sin Realtime ni notificaciones nuevas.
- Migración `20261107233955_community_members.sql`, generada con Supabase CLI 3.0.0. Función privilegiada en esquema interno, auth.uid/membresía comprobados, search_path vacío y nombres cualificados. Wrapper público SECURITY INVOKER. EXECUTE de PUBLIC/anon revocado. Sin ampliar permisos de tablas de perfil/membresía ni introducir escrituras.

## Verificación observada

| Comprobación | Pasos/comando | Resultado | Límites |
| --- | --- | --- | --- |
| Servicios | `node --test src/features/auth/authService.test.cjs src/features/auth/observeSession.test.cjs src/features/profile/profileService.test.cjs src/features/community/communityService.test.cjs src/features/community/invitationService.test.cjs src/features/community/membersService.test.cjs` | 46 correctas; ocho nuevas de integrantes | Clientes simulados, sin montaje de React. |
| SQL | `node --test supabase/tests/own_profile.test.cjs supabase/tests/community_creation.test.cjs supabase/tests/community_invitations.test.cjs supabase/tests/community_members.test.cjs`, con PROFILE_SQL_RUNTIME de PGlite 0.5.15 | 38 casos SQL correctos, ocho de integrantes; Node cuenta además cuatro contenedores: 42 pruebas | PostgreSQL temporal con fixtures de Auth. No prueba Supabase Auth/PostgREST real ni teléfono. |
| TypeScript | `npm run typecheck` | Código 0 | Incluye interfaz y actualización desde invitaciones. |
| Exportación | `npm run export` fuera del sandbox | Android, iOS y web; código 0 | No acredita ejecución en teléfono. |
| Revisión de cambios | `git diff --check` | Correcta | No altera staging. |
| Proyecto remoto, asesores e interfaz privada real | No ejecutados | Pendientes | El conector no tiene acceso al proyecto de .env. El usuario no dispone de teléfono. No se crearon cuentas reales. |

Se comprobó en SQL que ambos participantes consultan igual composición después de aceptación repetida, con marca propia diferente; otra comunidad solo obtiene sus miembros. Antes de aceptar no se accede. Los campos devueltos son exactamente nombre, rol y marca propia. SELECT de perfiles/membresías ajenos sigue bloqueado. Consultar nuevamente refleja cambios confirmados del nombre.

## Cierre y continuidad

La migración no se aplica al proyecto compartido; acceso al proyecto correcto, inspección de esquema, asesores, pruebas reales y teléfono siguen pendientes. Siguiente tarea: documentar/entregar los contratos de sesión, usuario, comunidad y membresía para personas 2–5. No cerrar el issue principal sin contratos compartidos ni verificación integrada.

Archivos propuestos para git add humano:

- `README.md`, `docs/recorridos.md`, `docs/tareas/README.md`, `docs/tareas/T01-5-integrantes.md`.
- `src/features/community/CommunityPanel.tsx`, `src/features/community/InvitationPanel.tsx`, `src/features/community/README.md`, `src/features/community/MEMBERS.md`, `src/features/community/MembersPanel.tsx`, `src/features/community/membersService.ts`, `src/features/community/membersService.test.cjs`.
- `supabase/README.md`, `supabase/migrations/20261107233955_community_members.sql`, `supabase/tests/community_members.test.cjs`.

Mensaje sugerido: `feat(community): mostrar integrantes con acceso limitado a su comunidad`.

No se ejecutaron git add, commit, push, despliegues ni cambios remotos.
