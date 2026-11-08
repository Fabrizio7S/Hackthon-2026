-- Diagnóstico de SOLO LECTURA. No es una migración y no consulta filas de vecinos.
-- Ejecutar completo en SQL Editor del proyecto compartido y exportar el resultado CSV.
-- No devuelve cuerpos de funciones ni argumentos de triggers, para evitar copiar
-- configuraciones sensibles que pudieran estar escritas dentro de código anterior.
with targets as (
  select c.oid, n.nspname as schema_name, c.relname as table_name,
    c.relrowsecurity, c.relforcerowsecurity
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('perfiles', 'perfiles_privado', 'comunidades', 'miembros', 'invitaciones')
    and c.relkind in ('r', 'p')
), relevant_triggers as (
  select tr.oid, tr.tgname, tr.tgrelid, tr.tgfoid, tr.tgenabled
  from pg_catalog.pg_trigger tr
  join pg_catalog.pg_class c on c.oid = tr.tgrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where not tr.tgisinternal
    and (tr.tgrelid in (select oid from targets) or (n.nspname = 'auth' and c.relname = 'users'))
), report as (
  select 'columns'::text as section, pg_catalog.jsonb_build_object(
    'schema', t.schema_name, 'table', t.table_name, 'position', a.attnum,
    'column', a.attname, 'exact_type', pg_catalog.format_type(a.atttypid, a.atttypmod),
    'nullable', not a.attnotnull, 'has_default', d.oid is not null,
    'generated', a.attgenerated, 'identity', a.attidentity
  ) as detail
  from targets t
  join pg_catalog.pg_attribute a on a.attrelid = t.oid
  left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where a.attnum > 0 and not a.attisdropped

  union all
  select 'constraints', pg_catalog.jsonb_build_object(
    'schema', n.nspname, 'table', c.relname, 'name', con.conname,
    'type', con.contype, 'definition', pg_catalog.pg_get_constraintdef(con.oid, true)
  )
  from pg_catalog.pg_constraint con
  join pg_catalog.pg_class c on c.oid = con.conrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where con.conrelid in (select oid from targets) or con.confrelid in (select oid from targets)

  union all
  select 'indexes', pg_catalog.jsonb_build_object(
    'schema', i.schemaname, 'table', i.tablename, 'name', i.indexname, 'definition', i.indexdef
  )
  from pg_catalog.pg_indexes i
  join targets t on t.schema_name = i.schemaname and t.table_name = i.tablename

  union all
  select 'rls', pg_catalog.jsonb_build_object(
    'schema', schema_name, 'table', table_name,
    'enabled', relrowsecurity, 'forced', relforcerowsecurity
  ) from targets

  union all
  select 'policies', pg_catalog.jsonb_build_object(
    'schema', p.schemaname, 'table', p.tablename, 'name', p.policyname,
    'mode', p.permissive, 'roles', p.roles, 'command', p.cmd,
    'using', p.qual, 'with_check', p.with_check
  )
  from pg_catalog.pg_policies p
  join targets t on t.schema_name = p.schemaname and t.table_name = p.tablename

  union all
  select 'grants', pg_catalog.jsonb_build_object(
    'schema', g.table_schema, 'table', g.table_name, 'role', g.grantee,
    'privilege', g.privilege_type
  )
  from information_schema.table_privileges g
  join targets t on t.schema_name = g.table_schema and t.table_name = g.table_name
  where g.grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')

  union all
  select 'column_grants', pg_catalog.jsonb_build_object(
    'schema', g.table_schema, 'table', g.table_name, 'column', g.column_name,
    'role', g.grantee, 'privilege', g.privilege_type
  )
  from information_schema.column_privileges g
  join targets t on t.schema_name = g.table_schema and t.table_name = g.table_name
  where g.grantee in ('PUBLIC', 'anon', 'authenticated')

  union all
  select distinct 'enum_values', pg_catalog.jsonb_build_object(
    'schema', n.nspname, 'type', ty.typname, 'order', e.enumsortorder, 'value', e.enumlabel
  )
  from targets t
  join pg_catalog.pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
  join pg_catalog.pg_type ty on ty.oid = a.atttypid
  join pg_catalog.pg_namespace n on n.oid = ty.typnamespace
  join pg_catalog.pg_enum e on e.enumtypid = ty.oid

  union all
  select 'functions', pg_catalog.jsonb_build_object(
    'schema', n.nspname, 'name', p.proname,
    'arguments', pg_catalog.pg_get_function_identity_arguments(p.oid),
    'result', pg_catalog.pg_get_function_result(p.oid),
    'security_definer', p.prosecdef, 'volatility', p.provolatile
  )
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where p.prokind = 'f' and (
    (n.nspname = 'public' and not exists (
      select 1 from pg_catalog.pg_depend ed
      where ed.classid = 'pg_catalog.pg_proc'::regclass and ed.objid = p.oid and ed.deptype = 'e'
    )) or p.oid in (select tgfoid from relevant_triggers)
  )

  union all
  select 'triggers', pg_catalog.jsonb_build_object(
    'schema', n.nspname, 'table', c.relname, 'name', tr.tgname, 'enabled', tr.tgenabled,
    'function_schema', fn.nspname, 'function', p.proname
  )
  from relevant_triggers tr
  join pg_catalog.pg_class c on c.oid = tr.tgrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  join pg_catalog.pg_proc p on p.oid = tr.tgfoid
  join pg_catalog.pg_namespace fn on fn.oid = p.pronamespace

  union all
  select distinct 'dependent_views', pg_catalog.jsonb_build_object(
    'schema', vn.nspname, 'view', v.relname, 'depends_on_table', t.table_name
  )
  from targets t
  join pg_catalog.pg_depend dep on dep.refclassid = 'pg_catalog.pg_class'::regclass and dep.refobjid = t.oid
  join pg_catalog.pg_rewrite rw on dep.classid = 'pg_catalog.pg_rewrite'::regclass and rw.oid = dep.objid
  join pg_catalog.pg_class v on v.oid = rw.ev_class and v.relkind in ('v', 'm')
  join pg_catalog.pg_namespace vn on vn.oid = v.relnamespace
)
select section, detail from report order by section, detail::text;
