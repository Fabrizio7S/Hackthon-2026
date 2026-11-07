# T01.1 — Autenticación básica: piezas independientes

- Grupo: G01.
- Responsable humano: Persona 1; nombre y usuario pendientes. Agente: Codex.
- Issue: https://github.com/Fabrizio7S/Hackthon-2026/issues/1
- Rama observada: `feature/accesos-perfiles-comunidades`.
- Estado: implementación parcial; pruebas unitarias del servicio y TypeScript correctos. Integración y recorrido real pendientes.
- Autorización vigente: tras revisar la propuesta, el usuario autorizó desarrollar por separado los archivos propios del módulo. No modificar App.tsx, cliente Supabase, dependencias ni contratos compartidos hasta coordinar con Persona 5.
- Acuerdo del usuario en esta sesión: acceso mediante correo y contraseña. Pendiente de incorporar a decisiones.md cuando se coordine su edición.

## Resultado propuesto

Como vecino, puedo crear una cuenta con correo y contraseña, iniciar sesión, volver a abrir la aplicación conservando mi sesión y cerrarla para dejar de acceder al contenido privado.

Esta tarea comprende solo autenticación básica. Perfil, código personal, comunidades, roles, invitaciones y sus migraciones quedan para tareas posteriores; Q01–Q03 siguen pendientes.

## Análisis de la base

- `App.tsx` contiene únicamente la bienvenida; las nuevas piezas de autenticación no están montadas.
- `src/lib/supabase.ts` crea un cliente opcional y desactiva persistencia y renovación de sesión.
- Ya existen supabase-js y el polyfill de URL. No hay dependencia de almacenamiento persistente declarada.
- README y `.env.example` documentan las dos variables públicas necesarias. El usuario indica que los valores del proyecto están en su `.env` local; esto no acredita conexión ni configuración de Auth.
- Al iniciar no existía una ficha de G01. El issue coincide con el alcance proporcionado en el chat.

## Cambios propuestos para coordinar con Persona 5

| Archivo | Cambio y responsable propuesto |
| --- | --- |
| `App.tsx` | G01 incorpora el contenedor de acceso acordado con Persona 5; espera de restauración, acceso público y contenido privado separados. |
| `src/lib/supabase.ts` | G01 configura almacenamiento, persistencia, bloqueo de operaciones de Auth y renovación según ciclo de vida nativo. Mantener un único cliente. |
| `package.json`, `package-lock.json` | Añadir únicamente el adaptador de persistencia compatible con SDK 58, después del acuerdo con Persona 5. Revisar SecureStore para almacenamiento nativo y alternativa web; no fijar dependencia sin coordinación. |
| `docs/decisiones.md`, `docs/tareas/README.md`, `README.md` | Registrar método aprobado, estado real, configuración y pruebas reproducibles cuando se autorice editar los documentos compartidos. |

Archivos propios previstos bajo `src/features/auth/`: pantalla de acceso, estado de sesión y servicio de autenticación, separados según la estructura acordada. Crear solo los necesarios durante la implementación.

No introducir biblioteca de navegación ni modificar `app.json` sin coordinación adicional. Si se requiere retorno por enlace de confirmación, acordar previamente su configuración.

## Secuencia de implementación propuesta

