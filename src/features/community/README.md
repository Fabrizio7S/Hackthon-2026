# Creación de comunidad — T01.3

Describe T01.3: creación y pertenencia propia bajo D18/D19. T01.4 añade invitaciones (`INVITATIONS.md`) y T01.5 el listado mínimo de integrantes (`MEMBERS.md`). El estado privado se monta por usuario en AuthPanel, no se guarda offline y descarta respuestas al desmontar o recargar.

## Interfaz y datos

- Un representante autorizado con perfil completo ve el formulario de creación. Nombre de 1 a 100 caracteres Unicode, en una sola línea.
- Un usuario sin comunidad ve el estado vacío. Si necesita perfil, se indica; al guardarlo se actualiza automáticamente la consulta de comunidad.
- La vista muestra nombre de comunidad y rol propios solo después de respuesta del servidor.
- Carga, error, actualización manual y bloqueo de solicitudes simultáneas implementados. No se anuncian como disponibles las invitaciones, todavía pendientes.

`communityService.ts` reutiliza los contratos de membresía/rol de `src/shared/identity.ts`. Los contextos compartidos se usan ya en G01; su guía y revisión pendiente por personas 2–5 están en `docs/contratos-identidad.md`.

## Migración y seguridad

`supabase/migrations/20261107231438_community_creation.sql` requiere primero la migración de perfil. Está preparada y probada localmente; no se aplicó al proyecto compartido.

- `community_internal.representative_authorizations`: solo se escribe desde una conexión administrativa de confianza; el cliente puede consultar únicamente su propia autorización. Mantener `community_internal` fuera de Data API.
- `communities`: SELECT solo para miembros; sin escritura directa del cliente.
- `memberships`: clave primaria por usuario, que impide pertenecer a dos comunidades; un representante por comunidad. De momento cada usuario consulta únicamente su propia fila, sin exponer otros perfiles o integrantes.
- `get_my_community()`: función pública SECURITY INVOKER, devuelve autorización/perfil y pertenencia propios.
- `create_community(p_name)`: envoltorio público SECURITY INVOKER. La escritura atómica se realiza en una función SECURITY DEFINER dentro del esquema no expuesto, con search_path vacío y nombres cualificados. Comprueba auth.uid(), autorización manual y perfil; no confía en metadatos editables ni acepta actor/rol como parámetros.
- La operación bloquea el perfil propio durante la transacción. La futura aceptación de invitaciones debe adquirir el mismo bloqueo antes de crear una membresía. La PK es una segunda protección contra dos comunidades.
- Repetir la creación con igual nombre normalizado devuelve la comunidad existente; otro nombre o una pertenencia como miembro se rechazan. Esto no implementa renombrado.
- Se revoca EXECUTE de PUBLIC/anon en todos los puntos de entrada. Los clientes no insertan/actualizan/borran comunidades, membresías o autorizaciones.

La elevación acotada es necesaria para escribir comunidad y rol conjuntamente sin dar privilegios de tabla al cliente. No se emplea para evitar una política fallida. Los asesores remotos y la inspección de políticas actuales siguen pendientes por falta de acceso al proyecto del equipo.

## Autorizar a un representante

Después de revisar/aplicar las migraciones en el proyecto correcto, un administrador debe verificar que la persona representa al sector y obtener su UUID en Supabase Auth. La aplicación no concede esa autorización.

Plantilla para ejecutar únicamente desde la conexión administrativa del proyecto, sustituyendo el marcador por el UUID verificado:

```sql
insert into community_internal.representative_authorizations(user_id)
values ('UUID_VERIFICADO'::uuid)
on conflict (user_id) do nothing;
```

No se ha ejecutado esta plantilla en remoto ni se ha autorizado a cuentas reales. No usar service_role o claves secretas en la app. Retirar la fila de autorización impide nuevas llamadas de creación, pero no borra datos ni redefine por sí solo la membresía histórica.

## Pruebas

```powershell
node --test src/features/auth/authService.test.cjs src/features/auth/observeSession.test.cjs src/features/profile/profileService.test.cjs src/features/community/communityService.test.cjs
```

29 pruebas de servicios correctas; siete nuevas de comunidad. Clientes simulados, no integración real.

Para PostgreSQL temporal, usar la instalación PGlite 0.5.15 y PROFILE_SQL_RUNTIME descritas en `src/features/profile/README.md`:

```powershell
node --test supabase/tests/own_profile.test.cjs supabase/tests/community_creation.test.cjs
```

19 casos SQL correctos (Node cuenta además dos contenedores: 21 pruebas). Los diez casos de comunidad prueban autorización, denegación de autoasignación y metadatos falsos, perfil obligatorio, validación, repetición, aislamiento entre comunidades, permisos de tablas, reversión de una creación incompleta, miembro ya incorporado, retirada de autorización y anon.

PGlite ejecuta PostgreSQL con fixtures de auth y roles. No verifica Supabase Auth, PostgREST, permisos efectivos del proyecto remoto ni concurrencia real entre conexiones. Para esta última, probar creación simultánea desde dos sesiones del mismo usuario y confirmar una sola comunidad/membresía en el proyecto de prueba.

## Siguiente integración

Inspeccionar primero el esquema del proyecto exacto de .env; revisar y aplicar las migraciones en el orden documentado en `supabase/README.md`, mantener el esquema interno no expuesto y ejecutar asesores. Probar con representante autorizado, vecino y cuenta ajena. Teléfono pendiente; el usuario indicó que no dispone de uno en esta sesión. El issue #1 sigue abierto para recepción/revisión de contratos y pruebas reales pendientes.
