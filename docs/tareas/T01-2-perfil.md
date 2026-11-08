# T01.2 — Perfil propio y código personal

- Grupo: G01. Responsable humano: Persona 1, nombre y GitHub pendientes. Agente: Codex.
- Issue: https://github.com/Fabrizio7S/Hackthon-2026/issues/1
- Rama: `feature/accesos-perfiles-comunidades`.
- Estado: implementada; comprobación local parcial. Migración compartida, integración remota, portapapeles y teléfono pendientes.
- Dependencias: T01.1; Q03 resuelta en D17. Q01/Q02 resueltas en D18/D19 para tareas posteriores.

## Resultado

Como vecino autenticado, puedo guardar y editar mi nombre visible, consultar mi correo privado y consultar/copiar mi código generado por el servidor. Otro usuario no puede leer ni editar mi perfil completo.

## Alcance y coordinación

Incluye pantalla, estado, acceso a datos y migración revisable de perfil. No incluye búsqueda de vecinos, roles, comunidades ni invitaciones. No se incorpora una base offline de perfiles.

G01 modifica `src/features/profile/`, monta la pantalla en el flujo privado de `src/app/AppRoot.tsx`, añade Expo Clipboard compatible con SDK 58 y mantiene package-lock.json. Documentos de decisiones, índice y README se actualizan con el estado real. Persona 5 debe revisar el punto de integración cuando esté disponible; no se introducen rutas ni contratos de comunidad.

La migración `supabase/migrations/20261107230506_own_profile.sql` se creó con Supabase CLI 3.0.0. No se aplica al servicio compartido: el conector conectado no tiene acceso al proyecto de .env y debe inspeccionarse su esquema antes de aplicar cambios. Docker está instalado, pero su motor no está disponible en esta sesión.

## Aceptación

- Nombre obligatorio, sin datos de ubicación ni contacto adicionales; límites técnicos documentados en el módulo.
- Crear o editar el perfil propio; mostrar carga, vacío, error y reintento.
- Código UUID generado en backend, único e inalterable mediante permisos de columnas.
- Copiar únicamente un código confirmado por el backend y mostrar errores de portapapeles.
- Doble pulsación y reintentos no crean dos perfiles ni cambian el código.
- RLS limita lectura, creación y edición al propietario. No hay permiso de borrar ni de editar identidad/código desde el cliente.
- Cerrar o cambiar sesión desmonta y limpia el estado del perfil; los resultados atrasados no muestran datos de la cuenta anterior.

## Implementación y verificación observada

- Pantalla montada en la vista autenticada, con clave por usuario para desmontar el estado al cambiar de cuenta. No almacena perfiles offline y descarta resultados después del desmontaje o de un reintento posterior.
- Consulta/creación/edición con cliente único inyectado; identidad y código nunca forman parte de los datos enviados para escritura. La recuperación de una creación ya confirmada evita generar otro código al reintentar.
- Nombre de 1 a 100 caracteres Unicode y una línea como límite técnico. Backend y cliente validan contenido. Portapapeles mediante Expo Clipboard 58.0.4, compatible según el mapa local de SDK 58; errores y selección manual contemplados.
- Migración sin funciones privilegiadas ni vistas: tabla, restricciones, RLS y privilegios por columna. No incluye correo, ubicación o roles ni permite DELETE al cliente. Se revisaron permisos de SELECT/INSERT/UPDATE y predicados USING/WITH CHECK.

| Comprobación | Comando/pasos | Resultado | Límite |
| --- | --- | --- | --- |
| Servicios de auth/perfil | `node --test src/features/auth/data/authService.test.cjs src/features/auth/model/observeSession.test.cjs src/features/profile/data/profileService.test.cjs` | 22 correctas, ocho nuevas del perfil | Cliente simulado; no equivale a integración remota. |
| Permisos SQL | `node --test supabase/tests/own_profile.test.cjs`, con PROFILE_SQL_RUNTIME apuntando a PGlite 0.5.15 temporal | Nueve casos SQL correctos; Node cuenta diez incluyendo su contenedor | PostgreSQL real embebido con auth.users/auth.uid y roles de prueba; no Supabase Auth/PostgREST real. Instrucciones reproducibles en src/features/profile/README.md. |
| TypeScript | `npm run typecheck` | Código 0 | Sin pruebas visuales del formulario privado. |
| Exportación | `npm run export`, fuera del sandbox | Android, iOS y web; código 0 | No demuestra funcionamiento en teléfono ni backend preparado. |
| Revisión de cambios | `git diff --check` | Correcta | Sin cambios a staging. |
| Supabase remoto | No ejecutada migración ni pruebas de datos | Pendiente | Conector conectado sin acceso al proyecto de .env. Se debe inspeccionar el esquema antes de aplicar. Asesores de seguridad remotos pendientes. |
| Teléfono y copiar código | No ejecutados | Pendientes | El usuario informó que no dispone de teléfono en esta sesión. |

No se crearon cuentas remotas ni se presentan datos de ejemplo como integración. Si falta la tabla, la pantalla muestra un error de disponibilidad y permite reintentar; no muestra un código ficticio.

## Continuidad

La aplicación de la migración y las pruebas reales requieren acceso al proyecto correcto, inspección previa y coordinación de esquema. No usar otro proyecto accesible como sustituto. No pedir ni guardar claves administrativas en código o documentación.

No cerrar el issue principal con el perfil, comunidades, invitaciones o pruebas nativas pendientes.

## Revisión humana

- Archivos propuestos para git add humano: `README.md`, `docs/decisiones.md`, `docs/recorridos.md`, `docs/tareas/README.md`, `docs/tareas/T01-2-perfil.md`, `package.json`, `package-lock.json`, `src/app/AppRoot.tsx`, `src/features/profile/components/ProfilePanel.tsx`, `src/features/profile/hooks/useProfile.ts`, `src/features/profile/data/profileService.ts`, `src/features/profile/data/profileService.test.cjs`, `src/features/profile/README.md`, `supabase/README.md`, `supabase/migrations/20261107230506_own_profile.sql`, `supabase/tests/own_profile.test.cjs`.
- Mensaje sugerido: `feat(profile): añadir perfil propio y código personal con RLS`.
- No se ejecutaron git add, commit, push ni despliegues. El issue #1 permanece abierto.
