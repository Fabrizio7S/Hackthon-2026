# Migraciones del módulo G01

`migrations/20261107230506_own_profile.sql` pertenece a T01.2 y contiene únicamente perfil propio y código personal. No incluye roles, comunidades ni invitaciones.

La migración está revisada y probada en PostgreSQL temporal; no está aplicada en el proyecto compartido. Antes de hacerlo debe inspeccionarse su esquema y coordinar la aplicación. Si existe una tabla incompatible, detenerse y diseñar una migración posterior sin sobrescribirla.

Las instrucciones de prueba aislada y los límites de esa evidencia están en `src/features/profile/README.md`. Las pruebas crean usuarios ficticios solo en memoria y no contactan Supabase remoto.

No se han añadido `config.toml`, vinculación remota ni credenciales. La CLI 3.0.0 se utilizó desde la caché de npm para crear el archivo, sin añadirse a las dependencias de la app. Consultar la ayuda de la versión instalada antes de aplicar migraciones: CLI v3 cambia el destino predeterminado de los comandos.