1. Confirmar con Persona 5 los archivos compartidos, almacenamiento y punto de montaje. Identificar el proyecto ya configurado sin copiar valores de `.env` a documentación ni registros.
2. Revisar en ese proyecto el proveedor de correo, política de contraseña, confirmación de correo, URL de confirmación y límites de envío. No desactivar confirmación ni cambiar configuración remota por conveniencia.
3. Implementar acceso a Supabase Auth: registro, inicio y cierre. Validar formato de correo y campos vacíos; aplicar la política de contraseña acordada con el backend. Diferenciar registro pendiente de confirmación de sesión iniciada.
4. Implementar estado de sesión: restauración inicial, suscripción a cambios, renovación al volver al primer plano y cancelación de suscripciones al desmontar. Manejar fallos y reintentos sin conceder acceso privado por error.
5. Implementar formulario en español, carga, errores comprensibles y bloqueo inmediato de solicitudes repetidas. No guardar ni registrar la contraseña fuera del envío a Auth.
6. Montar el flujo coordinado: durante restauración no mostrar contenido privado; al cerrar o cambiar de usuario desmontar el árbol privado. Acordar la limpieza de cachés con Persona 5 antes de que otros módulos guarden datos.
7. Ejecutar verificaciones técnicas por separado y comprobar el recorrido real en teléfono. Actualizar esta ficha con evidencia, sin cerrar el issue principal.

## Contrato de sesión para revisar, todavía no aprobado

- Estados: inicializando, sin sesión, autenticado y error de restauración.
- Identidad mínima: identificador de Supabase Auth; correo solo para la interfaz que lo necesite.
- Acciones: iniciar, registrar, cerrar y reintentar restauración.
- La pantalla no recibe tokens ni decide roles. El backend mantiene autorización mediante permisos/RLS cuando se incorporen datos.
- El registro sin sesión requiere confirmación; no debe abrir pantallas privadas.
- La limpieza de datos privados debe completarse o restringir su acceso antes de presentar otra cuenta. No prometer limpieza de cachés que todavía no existen.

## Aceptación de T01.1

- Registro e inicio reales con correo y contraseña conforme a la configuración del proyecto.
- Campos inválidos, credenciales incorrectas, falta de red y reintento muestran estados comprensibles.
- Doble pulsación no dispara solicitudes simultáneas.
- Tras terminar y abrir la app en teléfono se restaura una sesión válida; la renovación y los errores no dejan contenido privado accesible indebidamente.
- Cerrar sesión y volver atrás no permite recuperar la pantalla privada de la cuenta anterior.
- Una cuenta distinta no recibe estado privado de la anterior.
- Si se exige confirmar correo, se prueba el mensaje y la confirmación real antes del inicio.
- No confundir estas pruebas con las de invitación/membresía, que corresponden a tareas posteriores.

## Verificación observada de la base, sin cambios funcionales

| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Estado inicial | `git status --short` | Limpio | No se alteró staging. |
| TypeScript | `npm run typecheck`, ejecutado por separado | Correcto, código 0 | El primer intento simultáneo con export falló por un archivo generado en dist que desapareció. No repetir ambos comandos a la vez: la configuración actual incluye JS generado. |
| Bundles | `npm run export` | Falló, código 1; Hermes terminó con código 6 al generar bytecode nativo. Web llegó a empaquetarse. | Causa raíz no determinada. Ejecución en Windows dentro del sandbox; no demuestra un fallo funcional del módulo ni una exportación completa correcta. |
| Auth remoto | No ejecutado | Pendiente | No se crearon cuentas ni se cambió el proyecto compartido. |
| Teléfono | No ejecutado en esta iteración | Pendiente | La apertura previa de la base no verifica autenticación. |

## Implementación independiente autorizada

- `src/features/auth/AuthPanel.tsx`: interfaz de correo/contraseña, cambio entre registro e inicio, carga, errores, confirmación pendiente, reintento de lectura inicial y cierre de sesión. Sin cliente configurado muestra un mensaje explícito.
- `src/features/auth/useAuth.ts`: estado interno, suscripción a eventos, lectura inicial y protección frente a resultados iniciales atrasados. No implementa almacenamiento ni renovación; utiliza la configuración del cliente que reciba.
- `src/features/auth/authService.ts`: cliente inyectado, validación, llamadas reales a la API del SDK y bloqueo de solicitudes simultáneas. El cierre solicita alcance local y mantiene el error si falla.
- `src/features/auth/authService.test.cjs`: seis pruebas del servicio con cliente simulado, sin nuevas dependencias. No constituyen evidencia de integración remota.
- `src/features/auth/README.md`: punto de montaje propuesto y pendientes de integración.
- Segunda iteración: extraída la observación interna a `observeSession.ts` y añadidas seis pruebas en `observeSession.test.cjs`. `useAuth.ts` utiliza esta observación. Se corrigió un caso donde `INITIAL_SESSION` podía ocultar un fallo de lectura inicial; los eventos posteriores siguen prevaleciendo sobre resultados atrasados. Se comprueban cancelación, reintento, renovación recibida y cambio de cuenta con eventos simulados.
- Se conservaron intactos los archivos compartidos. No se cambiaron variables, configuración remota, navegación ni dependencias.

