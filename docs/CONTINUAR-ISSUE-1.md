# Retomar issue #1 con otro agente

Actualizado el 2026-11-07. Este es el punto de entrada del relevo; no requiere leer el chat anterior.

## Objetivo y estado real

Issue: https://github.com/Fabrizio7S/Hackthon-2026/issues/1 — acceso, perfil, comunidades e invitaciones. Responsable: Persona 1, nombre/GitHub pendientes. Rama observada: `feature/accesos-perfiles-comunidades`. Último commit observado: `b576b7c` (`feat(identity): compartir contratos y contextos de sesión y comunidad`), realizado por el humano, no por el agente.

Hay implementación local del flujo y pruebas locales, pero **NO está terminado el issue ni integrada esa implementación con la base existente**. Se descubrió después que el Supabase del equipo ya tiene un esquema español diferente al que esperaba el código. La próxima tarea es reconciliar ambos, no añadir más pantallas ni aplicar directamente las migraciones originales.

No se ha aplicado SQL de escritura remoto desde esta sesión. El usuario ejecutó dos diagnósticos de lectura en su SQL Editor y aportó los resultados. La identidad exacta de ese proyecto frente al `.env` debe confirmarse antes de cualquier cambio.

## Lectura inicial

1. Leer `AGENTS.md`, `README.md`, `docs/decisiones.md` y `docs/tareas/README.md`.
2. Leer este documento, `docs/tareas/T01-7-compatibilidad.md` y `docs/tareas/T01-7-hallazgos.md`.
3. Revisar las evidencias completas guardadas en `docs/diagnosticos/issue-1/` y los scripts de `supabase/diagnostics/`.
4. Para modificar, consultar `docs/tecnologia.md`, `docs/flujo-trabajo.md`, `docs/validacion.md` y `docs/contratos-identidad.md` según corresponda.

## Restricciones y autorizaciones

AGENTS.md es prioritario: no ejecutar git add, commits, push, variantes equivalentes ni despliegues. Conservar cambios ajenos. Un agente trabaja una tarea atómica; no delegar por iniciativa propia. Coordinar cambios de esquema, dependencias, contratos y archivos compartidos antes de aplicarlos. Proponer archivos y mensaje para ejecución humana.

El usuario autorizó correo/contraseña, las reglas D17–D19 y avanzar el módulo G01. Inicialmente limitó cambios compartidos; posteriormente autorizó continuar la integración temporal de G01 y se informó antes de editar. Persona 5 no estaba disponible y no ha revisado directamente el montaje. Esta autorización no permite modificar módulos ajenos, destruir la base ni asumir decisiones pendientes.

El usuario ahora pidió **documentar el contexto para continuar con otro agente**. Este relevo no aplica migraciones ni inicia la reconciliación por sí solo. Al retomar, preparar cambios concretos y revisables antes de pedir aprobación para su aplicación compartida.

## Decisiones aprobadas

Las definiciones completas están en D16–D19 de `docs/decisiones.md`; no duplicarlas como nuevas reglas:

- Acceso por correo y contraseña.
- Perfil: nombre visible obligatorio; correo privado desde sesión; código personal único generado por servidor e inalterable por cliente. No recoger teléfono, dirección ni coordenadas de perfil en esta entrega.
- Una comunidad por vecino. Sin comunidad puede gestionar perfil e invitaciones. Datos comunitarios solo para miembros. Esto no resuelve visibilidad de emergencias.
- Representante autorizado manualmente en backend, nunca por autoasignación del cliente. Solo él crea comunidad e invita mediante el código personal del vecino.
- Sin invitaciones pendientes duplicadas; procesamiento repetido conserva el estado final; tras rechazo se permite un nuevo envío. No se invita a quien ya es miembro.

Q01–Q03 están resueltas. Q07/offline y otras decisiones de módulos ajenos siguen pendientes. La geografía obligatoria de la comunidad que aparece en el esquema antiguo no se convierte automáticamente en un requisito aprobado de la nueva pantalla.

## Código que ya existe

Stack: React Native, Expo SDK 58, TypeScript, Supabase y npm; conservar package-lock.json. Entrada: index.ts → App.tsx.

| Ubicación | Contenido |
| --- | --- |
| `src/lib/supabase.ts` | Cliente único; configuración con variables públicas del `.env`, sin claves administrativas. Persistencia nativa AsyncStorage 2.2.0 y almacenamiento del SDK en web. |
| `src/features/auth/` | Registro/inicio/cierre, validación/carga, sesión comprobada con getUser, restauración y eventos. AppState coordina renovación nativa desde App.tsx. |
| `src/features/profile/` | Consulta/edición propia, código confirmado y copia con Expo Clipboard 58.0.4. |
| `src/features/community/` | Creación autorizada, búsqueda, invitaciones entrantes/salientes, aceptación/rechazo, pertenencia e integrantes mínimos. |
| `src/shared/identity/contracts.ts`, `IdentityContext.tsx` | Contratos/contextos de lectura y acciones; sin tokens en la identidad compartida. Usados por G01, recepción de personas 2–5 pendiente. |
| `docs/tareas/T01-1…T01-6` | Evidencia por tarea y límites de las pruebas anteriores. |

