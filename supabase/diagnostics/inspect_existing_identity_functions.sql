-- SOLO LECTURA: definiciones de código y permisos; no ejecuta las funciones.
-- Ejecutar completo en SQL Editor y exportar el resultado CSV.
with target_functions as (
  select p.*, n.nspname as schema_name
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind = 'f'
    and p.proname in (
      'crear_perfil_nuevo_usuario', 'crear_comunidad', 'aceptar_invitacion',
      'mis_invitaciones', 'unirse_con_codigo', 'es_admin', 'es_miembro',
      'comparte_comunidad', 'tiene_solicitud_aceptada_con'
    )
), report as (
  select 'function_definition'::text as section, pg_catalog.jsonb_build_object(
    'schema', p.schema_name, 'name', p.proname,
    'arguments', pg_catalog.pg_get_function_identity_arguments(p.oid),
    'owner', pg_catalog.pg_get_userbyid(p.proowner),
    'execute_anon', pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE'),
    'execute_authenticated', pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE'),
    'definition', pg_catalog.pg_get_functiondef(p.oid)
  ) as detail from target_functions p

  union all
  select 'column_default', pg_catalog.jsonb_build_object(
    'schema', n.nspname, 'table', c.relname, 'column', a.attname,
    'expression', pg_catalog.pg_get_expr(d.adbin, d.adrelid)
  )
  from pg_catalog.pg_attrdef d
  join pg_catalog.pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
  join pg_catalog.pg_class c on c.oid = a.attrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('perfiles', 'perfiles_privado', 'comunidades', 'miembros', 'invitaciones')

  union all
  select 'view_definition', pg_catalog.jsonb_build_object(
    'schema', n.nspname, 'name', c.relname,
    'owner', pg_catalog.pg_get_userbyid(c.relowner),
    'options', c.reloptions,
    'definition', pg_catalog.pg_get_viewdef(c.oid, true)
  )
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('v', 'm')
    and c.relname in ('v_comunidades', 'v_emergencias', 'v_estado_vecinos', 'v_publicaciones', 'v_solicitudes')
)
select section, detail from report order by section, detail::text;
