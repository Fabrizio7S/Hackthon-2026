# T01.1 — Autenticación por correo y contraseña

- Grupo: G01. Responsable humano: Persona 1, nombre y usuario pendientes. Agente: Codex.
- Issue: https://github.com/Fabrizio7S/Hackthon-2026/issues/1
- Rama: `feature/accesos-perfiles-comunidades`.
- Estado: implementada, verificación funcional parcial; pruebas de registro, persistencia y cierre con cuenta real y teléfono pendientes.
- Acuerdo: correo y contraseña, registrado en D16. Q01–Q03 siguen pendientes.

## Resultado y alcance

El vecino puede abrir el formulario de registro/inicio desde App.tsx. El módulo implementa validaciones, carga, errores, bloqueo de solicitudes repetidas, lectura y comprobación de sesión, persistencia, renovación y cierre local de sesión.

No incluye perfil, código personal, comunidades, roles, invitaciones, sus contratos o migraciones. El issue principal permanece abierto.

## Coordinación y archivos

Inicialmente el usuario pidió una propuesta sin modificar archivos compartidos; después autorizó las piezas independientes. Tras explicar los cambios necesarios, su indicación de continuar se tomó como autorización para esta integración local de autenticación; se informó antes de editar. Persona 5 no ha revisado ni confirmado directamente estos cambios.

G01 modificó en esta iteración App.tsx, src/lib/supabase.ts, package.json, package-lock.json y los documentos de estado correspondientes. Antes de integrar la rama al trabajo del equipo, Persona 5 debe revisar punto de montaje, persistencia y ciclo de vida. No se introdujo una biblioteca de navegación ni se fijaron contratos de otros módulos.

## Implementación actual

- `App.tsx` monta AuthPanel y coordina renovación nativa con AppState. Al desmontar elimina la suscripción y detiene la renovación nativa.
- `src/lib/supabase.ts` conserva el cliente único y el estado sin configuración. Habilita persistencia y renovación; nativo usa AsyncStorage 2.2.0, versión incluida en el mapa de compatibilidad de Expo SDK 58; web usa el almacenamiento del SDK. AsyncStorage no cifra en reposo. La contraseña no se guarda en este almacenamiento.
- `AuthPanel.tsx` presenta inicio, registro y sesión mínima. En Android, Atrás vuelve del registro al inicio y no cambia el formulario durante un envío. Si la restauración falla, ofrece reintento y cierre de la sesión guardada.
- `authService.ts` valida correo y contraseña no vacía, sin transformar la contraseña. Supabase aplica su política de complejidad. Excluye operaciones simultáneas y permite reintentar tras error. Cierre con alcance local; no cierra las sesiones de otros dispositivos.
- `observeSession.ts` comprueba identidad con `getUser(jwt)` antes de mostrar una sesión. Mientras verifica, o si falla la red/identidad, no muestra la vista de sesión. Los eventos posteriores prevalecen sobre resultados atrasados. El desmontaje cancela la recepción de resultados y libera la suscripción.
- `useAuth.ts` mantiene una única fuente interna de sesión para el panel montado. No se expusieron contratos compartidos de perfil/comunidad.
- No existen todavía cachés privadas de otros módulos. El cierre retira la identidad de la vista y el SDK elimina su sesión guardada. La limpieza de futuras cachés requiere integración explícita con sus propietarios.
- No hay acceso privado offline implementado. Una sesión guardada requiere comprobar identidad al recuperar la vista.

## Configuración remota observada

Se consultó únicamente `/auth/v1/settings` del proyecto configurado en .env, el 2026-11-07. Resultado: proveedor de correo habilitado, registro habilitado y confirmación automática activa. No se modificaron ajustes ni se crearon cuentas. No se copiaron credenciales a documentación o logs.

El registro sin sesión muestra un mensaje de confirmación pendiente si la configuración del proyecto cambia. No se verificó envío de correos ni retorno por enlace; esos ajustes deben coordinarse antes de exigir confirmación.

