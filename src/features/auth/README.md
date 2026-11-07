# Autenticación — T01.1

Implementación parcial del issue #1, montada en `App.tsx`. Persistencia y renovación configuradas en el cliente compartido; recorrido completo con cuenta real y teléfono pendiente.

## Piezas

- `AuthPanel.tsx`: formulario de registro/inicio y vista mínima de sesión/cierre; recibe `client: SupabaseClient | null`.
- `useAuth.ts`: estado interno, lectura inicial, suscripción y reintento. La suscripción se cancela al desmontar; un resultado inicial atrasado no sobrescribe un evento posterior.
- `observeSession.ts`: observación interna comprobable sin React. Comprueba identidad con `getUser(jwt)` antes de mostrar sesión. Los eventos posteriores prevalecen sobre la lectura inicial y las verificaciones atrasadas; `INITIAL_SESSION` no oculta errores.
- `authService.ts`: llamadas al cliente inyectado y exclusión de solicitudes simultáneas. El cierre solicita alcance `local`, correspondiente a la sesión actual.

No se recogen datos de perfil ni se asignan roles. El correo se recorta; la contraseña se envía sin transformaciones. La política de contraseña la valida Supabase. Los errores remotos se traducen sin mostrar diagnósticos internos.

## Integración actual y límites

`App.tsx` monta `<AuthPanel client={supabase} />` usando el cliente único. Esta vista muestra el acceso y una sesión mínima. No existen todavía rutas de perfil/comunidad. El contenido de sesión se retira mientras se comprueba la identidad o al cerrarla. El botón Atrás de Android vuelve de registro a inicio; durante un envío no cambia de formulario.

Antes de considerar completo el flujo:

- Comprobar en teléfono la persistencia AsyncStorage y la renovación configuradas. En web se usa el almacenamiento del SDK. No se registra la contraseña; AsyncStorage no cifra en reposo.
- La consulta pública de ajustes del proyecto confirmó correo y registro habilitados, con confirmación automática activa. No se cambiaron ajustes ni se crearon cuentas. La política de contraseña sigue validándose en backend.
- Acordar contrato global de sesión, protección de rutas y limpieza de cachés al cerrar/cambiar cuenta. `useAuth` es interno al módulo; no es el contrato aprobado para otros módulos.
- La lectura `getSession()` representa el estado del cliente y se verifica con `getUser(jwt)`. Los datos de futuros módulos requieren además permisos/RLS. Un error de red bloquea la vista de sesión y ofrece reintento/cierre de sesión guardada; no hay acceso privado offline.
- Coordinar navegación atrás, retorno de confirmación y montaje de una única fuente global de sesión. Verificarlo en teléfono.

## Comprobación local

Desde la raíz:

```powershell
node --test src/features/auth/authService.test.cjs src/features/auth/observeSession.test.cjs
npm run typecheck
npm run export
```

Ejecutar typecheck y export por separado. Las 14 pruebas usan un cliente simulado; verifican validación, registro pendiente de confirmación, bloqueo, reintento, errores y orden de eventos de sesión. Incluyen cierre durante lectura/verificación, error inicial, cancelación, cambio de cuenta y rechazo de identidad. No prueban el montaje de React, persistencia ni autorización real de Supabase.

En navegador local se comprobaron formulario, validaciones, controles deshabilitados durante envío, cambio inicio/registro y error de credenciales ficticias contra el backend real. No se creó ninguna cuenta. Esta prueba no demuestra registro ni restauración reales. La exportación Android/iOS/web pasó fuera del sandbox; dentro del entorno restringido Hermes falló con código 6.
