# Aplicación vecinal

Reto de El Comercio y UTP: conectar vecinos con productos y servicios cercanos, recomendaciones, ayuda sin dinero y coordinación durante emergencias. Nombre definitivo pendiente. La funcionalidad precede al acabado visual.

## Estado
- Stack acordado: React Native con Expo, TypeScript y Supabase.
- Autenticación por correo y contraseña conectada a Supabase, con registro, inicio, persistencia y cierre implementados. Verificación completa con cuenta real y teléfono pendiente; ver [T01.1](docs/tareas/T01-1-autenticacion.md).
- Entrada: index.ts registra App.tsx. Configuración: app.json. Nombre provisional.
- Perfil propio/código personal y creación autorizada de comunidad implementados; migraciones remotas y pruebas reales pendientes: [T01.2](docs/tareas/T01-2-perfil.md), [T01.3](docs/tareas/T01-3-crear-comunidad.md). Q01–Q03 resueltas en D17–D19. Invitaciones y listado de integrantes pendientes.

## Instalación y ejecución
Requisitos: Node.js compatible con Expo SDK 58 y npm. Entorno usado: Node 24.17.0 y npm 12.0.1.

```powershell
npm ci
npm start
```

Abre el QR en Expo Go compatible con SDK 58, con el teléfono y el equipo en la misma red. El proyecto se actualizó a SDK 58 para coincidir con la versión instalada por el usuario.

Después de actualizar el SDK, detén Metro con Ctrl+C y reinícialo limpiando la caché:

```powershell
npm start -- --clear
```

| Comando | Resultado |
| --- | --- |
| npm start | Inicia Metro para abrir la app en un dispositivo. |
| npm run android | Inicia y abre en Android; requiere emulador configurado o dispositivo conectado. |
| npm run ios | Abre el simulador iOS; requiere macOS y Xcode. En Windows se puede usar un iPhone con Expo Go compatible. |
| npm run web | Abre la versión web de desarrollo. |
| npm run typecheck | Comprueba TypeScript sin emitir archivos. |
| npm run export | Genera bundles Android, iOS y web en dist/. No publica ni despliega. |

Los iconos son los de la plantilla oficial. El formulario puede abrirse sin una cuenta; para acceder se necesita una cuenta del proyecto configurado.

Pruebas unitarias de autenticación, con cliente simulado:

```powershell
node --test src/features/auth/authService.test.cjs src/features/auth/observeSession.test.cjs
```

Para incluir las pruebas de perfil y comunidad, añade `src/features/profile/profileService.test.cjs src/features/community/communityService.test.cjs` al comando. Las pruebas SQL aisladas y las migraciones pendientes se describen en [perfil](src/features/profile/README.md) y [comunidad](src/features/community/README.md).

Ejecuta typecheck y export por separado. En el entorno restringido del agente Hermes falló con código 6; la exportación fuera del sandbox pasó en las tres plataformas.

## Supabase
Completa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY en el archivo local .env usando los valores públicos del proyecto compartido. .env.example contiene la plantilla sin valores; .env está ignorado por Git. Después reinicia Expo.

El cliente único está en src/lib/supabase.ts y devuelve null sin configuración. App.tsx monta el acceso y coordina la renovación al pasar entre primer y segundo plano en nativo. La sesión se guarda mediante AsyncStorage 2.2.0 en Android/iOS y el almacenamiento del SDK en web. AsyncStorage no cifra los datos en reposo; no almacena la contraseña del formulario. No uses claves secretas ni service_role en estas variables.

Antes de mostrar la vista de sesión se comprueba la identidad contra Supabase. Si falla la red o la validación, se permite reintentar o cerrar la sesión guardada. Actualmente no se implementa acceso privado offline.

Consulta la configuración de correo del proyecto compartido antes de probar. El proyecto configurado se consultó el 2026-11-07: registro por correo habilitado y confirmación automática activa. No se modificó ese ajuste. Si el equipo exige confirmación por correo, debe coordinar su destino antes de cambiarlo.

Para verificar en teléfono: reinicia con `npm start -- --clear`, registra una cuenta de prueba propia, cierra por completo y abre la app, comprueba la sesión restaurada y cierra sesión. Repite con otra cuenta; no deben reaparecer datos de la anterior. Registra dispositivo y resultados en T01.1. No compartas contraseñas ni tokens en el chat o la documentación.

## Retomar con cualquier agente
Entrega este mensaje al iniciar una sesión con cualquier agente:

> Lee AGENTS.md, README.md, docs/decisiones.md y docs/tareas/README.md. Identifica la etapa y el grupo activo. Informa acuerdos y bloqueos de la tarea asignada antes de editar. Respeta su alcance, las restricciones de Git y trabaja en una sola tarea.

No supongas que todas las herramientas cargan automáticamente los mismos archivos. Esta entrada explícita permite compartir contexto; no se ha configurado ni probado la carga automática en cada herramienta.

## Contexto
- [Reglas](AGENTS.md)
- [Producto](docs/producto.md)
- [Recorridos](docs/recorridos.md)
- [Diseño](docs/diseno.md)
- [Decisiones y preguntas](docs/decisiones.md)
- [Tecnología](docs/tecnologia.md)
- [Flujo de trabajo](docs/flujo-trabajo.md)
- [Validación](docs/validacion.md)
- [Tareas](docs/tareas/README.md)