La versión instalada de auth-js documenta que `processLock` está obsoleto y no es necesario configurar ese bloqueo; no se añadió. Se consultaron además las guías oficiales de Supabase. La lectura del índice de changelog quedó limitada por el entorno de red.

## Verificación observada

| Comprobación | Pasos o comando | Resultado | Límite |
| --- | --- | --- | --- |
| Pruebas unitarias | `node --test src/features/auth/data/authService.test.cjs src/features/auth/model/observeSession.test.cjs` | 14 correctas | Cliente simulado. Incluyen validación, normalización, registro sin sesión, doble envío, reintento, cierre local, error inicial, cancelación, cambio de cuenta, rechazo de identidad y verificación atrasada. No equivalen a backend real. |
| TypeScript | `npm run typecheck`, por separado | Correcto | Incluye código integrado. |
| Exportación | `npm run export` fuera del sandbox | Android, iOS y web empaquetados; código 0 | Dentro del sandbox Hermes falló previamente con código 6. El fallo no se reprodujo fuera del entorno restringido. Exportar no demuestra funcionamiento en teléfono. |
| Web local | Navegador sobre Expo, formulario vacío y correo válido sin contraseña | Validaciones visibles correctas | Solo web. |
| Error real de acceso | Un intento de inicio con datos ficticios contra el proyecto configurado | Estado Enviando con botones deshabilitados; después error de credenciales y controles recuperados | No se creó cuenta ni se probó inicio exitoso. |
| Cambio de formulario | Inicio → registro → inicio | Correcto; contraseña y mensajes se limpian al cambiar | Atrás nativo pendiente de teléfono. |
| Ajustes de Auth | Consulta pública al proyecto | Correo y registro habilitados; confirmación automática activa | No acredita registro, restauración ni cierre reales. |
| Dependencias | `npm audit --json` | 5 avisos moderados en Expo/CLI/fingerprint/glob/minimatch | Sin altas ni críticas. No se hicieron actualizaciones ajenas a esta tarea. |
| Teléfono | Solicitada prueba al usuario | No disponible, según respuesta del usuario | Registro, reinicio, persistencia, renovación, cierre y cambio de cuenta reales pendientes. |

Evidencia visual del formulario en la carpeta local de visualizaciones de esta sesión; sin datos de cuenta. Las verificaciones web no sustituyen las nativas.

## Prueba pendiente en teléfono

1. Ejecutar `npm start -- --clear` y abrir en Expo Go compatible con SDK 58.
2. Registrar una cuenta de prueba propia y comprobar la vista de sesión.
3. Terminar por completo la app y abrirla de nuevo; comprobar restauración y renovación al volver del segundo plano.
4. Cerrar sesión; volver atrás y reiniciar no deben recuperar la vista anterior.
5. Entrar con otra cuenta; verificar que no aparezcan datos de la anterior.
6. Comprobar error de credenciales, pérdida de red, reintento, doble pulsación y Atrás desde registro.
7. Registrar dispositivo, pasos y resultados sin contraseñas, tokens ni datos privados.

## Continuidad y revisión humana

- Próximo paso: pruebas reales pendientes y revisión de integración con Persona 5 cuando esté disponible. No cerrar el issue #1.
- Perfil requiere Q03; comunidad e invitaciones requieren Q01 y Q02 antes de implementar reglas y permisos.
- Archivos propuestos para revisión y eventual git add humano: App.tsx, src/lib/supabase.ts, package.json, package-lock.json, src/app/AppRoot.tsx, src/features/auth/hooks/useAuth.ts, src/features/auth/model/observeSession.ts, src/features/auth/model/observeSession.test.cjs, src/features/auth/README.md, README.md, docs/decisiones.md, docs/tecnologia.md, docs/tareas/README.md y esta ficha.
- Mensaje sugerido: `feat(auth): integrar acceso y persistencia de sesión con Supabase`.
- No se ejecutaron git add, commit, push, migraciones ni despliegues.
