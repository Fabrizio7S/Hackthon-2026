# Autenticación independiente — T01.1

Implementación parcial del issue #1. No está montada en `App.tsx` y no restaura sesiones entre aperturas con la configuración actual del cliente compartido.

## Piezas

- `AuthPanel.tsx`: formulario de registro/inicio y vista mínima de sesión/cierre; recibe `client: SupabaseClient | null`.
- `useAuth.ts`: estado interno, lectura inicial, suscripción y reintento. La suscripción se cancela al desmontar; un resultado inicial atrasado no sobrescribe un evento posterior.
- `observeSession.ts`: observación interna comprobable sin React. Los eventos posteriores prevalecen sobre la lectura inicial; `INITIAL_SESSION` no oculta sus errores.
- `authService.ts`: llamadas al cliente inyectado y exclusión de solicitudes simultáneas. El cierre solicita alcance `local`, correspondiente a la sesión actual.

No se recogen datos de perfil ni se asignan roles. El correo se recorta; la contraseña se envía sin transformaciones. La política de contraseña la valida Supabase. Los errores remotos se traducen sin mostrar diagnósticos internos.

## Integración pendiente con Persona 5

Cuando se coordine, montar `<AuthPanel client={supabase} />` desde el punto de entrada acordado usando el cliente único. Esta vista solo muestra el estado de acceso; no sustituye al guardián de rutas privadas de la aplicación integrada.

Antes de considerar completo el flujo:

- Configurar almacenamiento persistente, renovación y ciclo de vida en el cliente compartido; actualmente están desactivados.
- Confirmar proveedor de correo, política de contraseña y destino de confirmación en el proyecto compartido. No se han cambiado esos ajustes ni probado envíos.
- Acordar contrato global de sesión, protección de rutas y limpieza de cachés al cerrar/cambiar cuenta. `useAuth` es interno al módulo; no es el contrato aprobado para otros módulos.
- La lectura `getSession()` representa el estado del cliente; no acredita autorización en backend. Los datos privados requieren permisos/RLS y comprobaciones reales.
- Coordinar navegación atrás, retorno de confirmación y montaje de una única fuente global de sesión. Verificarlo en teléfono.

## Comprobación local

Desde la raíz:

```powershell
node --test src/features/auth/authService.test.cjs src/features/auth/observeSession.test.cjs
npm run typecheck
npm run export
```

Ejecutar typecheck y export por separado. Las 12 pruebas usan un cliente simulado; verifican validación, registro pendiente de confirmación, bloqueo, reintento, errores y orden de eventos de sesión. Incluyen cierre durante lectura inicial, error inicial, cancelación y cambio de cuenta. No prueban el montaje de React, persistencia, correo, conexión real ni autorización de Supabase.
