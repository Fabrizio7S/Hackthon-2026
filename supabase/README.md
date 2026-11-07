# Migraciones del módulo G01

Orden de aplicación tras revisión del esquema:

1. `migrations/20261107230506_own_profile.sql`: T01.2, perfil propio y código personal.
2. `migrations/20261107231438_community_creation.sql`: T01.3, autorización manual de representante, creación atómica y pertenencia propia. No incluye invitaciones ni listado de integrantes.
3. `migrations/20261107232444_community_invitations.sql`: T01.4, búsqueda por código, envío, listas y aceptación/rechazo. Requiere las dos anteriores; no incluye listado de integrantes.
4. `migrations/20261107233955_community_members.sql`: T01.5, listado mínimo de integrantes de la comunidad del solicitante. No amplía SELECT de perfiles o membresías.

Las migraciones están revisadas y probadas en PostgreSQL temporal; no están aplicadas en el proyecto compartido. Antes de hacerlo debe inspeccionarse su esquema y coordinar la aplicación. Si existe una tabla o esquema incompatible, detenerse y diseñar una migración posterior sin sobrescribirlo. Mantener `community_internal` fuera de los esquemas expuestos de Data API.

Las instrucciones de prueba aislada y los límites de esa evidencia están en `src/features/profile/README.md`, `src/features/community/README.md`, `src/features/community/INVITATIONS.md` y `src/features/community/MEMBERS.md`. Las pruebas crean usuarios ficticios solo en memoria y no contactan Supabase remoto.

No se han añadido `config.toml`, vinculación remota ni credenciales. La CLI 3.0.0 se utilizó desde la caché de npm para crear el archivo, sin añadirse a las dependencias de la app. Consultar la ayuda de la versión instalada antes de aplicar migraciones: CLI v3 cambia el destino predeterminado de los comandos.
