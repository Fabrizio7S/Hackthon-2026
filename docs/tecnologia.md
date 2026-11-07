# Tecnología

## Acordado y estado
React Native con Expo y TypeScript para interfaz; Supabase para autenticación, datos y archivos cuando corresponda. La base técnica está inicializada; Supabase sigue sin instalar ni conectar y no existe esquema SQL.

Entrada: index.ts y App.tsx. Gestor: npm, con package-lock.json. Comandos en README.md. TypeScript estricto; sin navegación ni estructura de datos de negocio todavía.

Base inicial tomada de expo-template-blank-typescript 57.0.34 y actualizada a Expo SDK 58 para coincidir con Expo Go instalado en el teléfono del usuario: React Native 0.88.1, React 19.3.0 y TypeScript ~6.0.3. Las resoluciones exactas están en package-lock.json. Seguir la [guía oficial de actualización](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) y alinear dependencias con expo install --fix al actualizar.

La versión web permite comprobar la pantalla inicial, pero no sustituye la verificación nativa. No se generan proyectos nativos ni se crean cuentas de compilación en esta tarea.

## Propuestas
PostGIS para cercanía y SQLite para persistencia offline son propuestas, no dependencias instaladas ni decisiones cerradas. Mapas, navegación y herramientas de pruebas del producto pendientes.

## Al comenzar
- Elegir y registrar versiones y gestor de paquetes. Después respetar estructura y archivo de bloqueo existentes.
- Separar presentación, estado y acceso a datos con la estructura mínima necesaria.
- Definir permisos por usuario y comunidad; configurar y comprobar RLS en tablas expuestas de Supabase. No confiar solo en filtros de pantalla.
- No poner claves administrativas ni secretos en la app. Documentar nombres de variables con ejemplos sin valores sensibles; variables de app móvil no almacenan secretos.
- Mantener cambios de esquema en migraciones revisables. No aplicar cambios destructivos a servicios compartidos por iniciativa propia.
- Impedir aceptaciones incompatibles entre participantes en cambios de estado.
- Contemplar ubicación y offline desde el modelo inicial; Supabase no sustituye el diseño de persistencia y sincronización local.
- No añadir chat, pagos, SMS o IA fuera del alcance aprobado.

## Referencias oficiales
- [Supabase con Expo](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)
- [PostGIS](https://supabase.com/docs/guides/database/extensions/postgis)
- [Ubicación](https://docs.expo.dev/versions/latest/sdk/location/)
- [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)

Consultar documentación compatible con las versiones que se elijan al implementar.
