# T01.3 — Crear comunidad como representante autorizado

- Grupo: G01; Persona 1 (nombre/GitHub pendientes), agente Codex.
- Issue: https://github.com/Fabrizio7S/Hackthon-2026/issues/1
- Rama: `feature/accesos-perfiles-comunidades`.
- Estado: implementada; verificación local parcial. Migración, asesores y pruebas reales del proyecto compartido pendientes.
- Decisiones: D17–D19. Depende de T01.2 y su migración.

## Resultado y alcance

Como representante autorizado manualmente en backend, puedo crear una comunidad y quedar incorporado como representante en una sola transacción. Como vecino, puedo consultar mi pertenencia y distinguir el estado sin comunidad.

Incluye autorización verificable por servidor, creación, pertenencia propia, interfaz, migración y pruebas. Excluye invitaciones, búsqueda de vecinos, listado de integrantes, cambios de rol, salida/eliminación y contratos de otros módulos. Estas partes corresponden a tareas siguientes.

## Archivos y coordinación

G01 modifica `src/features/community/`, monta el panel en la vista autenticada de `AuthPanel.tsx`, crea la migración posterior a perfil y actualiza el índice/documentación. No añade dependencias ni cambia el cliente Supabase. El montaje temporal sigue el flujo autorizado de G01; Persona 5 debe revisar la integración cuando esté disponible.

No se aplica el esquema compartido: sigue pendiente acceso al proyecto correcto, inspección del esquema y coordinación de aplicación. La autorización manual requiere comprobar al representante del sector fuera del cliente y registrar su UUID desde una conexión administrativa; no hay botón para concederse permisos.

## Aceptación

- Solo el representante autorizado con perfil completo crea comunidad.
- Comunidad y membresía se guardan juntas; errores no dejan comunidades huérfanas.
- Una comunidad por usuario, también ante reintentos. Repetir la creación con el mismo nombre devuelve la misma comunidad, sin duplicar filas.
- Un cliente no modifica autorizaciones, comunidades, membresías ni roles mediante tablas directas.
- Los datos de comunidad solo son visibles a sus integrantes; no se exponen perfiles ajenos.
- Carga, vacío, validación, error, reintento y bloqueo inmediato de doble envío.
- Estado privado desmontado al cerrar/cambiar sesión; resultados atrasados descartados.

## Implementación

- `communityService.ts`: estado y creación mediante RPC; el único argumento de escritura es el nombre. Valida que la respuesta corresponda al usuario actual y no acepta roles desconocidos.
- `useCommunity.ts`: carga, error, actualización y bloqueo inmediato de doble envío. Descarta resultados atrasados; si el perfil cambia durante una creación, vuelve a consultar al confirmar.
- `CommunityPanel.tsx`: estado sin comunidad, perfil pendiente, formulario para representante autorizado y consulta de pertenencia propia. No hay botón para concederse autorización.
- `AuthPanel.tsx` monta el panel por usuario. `ProfilePanel.tsx` notifica solo un guardado confirmado para actualizar la comunidad; `useProfile.ts` devuelve éxito sin cambiar las reglas de perfil.
- Migración generada por Supabase CLI 3.0.0: `20261107231438_community_creation.sql`. Tablas de comunidad/membresía sin escritura directa del cliente, RLS, autorizaciones en esquema interno y creación atómica con bloqueo de perfil.
- La elevación necesaria para crear ambas filas está acotada a una función SECURITY DEFINER en `community_internal`, con auth.uid verificado, autorización manual, search_path vacío y nombres cualificados. Las funciones públicas son SECURITY INVOKER. EXECUTE de PUBLIC/anon está revocado; no se confía en metadatos editables.

## Verificación observada

| Comprobación | Pasos/comando | Resultado | Límites |
| --- | --- | --- | --- |
| Servicios | `node --test src/features/auth/authService.test.cjs src/features/auth/observeSession.test.cjs src/features/profile/profileService.test.cjs src/features/community/communityService.test.cjs` | 29 correctas; siete de comunidad | Clientes simulados. No prueban montaje de React ni integración remota. |
| SQL | `node --test supabase/tests/own_profile.test.cjs supabase/tests/community_creation.test.cjs` con PROFILE_SQL_RUNTIME de PGlite 0.5.15 | 19 casos correctos: diez de comunidad y nueve de perfil; Node cuenta además dos contenedores, total 21 | PostgreSQL embebido, identidades/Auth de prueba. No equivale a Supabase Auth/PostgREST ni concurrencia real entre conexiones. |
| TypeScript | `npm run typecheck` | Código 0 | Incluye la pantalla y conexión al guardado del perfil. |
| Exportación | `npm run export` fuera del sandbox | Android, iOS y web; código 0 | No sustituye teléfono. |
| Integración remota | No ejecutada | Pendiente | Acceso al proyecto correcto, inspección del esquema, migraciones en orden, autorización administrativa de una cuenta y asesores pendientes. |
| Teléfono/interfaz privada | No ejecutados | Pendientes | El usuario indicó que no dispone de teléfono. No se crearon cuentas remotas. |

Los casos SQL verifican también denegación de autoasignación, metadatos falsos, aislamiento entre comunidades, miembro ya incorporado y reversión de la primera escritura cuando falla la segunda. Se comprobaron SECURITY INVOKER/DEFINER, esquema no expuesto, grants, RLS y actores al revisar el SQL. No se ejecutaron asesores remotos por falta de acceso.

## Cierre y continuación

Siguiente tarea: búsqueda por código e invitaciones bajo D17–D19. El listado de integrantes y los contratos de consumidores siguen pendientes. Antes de aplicar en remoto, inspeccionar el proyecto exacto, revisar el esquema y coordinar ambas migraciones; no usar otro proyecto como sustituto.

La prueba SQL temporal no equivale a Supabase Auth/PostgREST. No cerrar el issue principal con invitaciones, contratos o pruebas reales pendientes.

Archivos propuestos para revisión y git add humano:

- `README.md`, `docs/tareas/README.md`, `docs/tareas/T01-3-crear-comunidad.md`.
- `src/features/auth/AuthPanel.tsx`, `src/features/profile/ProfilePanel.tsx`, `src/features/profile/useProfile.ts`.
- `src/features/community/communityService.ts`, `src/features/community/communityService.test.cjs`, `src/features/community/useCommunity.ts`, `src/features/community/CommunityPanel.tsx`, `src/features/community/README.md`.
- `supabase/README.md`, `supabase/migrations/20261107231438_community_creation.sql`, `supabase/tests/community_creation.test.cjs`.

Mensaje sugerido: `feat(community): crear comunidades con autorización de representante`.

No se ejecutaron git add, commit, push, despliegues ni cambios remotos.