Los servicios actuales esperan `profiles`, `communities`, `memberships`, `community_invitations` y RPCs en inglés como `get_my_community`, `create_community`, `find_neighbor`, `send_invitation`, `get_my_invitations`, `process_invitation`, `get_my_community_members`. Eso **no coincide con el esquema español recibido**.

Las cuatro migraciones originales de `supabase/migrations/` están preparadas para ese modelo local y no se aplicaron en esta sesión. No ejecutar db push indiscriminadamente ni agregarlas a la base para tener dos modelos paralelos. Conservarlas como trabajo existente mientras se acuerda el tratamiento del historial y la reconciliación. No editar migraciones que se descubran ya aplicadas.

## Evidencia remota ya disponible: no pedirla otra vez

- `docs/diagnosticos/issue-1/estructura.csv`: 424 filas de metadatos — columnas, restricciones, índices, enums, grants, RLS, políticas, firmas de funciones, triggers y dependencias.
- `docs/diagnosticos/issue-1/funciones.csv`: 26 filas — nueve definiciones de funciones y permisos efectivos de ejecución, doce defaults y cinco definiciones de vistas/opciones.
- Los archivos contienen estructura y código SQL aportados por el usuario, no registros de vecinos ni credenciales. No dependen de las rutas temporales originales del chat.
- `supabase/diagnostics/inspect_existing_identity.sql` e `inspect_existing_identity_functions.sql` son las consultas de solo lectura usadas. Las funciones se inspeccionaron, no se ejecutaron.

## Hallazgos confirmados que condicionan la adaptación

1. **No borrar/recrear tablas:** perfiles y comunidades tienen claves foráneas desde emergencias, solicitudes, publicaciones, recursos, grupos y otras tablas. Se desconoce si otros integrantes ya las usan.
2. `crear_comunidad` solo exige auth.uid no nulo; crea una comunidad y asigna al creador rol `admin`. No comprueba autorización manual ni pertenencia previa. Una UI nueva que oculte el botón no corrige esa función existente.
3. `unirse_con_codigo` incorpora al usuario por el código comunitario sin exigir invitación. Tiene EXECUTE para authenticated y auth.uid verificado; no es acceso anónimo efectivo solo por figurar execute_anon=true.
4. `miembros` tiene PK `(comunidad_id, usuario_id)`, sin unique por usuario. Las funciones de creación/incorporación/aceptación inspeccionadas permiten múltiples comunidades.
5. `invitaciones` usa correo, estado `pendiente/aceptada/rechazada` y unique global `(comunidad_id, correo)`. La política INSERT usa es_miembro; su cuerpo confirma que vale para cualquier rol miembro. No se identificó una operación de rechazo en las funciones aportadas ni política UPDATE de esa tabla.
6. `aceptar_invitacion` comprueba que el correo del JWT coincide con la invitación pendiente y añade membresía en la misma transacción. Es una protección aprovechable; **no se encontró aceptación ajena en ese código**. Repetir una aceptación falla con P0002 en vez de devolver estado final; no impide otra comunidad.
7. `crear_perfil_nuevo_usuario` se ejecuta al registrar auth.users; crea perfiles y perfiles_privado. Usa nombre de metadatos si existe y, en caso contrario, `Vecino`. Por tanto, no necesita nombre para que el registro básico funcione. La existencia de esa fila/autonombre no prueba que el usuario completó el perfil; no usar la comparación literal con `Vecino` para decidirlo.
8. No hay código personal en perfiles. `comunidades.codigo_invitacion` es un código comunitario de seis caracteres, no el código del vecino.
9. `comunidades.zona` es `geography(Point,4326)`, NOT NULL y sin default. La función de creación recibe latitud/longitud. No rellenar con 0,0 ni inventar ubicaciones. Resolver la procedencia o el cambio de este dato con el equipo antes de implementar esa parte de la adaptación.
10. Límites existentes: perfil 2–60 y comunidad 3–60 caracteres, diferentes de los límites técnicos locales 1–100. Roles antiguos `admin/miembro`; no equiparar todos los admin existentes con representantes verificados automáticamente.
11. RLS está habilitada en las cinco tablas. Hay permisos amplios, incluido TRUNCATE, que requieren revisión; no se demostró acceso público a filas ni se probó una operación destructiva.
12. Las políticas de perfil permiten lectura entre vecinos de comunidad, y perfiles_privado contempla contrapartes de solicitudes aceptadas. Las cinco vistas aportadas tienen security_invoker=true y dependen de esos permisos/joins. Restringir el perfil sin adaptar consumidores puede vaciar vistas de otros módulos. Coordinar; no ampliar ni eliminar privacidad por conveniencia.
13. Las nueve funciones inspeccionadas son ejecutables por anon/authenticated; algunas verifican auth.uid y otras son auxiliares. No confundir EXECUTE con autorización de negocio ni asumir una vulnerabilidad en todas. Las SECURITY DEFINER aportadas usan search_path vacío.

