# Invitaciones por código — T01.4

Reglas aprobadas en D17–D19. `InvitationPanel` se monta en `CommunityPanel` bajo la sesión validada. El módulo no guarda invitaciones offline ni usa datos ficticios cuando falla el backend.

## Flujo

El representante autorizado con membresía de representante busca el código UUID completo. La respuesta solo incluye nombre visible y código. No se permite buscar por nombre ni enumerar perfiles.

El envío recibe únicamente ese código. El backend obtiene actor y comunidad de la sesión y comprueba autorización/membresía. Una invitación pendiente repetida devuelve la misma fila. Tras rechazo se puede enviar una nueva. No se invita a usuarios que ya pertenecen a alguna comunidad, ni a uno mismo.

El destinatario consulta comunidad invitante y estado sin acceder a las tablas de comunidad antes de aceptar. Solo él acepta/rechaza. Una operación repetida sobre un estado final devuelve ese estado, incluso si solicita la acción contraria: no se reabre ni transforma una invitación procesada. La interfaz muestra el estado devuelto por backend.

Aceptar inserta la membresía y actualiza la invitación en una sola transacción. Un fallo revierte ambas escrituras; aceptar otra comunidad cuando ya existe pertenencia se rechaza y deja la invitación pendiente, disponible para rechazar. El bloqueo del perfil y la PK de membresías mantienen la regla de una comunidad por usuario. Las invitaciones a distintas comunidades pueden estar pendientes; no se implementó su rechazo automático porque esa regla no fue acordada.

El panel tiene carga, vacío, errores, actualización manual y bloqueo de solicitudes repetidas. No implementa notificaciones push ni Realtime. Tras aceptar se consulta de nuevo la pertenencia; el otro participante actualiza su lista para ver la respuesta confirmada. La búsqueda se limpia al cambiar el código y el estado se desmonta por usuario.

## Backend revisable

Migración posterior a perfil y creación: `supabase/migrations/20261107232444_community_invitations.sql`. No aplicada al proyecto compartido.

- Tabla `community_invitations` con RLS y sin permisos directos para PUBLIC/anon/authenticated. Los estados no se escriben desde el cliente.
- Índice único parcial por comunidad/destinatario mientras está pendiente.
- Funciones públicas SECURITY INVOKER: `find_neighbor`, `send_invitation`, `get_my_invitations`, `process_invitation`.
- Operaciones privilegiadas en `community_internal`, que debe mantenerse fuera de Data API, con search_path vacío, nombres cualificados y validación de auth.uid/actores. No se confía en metadatos editables.
- Funciones auxiliares sin EXECUTE para clientes. El renderizador no permite escoger otra identidad para obtener invitaciones.
- Búsqueda/envío comprueban autorización administrativa vigente y membresía representante. Retirar autorización bloquea estas operaciones y la consulta saliente. No se implementó cancelación automática de invitaciones previamente emitidas; el destinatario todavía puede procesarlas.
- Listado entrante limitado al destinatario. Listado saliente limitado al remitente autorizado de la comunidad, con nombre del destinatario ya buscado; no expone correo, dirección, código ajeno nuevo ni perfiles completos.

No confundir la protección de funciones con las políticas de tablas: no se concede SELECT a la tabla para después filtrar en cliente. Cada operación privilegiada valida su alcance en backend. Los asesores e inspección del esquema remoto están pendientes de acceso al proyecto correcto.

## Comprobación

```powershell
node --test src/features/auth/authService.test.cjs src/features/auth/observeSession.test.cjs src/features/profile/profileService.test.cjs src/features/community/communityService.test.cjs src/features/community/invitationService.test.cjs
```

38 pruebas de servicios correctas; nueve nuevas de invitaciones. Clientes simulados: no equivalen a Supabase real.

Con PROFILE_SQL_RUNTIME configurado para el PGlite 0.5.15 temporal descrito en `src/features/profile/README.md`:

```powershell
node --test supabase/tests/own_profile.test.cjs supabase/tests/community_creation.test.cjs supabase/tests/community_invitations.test.cjs
```

30 casos SQL correctos, once de invitaciones. Node cuenta además tres contenedores: 33 pruebas. Se prueba el flujo representante/destinatario/tercero y una segunda comunidad, privacidad de búsqueda y listas, rechazo/reenvío, procesamiento repetido/contrario, miembro existente, bloqueo de escritura directa y reversión ante fallo. La base ejecuta PostgreSQL con fixtures de Auth; no demuestra Supabase Auth/PostgREST, concurrencia entre conexiones reales ni teléfono.

## Pendiente

Inspeccionar y aplicar las tres migraciones en orden en el proyecto exacto del equipo, ejecutar asesores y probar con cuentas reales y teléfono. Conectar el listado de integrantes y acordar los contratos consumidos por otros módulos en tareas posteriores. El issue #1 permanece abierto.
