# Hallazgos del diagnóstico aportado — T01.7

Fuente: CSV de metadatos aportado por el usuario en esta sesión, no inspección directa del proyecto. 424 filas: 25 columnas, 39 restricciones, seis dependencias de vistas, cinco valores enum, 18 firmas de funciones, nueve índices, once políticas, cinco estados RLS, un trigger y grants. Los conteos de privilegios son filas del catálogo, no cuentas ni registros de negocio.

Se recibió después un segundo CSV: nueve cuerpos de funciones/permisos de ejecución, doce defaults y cinco definiciones de vistas. Evidencias completas conservadas en `docs/diagnosticos/issue-1/estructura.csv` y `docs/diagnosticos/issue-1/funciones.csv`. La guía de continuación es [CONTINUAR-ISSUE-1.md](../CONTINUAR-ISSUE-1.md). No volver a pedir las mismas consultas.

## Confirmado en el inventario

| Tema | Esquema existente | Consecuencia para integrar G01 |
| --- | --- | --- |
| Identidad | perfiles referencia auth.users; trigger crear_perfil_nuevo_usuario crea perfil y fila privada, usando nombre de metadatos o Vecino | Registro básico no exige nombre de metadatos. Resolver cómo distinguir perfil completado sin inferirlo por una fila autogenerada o por comparar el nombre con Vecino. No crear perfiles paralelos. |
| Código | codigo_invitacion es único de comunidades; no hay columna de código personal en perfiles | Hace falta diseñar la incorporación de código personal sin reutilizar el código comunitario como si fuera de vecino. |
| Comunidad | zona es geography(Point,4326), NOT NULL, sin default | Crear con nombre solamente no encaja. No inventar ubicación ni quitar requisito compartido sin acuerdo. crear_comunidad recibe latitud/longitud. |
| Límites | nombre de perfil entre 2–60; nombre de comunidad entre 3–60 | Difieren de los límites técnicos locales 1–100. Revisar/adaptar con trazabilidad; no convertir el intento anterior en una decisión aprobada. |
| Membresía | PK (comunidad_id, usuario_id); índice usuario_id no único; las funciones inspeccionadas no impiden pertenencia previa | Permite varias comunidades, en conflicto con D18. Comprobar conflictos de datos antes de diseñar unicidad; no eliminarlos automáticamente. |
| Rol | rol_miembro admite admin/miembro; crear_comunidad asigna admin a cualquier creador autenticado | Conflicto confirmado con autorización manual de D19. No convertir todos los admin existentes en representantes verificados automáticamente. |
| Invitaciones | correo obligatorio, unique(comunidad_id,correo) para todos los estados | No expresa el flujo por código/destinatario UUID. No se identificó operación de rechazo en las funciones aportadas ni política UPDATE; planear reconciliación sin borrar historial. |
| Estados | estado_invitacion admite pendiente/aceptada/rechazada | Se puede estudiar una traducción con estados locales; no implica compatibilidad de actores o transacciones. |
| RLS | Habilitada en las cinco tablas, sin FORCE | No declarar acceso público por ver grants amplios; SELECT/INSERT/UPDATE/DELETE también dependen de políticas. |
| Dependencias | perfiles y comunidades están referenciadas por emergencias, solicitudes, publicaciones, recursos, grupos y otras tablas | Eliminar/recrear o renombrar puede romper otros módulos; no hacerlo. |

## Permisos que requieren revisión

- El catálogo muestra privilegios amplios para anon/authenticated, incluido TRUNCATE en las cinco tablas. PostgreSQL no somete TRUNCATE a RLS. Es un permiso de tabla que debe revisarse; no se comprobó un camino ejecutable desde la API ni se ejecutó esa operación.
- La política INSERT de invitaciones exige invitado_por=auth.uid() y es_miembro(comunidad_id). El cuerpo recibido de es_miembro comprueba pertenencia sin distinguir rol: cualquier miembro puede enviar, en conflicto con D19.
- SELECT de invitaciones contempla toda la comunidad o coincidencia por email del JWT; no coincide directamente con la lista de remitente autorizado/destinatario UUID de G01.
- SELECT de perfiles usa comparte_comunidad(id), además de propietario; SELECT de perfiles_privado usa tiene_solicitud_aceptada_con(id). Deben revisarse con los consumidores antes de restringirlas conforme a la privacidad aprobada.
- Las nueve funciones aportadas tienen EXECUTE para anon/authenticated y sus SECURITY DEFINER usan search_path vacío. crear_comunidad y unirse_con_codigo rechazan auth.uid nulo; no confundir EXECUTE concedido con incorporación anónima efectiva.
- crear_comunidad crea la comunidad y asigna admin al usuario autenticado sin verificar autorización previa ni impedir otra pertenencia.
- unirse_con_codigo inserta membresía por código comunitario sin exigir una invitación; después acepta invitaciones pendientes coincidentes si las hay. Este recorrido elude el flujo de invitación aprobado, aunque se oculte en pantalla.
- aceptar_invitacion sí exige coincidencia del email del JWT con una invitación pendiente y cambia estado/membresía en la misma transacción. No se encontró aceptación ajena en ese cuerpo. Repetirla falla con P0002 en lugar de devolver el estado final; tampoco impide otra comunidad.
- Las cinco vistas recibidas tienen security_invoker=true y joins a tablas sujetas a RLS. Deben conservarse sus dependencias; restringir perfiles puede ocultar autores/filas de otros módulos. No cambiar políticas sin coordinación con sus consumidores.

Referencia para el alcance de RLS y TRUNCATE: [PostgreSQL, Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

## Inspección de funciones recibida y siguiente paso

El usuario ya ejecutó `supabase/diagnostics/inspect_existing_identity_functions.sql` y aportó los resultados completos, guardados en `docs/diagnosticos/issue-1/funciones.csv`. Se leyeron definiciones, sin ejecutar esas funciones ni alterar el proyecto. No repetir la solicitud de esa evidencia.

Ahora corresponde preparar una reconciliación revisable sobre tablas existentes, en vez de aplicar las cuatro migraciones originales y crear estructuras paralelas. Todavía no se ha decidido ni ejecutado esa reconciliación. Falta confirmar proyecto/historial de migraciones, consumidores y conflictos de datos, y resolver el punto geográfico comunitario. No cambiar zonas, contactos, otros módulos o datos existentes por conveniencia.