## Siguiente trabajo concreto

Continuar **T01.7: diseñar una reconciliación revisable con el esquema existente**. No faltan más CSV de las mismas funciones.

1. Confirmar que el SQL Editor corresponde al proyecto del `.env`, sin imprimir claves. Confirmar historial de migraciones y qué consumidores usan el esquema.
2. Preparar una propuesta que preserve datos/tablas españolas y los contratos de frontend cuando sea posible. Un puente de RPC es una opción técnica a evaluar, no una estrategia ya aprobada. Hay que cerrar también las rutas antiguas que permitirían eludir las reglas nuevas.
3. Identificar cambios mínimos para código personal, autorización manual, una comunidad por usuario, invitaciones por destinatario, procesamiento idempotente y privacidad. Antes de restricciones nuevas, obtener agregados de posibles conflictos de datos, no filas privadas innecesarias. No resolver conflictos eliminando registros automáticamente.
4. Resolver el dato geográfico comunitario y coordinar las políticas/vistas con los consumidores afectados. No convertir el intento anterior de un solo prompt en especificación vigente.
5. Entregar SQL y adaptación probados contra una reproducción del esquema español. Las pruebas actuales no bastan para afirmar compatibilidad con ese esquema. PostGIS es parte de la base existente, pero no se aprobó introducir infraestructura compartida nueva.
6. Solo después coordinar aplicación por el usuario/administrador. No instruir otra vez que aplique las cuatro migraciones originales tal cual.

## Acceso y forma de trabajar con el usuario

El conector Supabase disponible no muestra el proyecto del `.env`. Al intentar autorizarlo, el usuario recibió: `Only organization owners and administrators can approve or deny this app`. El plugin **no es obligatorio** para continuar; el usuario puede ejecutar consultas revisadas en SQL Editor y compartir los resultados. No pedir contraseñas, service_role ni tokens en el chat o archivos.

El usuario prefirió análisis breve y avanzar iterativamente. Ya aportó ambos diagnósticos completos. No hacerle repetir búsquedas ni reinstalar el plugin como condición para preparar la adaptación. No se han creado cuentas reales ni cambiado roles administrativos.

## Verificaciones y límites

Última verificación de código en T01.6: 58 pruebas de servicios/contratos/contextos, npm run typecheck y npm run export correctos. Export Android/iOS/web pasó fuera del sandbox; dentro Hermes fallaba con código 6. Ejecutar typecheck y export por separado, porque el segundo regenera dist.

Última regresión SQL en T01.5: 38 casos en PostgreSQL embebido PGlite 0.5.15 con fixtures de Auth; Node informa 42 incluyendo contenedores. No son pruebas del esquema español ni de Supabase Auth/PostgREST reales. PGlite solo está instalado temporalmente fuera de la app; instrucciones en el README de perfil. Docker estaba instalado pero no ejecutándose.

Pruebas reales pendientes: registro exitoso, perfil/código, comunidad, invitación/aceptación/rechazo entre dos cuentas y denegaciones con una tercera, persistencia tras reinicio, cierre/cambio de sesión, errores/reintentos/doble pulsación y navegación atrás. El usuario no tenía teléfono disponible. No marcar el issue terminado por compilación ni por simulaciones.

Esta entrega cambia documentación y conserva evidencias. No vuelve a ejecutar pruebas de producto porque no cambia su código.

## Mensaje para el siguiente agente

> Lee AGENTS.md, README.md, docs/decisiones.md, docs/tareas/README.md y docs/CONTINUAR-ISSUE-1.md. Continúa la tarea T01.7 del issue #1: reconciliar la implementación local con el esquema Supabase español existente. Las dos evidencias completas están en docs/diagnosticos/issue-1/. No apliques las cuatro migraciones originales, no borres tablas/datos y no repitas los diagnósticos ya aportados. Prepara una adaptación concreta, preservando dependencias y coordinando las decisiones técnicas aún necesarias. Respeta las prohibiciones de staging, commits, push y despliegue.