## Verificación de esta implementación

| Criterio | Comando o recorrido | Resultado | Límites |
| --- | --- | --- | --- |
| Servicio | `node --test src/features/auth/authService.test.cjs` | 6 pruebas correctas, código 0 | Cliente simulado: validación sin llamadas, normalización de correo sin alterar contraseña, confirmación sin sesión, doble envío, reintento tras error y cierre local. No prueba el hook ni la interfaz. |
| Servicio y observación de sesión, segunda iteración | `node --test src/features/auth/authService.test.cjs src/features/auth/observeSession.test.cjs` | 12 pruebas correctas, código 0 | Incluye errores de restauración, orden de eventos, cancelación y cambio de cuenta. No prueba montaje de React ni almacenamiento real. |
| Exportación, segunda iteración | `npm run export` | Falló, código 1; Hermes terminó con código 6 en Android e iOS | Persiste el fallo previo. El módulo sigue sin montarse; no demuestra ejecución de su interfaz. |
| TypeScript | `npm run typecheck` | Correcto, código 0 | Incluye las piezas nuevas. |
| Exportación | `npm run export` | Falló, código 1; Hermes terminó con código 6 en Android e iOS. Web llegó a empaquetarse. | Mismo fallo observado antes de los cambios. Causa raíz pendiente. Como el módulo no está montado, el bundle no prueba su interfaz. |
| Teléfono y Auth remoto | No ejecutados | Pendientes | No se puede considerar autenticación integrada ni persistente con la configuración actual. |

## Cierre y continuación

- Entrega de esta iteración: piezas independientes del módulo, comprobaciones del servicio e instrucciones de integración.
- Siguiente paso: coordinar los cambios de la tabla con Persona 5 y confirmar la configuración de Auth del proyecto presente en `.env`; montar el módulo y completar persistencia, protección de rutas, limpieza de cachés y pruebas reales en teléfono.
- Pendientes posteriores: Q03 para perfil; Q01 y Q02 para comunidad/invitaciones; permisos y pruebas con dos participantes y una cuenta ajena.
- Archivos propuestos para revisión y eventual `git add` humano: `docs/tareas/T01-1-autenticacion.md`, `src/features/auth/AuthPanel.tsx`, `src/features/auth/useAuth.ts`, `src/features/auth/authService.ts`, `src/features/auth/authService.test.cjs`, `src/features/auth/README.md`.
- Mensaje de commit sugerido: `feat(auth): preparar acceso independiente con correo y contraseña`.
- Para la segunda iteración, archivos propuestos: `src/features/auth/observeSession.ts`, `src/features/auth/observeSession.test.cjs`, `src/features/auth/useAuth.ts`, `src/features/auth/README.md` y esta ficha. Mensaje sugerido: `fix(auth): comprobar restauración y orden de eventos de sesión`.
- No se ejecutaron git add, commit, push ni despliegues.

## Referencia técnica consultada

Guía oficial de Supabase para [autenticación con React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native), consultada mediante el buscador de documentación del conector. Verificar de nuevo las APIs y el almacenamiento elegidos al implementar. La consulta al índice de changelog por navegador no pudo leerse por incompatibilidad de tipo de contenido; su revisión queda pendiente.
