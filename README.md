# Red vecinal

Aplicación de comunidad vecinal desarrollada con React Native, Expo SDK 58, TypeScript y Supabase. Incluye acceso y perfil, comunidades e invitaciones, servicios y productos, favores, mapas, emergencias/SOS y un recorrido de ayuda de 18 pasos.

## Instalación y ejecución

Desde la raíz del repositorio, con Node.js compatible con Expo SDK 58 y npm:

```powershell
npm ci
```

Configura el archivo local `.env` a partir de `.env.example` con la URL y la clave pública de tu proyecto Supabase. Conserva tus valores locales; no incluyas claves secretas ni `service_role` en variables públicas o en Git.

```powershell
npm start -- --clear
```

Abre la aplicación con Expo Go compatible, o usa `npm run web` para la versión web. Android requiere un teléfono o emulador; el simulador iOS requiere macOS. La base de datos del proyecto compartido conserva sus migraciones y permisos: reorganizar carpetas no los aplica ni modifica.

## Comprobaciones

| Comando | Qué comprueba |
| --- | --- |
| `npm run typecheck` | Tipos e importaciones TypeScript. |
| `npm test` | Pruebas de aplicación y pruebas aisladas de base de datos. No contacta Supabase remoto. |
| `npm run test:app` | Pruebas de aplicación sin las suites de base de datos. |
| `npm run check:architecture` | Imports locales, ciclos y dirección de dependencias entre capas. |
| `npm run export` | Bundles de Android, iOS y web; no publica ni despliega. |

Las suites de base de datos usan PGlite, declarado como dependencia de desarrollo. Las pruebas automáticas y los bundles no sustituyen comprobar recorridos reales en teléfono, con distintas cuentas y roles.

## Organización

- `App.tsx`: entrada de la interfaz y renovación de sesión al volver al primer plano.
- `src/app/`: composición de la aplicación, sesión, navegación, estructura, pantallas globales e integración entre módulos.
- `src/features/`: funcionalidades con sus pantallas/componentes, hooks, acceso a datos, modelos y estilos.
- `src/shared/`: interfaz reutilizable, contratos de identidad/navegación, ubicación y tema.
- `src/lib/`: cliente único de Supabase.
- `scripts/`: comprobaciones locales reproducibles.
- `tests/helpers/`: utilidades de las pruebas.
- `supabase/`: migraciones, diagnósticos y pruebas del backend.
- `docs/`: acuerdos, arquitectura, tareas y evidencia.

La estructura completa y sus reglas se describen en [docs/arquitectura.md](docs/arquitectura.md). La evidencia de la reorganización está en [T05.2](docs/tareas/T05-2-organizacion-proyecto.md).

## Trabajo en equipo

Lee [AGENTS.md](AGENTS.md), [decisiones](docs/decisiones.md) y [tareas](docs/tareas/README.md) antes de modificar código. Conserva `package-lock.json`, los cambios ajenos y las reglas de negocio. No mezcles una extracción de código con un rediseño o un cambio de permisos.

Los nombres de funciones, contratos de datos, claves de almacenamiento, identificadores del tutorial y comportamiento visible se conservan en esta reorganización. Los registros históricos de tareas pueden describir entregas anteriores; la arquitectura actual se consulta en el documento indicado arriba.
