# Perfil propio — T01.2

Pantalla montada en la vista de sesión de `AuthPanel`, con clave de montaje igual al usuario. D17 define los datos y la privacidad; D18 y D19 aplicarán a la siguiente tarea de comunidades/invitaciones.

## Datos y permisos

- `display_name`: obligatorio, de 1 a 100 caracteres Unicode, sin controles ni saltos de línea. El cliente recorta espacios al guardar; el backend valida contenido y límite.
- `id`: UUID del usuario, tomado por defecto de `auth.uid()` en backend.
- `personal_code`: UUID aleatorio generado en PostgreSQL, único. No se crea un código de ejemplo en pantalla.
- Correo: se muestra desde la identidad autenticada y no se duplica en la tabla.

El cliente solo tiene privilegios de INSERT y UPDATE sobre `display_name`. RLS permite leer, crear y editar exclusivamente el perfil propio. No puede editar identidad/código ni borrar perfiles. No se incluyen campos de rol o ubicación.

El servicio recupera una fila ya creada antes de reintentar un guardado; la clave primaria impide duplicados y el código permanece estable. La pantalla muestra éxito solo tras respuesta de backend. No almacena perfiles offline. Al desmontar, los resultados pendientes no actualizan el estado; el montaje por usuario separa cuentas.

Expo Clipboard 58.0.4 copia únicamente el código confirmado. Se controla el resultado de la operación y se ofrece selección manual si falla. Copiar es una acción explícita del usuario; no se borra globalmente el portapapeles al cerrar sesión.

## Backend pendiente de aplicación

Migración revisable: `supabase/migrations/20261107230506_own_profile.sql`. Fue generada con Supabase CLI 3.0.0. No se ha aplicado al proyecto de .env; el conector conectado no tiene acceso a ese proyecto.

Antes de aplicar:

1. Identificar y abrir el proyecto exacto del equipo y revisar tablas, grants y políticas actuales, especialmente si existe `public.profiles`.
2. Revisar/coordinar esta migración con el responsable del esquema. No usar otro proyecto accesible como sustituto.
3. Aplicarla con el flujo de migraciones del equipo y conservar su registro. La migración no oculta una tabla existente con `IF NOT EXISTS` ni destruye datos ajenos.
4. Comprobar exposición de `public` en Data API y permisos efectivos; ejecutar los asesores de seguridad del proyecto.
5. Probar con dos cuentas y una tercera ajena: acceso propio, denegación de lectura/escritura ajena y de cambios a código/identidad, reintento de creación y edición sin cambiar código.

Sin la migración, el formulario informa que el perfil no está disponible. No se muestra una integración ficticia.

## Pruebas de servicios

```powershell
node --test src/features/auth/authService.test.cjs src/features/auth/observeSession.test.cjs src/features/profile/profileService.test.cjs
npm run typecheck
npm run export
```

Ejecutar typecheck y export por separado. Las 22 pruebas usan clientes simulados; ocho corresponden al servicio de perfil. No demuestran permisos reales de Supabase ni comportamiento del teléfono.

## Prueba SQL aislada

Se usa PostgreSQL embebido PGlite 0.5.15 en memoria. Se instala en TEMP, fuera de las dependencias de la app. Los tres usuarios, `auth.users`, `auth.uid()` y los roles son fixtures de prueba. Los permisos y RLS los ejecuta PostgreSQL, sin usar el proyecto remoto.

```powershell
$taskSqlRuntime = Join-Path $env:TEMP 'hackthon-profile-sql-runtime'
npm install --prefix $taskSqlRuntime --no-save --package-lock=false @electric-sql/pglite@0.5.15
$env:PROFILE_SQL_RUNTIME = Join-Path $taskSqlRuntime 'node_modules/@electric-sql/pglite'
node --test supabase/tests/own_profile.test.cjs
```

Resultado: nueve casos SQL correctos (Node cuenta además el contenedor del conjunto: diez pruebas). Verifica identidad/código generados, no duplicación, RLS con tres identidades, permisos de columnas, validación backend, ausencia de identidad y bloqueo de anon/DELETE. No reemplaza Supabase Auth/PostgREST ni pruebas sobre el proyecto compartido.

## Referencias consultadas

- [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Cambios de CLI v3](https://supabase.com/changelog/supabase-cli-v3): se comprobó la ayuda antes de generar la migración local. No se ejecutaron comandos remotos.
- [API de PGlite](https://pglite.dev/docs/api): `exec` aplica el SQL a la base temporal; `query` verifica permisos y datos.
