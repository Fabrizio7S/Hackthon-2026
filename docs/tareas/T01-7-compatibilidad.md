# T01.7 — Inspección de compatibilidad con el esquema existente

- Grupo G01; Persona 1 (nombre/GitHub pendientes), agente Codex.
- Issue: https://github.com/Fabrizio7S/Hackthon-2026/issues/1
- Rama: `feature/accesos-perfiles-comunidades`.
- Estado: migración de reconciliación aditiva diseñada y verificada en suite SQL aislada; pendiente de revisión/aplicación en el proyecto remoto.
- Alcance: reconciliación no destructiva que preserva tablas en español (perfiles, comunidades, miembros, invitaciones) e incorpora código personal, representantes autorizados y puente RPC compatible con G01. Sin eliminar datos ni alterar esquemas ajenos.

## Evidencia recibida del usuario

Origen: consulta de information_schema.columns ejecutada por el usuario en su SQL Editor. No se comprobó directamente la identidad del proyecto ni sus datos.

| Tabla existente | Columnas recibidas |
| --- | --- |
| comunidades | id UUID, nombre text, codigo_invitacion text, zona USER-DEFINED, zona_nombre text nullable, creada_por UUID, creado_en timestamptz |
| invitaciones | id UUID, comunidad_id UUID, correo text, invitado_por UUID, estado USER-DEFINED, creado_en timestamptz |
| miembros | comunidad_id UUID, usuario_id UUID, rol USER-DEFINED, unido_en timestamptz |
| perfiles | id UUID, nombre text, oficio text nullable, tutorial_visto boolean, comunidad_activa UUID nullable, creado_en timestamptz |
| perfiles_privado | id UUID, telefono text nullable |

Todos los campos no marcados nullable fueron informados como NOT NULL. Se recibieron además restricciones, índices, tipos exactos, políticas, trigger, nueve cuerpos de funciones con EXECUTE, doce defaults y cinco vistas. Los hallazgos actualizados están en [T01-7-hallazgos.md](T01-7-hallazgos.md). El relevo completo está en [CONTINUAR-ISSUE-1.md](../CONTINUAR-ISSUE-1.md).

## Diferencias que requieren inspección

- La app local usa tablas profiles/communities/memberships y operaciones RPC propias; el esquema recibido usa nombres españoles. No basta con cambiar nombres de columnas sin revisar reglas/permisos.
- No se recibió una columna de código personal en perfiles. codigo_invitacion pertenece a comunidades; no asumir que es el código personal de D17.
- invitaciones exige correo y no muestra un destinatario UUID. Falta revisar cómo identifica/autoriza a quien procesa.
- zona es geography(Point,4326), NOT NULL y sin default. No inventar coordenadas, polígonos o reglas de zona.
- rol admite admin/miembro y estado admite pendiente/aceptada/rechazada.
- comunidad_activa no demuestra restricción de una comunidad por usuario; los índices y funciones recibidos permiten varias.
- oficio, tutorial y teléfono existentes no se convierten en requisitos aprobados ni se eliminan por esta inspección.

## Siguiente paso concreto

1. Revisar y ejecutar la migración `supabase/migrations/20261108020000_reconcile_existing_identity.sql` en el SQL Editor de Supabase del proyecto compartido.
2. Insertar un registro en `public.representantes_autorizados` para el usuario que actuará como representante durante las pruebas.
3. Probar el flujo real en dispositivo móvil con cuentas de prueba.

## Verificación

- Suite SQL de compatibilidad en PGlite: `node --test supabase/tests/reconcile_existing_identity.test.cjs`. 9 pruebas pasando (código 0): verificación de perfil, generación de `codigo_personal`, creación autorizada de comunidad con coordenadas por defecto, búsqueda por código de vecino, envío de invitación por código, recepción y aceptación de invitación, pertenencia única, listado de integrantes y edición de perfil mediante vista `profiles`.
- Pruebas unitarias de frontend: 58 pruebas pasando en suite local.
- TypeScript: `npm run typecheck` completado con código 0.

Archivos propuestos para git add humano:
`supabase/migrations/20261108020000_reconcile_existing_identity.sql`
`supabase/tests/reconcile_existing_identity.test.cjs`
`supabase/README.md`
`docs/tareas/T01-7-compatibilidad.md`
`docs/tareas/README.md`

Sin staging, commits, push ni modificaciones remotas.
