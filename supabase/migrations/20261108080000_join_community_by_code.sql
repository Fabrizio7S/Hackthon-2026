-- Permite al representante obtener el código de invitación de su comunidad
-- y a cualquier vecino unirse directamente con ese código (Opción A).

begin;

-- 1. Actualizar get_my_community para incluir el código de invitación si es representante
create or replace function public.get_my_community()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_can_create boolean := false;
  v_has_profile boolean := false;
  v_membership jsonb := null;
begin
  if v_uid is null then
    return pg_catalog.jsonb_build_object('can_create', false, 'has_profile', false, 'membership', null);
  end if;

  select exists(select 1 from public.perfiles where id = v_uid) into v_has_profile;
  select exists(select 1 from public.representantes_autorizados where usuario_id = v_uid) into v_can_create;

  select pg_catalog.jsonb_build_object(
    'user_id', m.usuario_id,
    'community_id', m.comunidad_id,
    'community_name', c.nombre,
    'role', case when m.rol = 'admin' then 'representative' else 'member' end,
    'invite_code', case when m.rol = 'admin' then c.codigo_invitacion else null end
  ) into v_membership
  from public.miembros m
  join public.comunidades c on c.id = m.comunidad_id
  where m.usuario_id = v_uid
  limit 1;

  return pg_catalog.jsonb_build_object(
    'can_create', v_can_create,
    'has_profile', v_has_profile,
    'membership', v_membership
  );
end;
$$;

revoke all on function public.get_my_community() from public, anon;
grant execute on function public.get_my_community() to authenticated;

-- 2. Función RPC para unirse a una comunidad mediante su código de invitación
create or replace function public.join_community_by_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_code, '')));
  v_comm_id uuid;
  v_comm_name text;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;

  if not exists (select 1 from public.perfiles where id = v_uid) then
    raise exception 'Completa y guarda tu perfil antes de unirte a una comunidad' using errcode = '23503';
  end if;

  if exists (select 1 from public.miembros where usuario_id = v_uid) then
    raise exception 'Ya perteneces a una comunidad' using errcode = '23505';
  end if;

  if v_code = '' or pg_catalog.char_length(v_code) < 3 then
    raise exception 'Código de comunidad inválido' using errcode = '22023';
  end if;

  -- Buscar la comunidad por su código
  select id, nombre into v_comm_id, v_comm_name
  from public.comunidades
  where codigo_invitacion = v_code;

  if v_comm_id is null then
    raise exception 'Comunidad no encontrada con ese código' using errcode = 'P0002';
  end if;

  -- Insertar como miembro
  insert into public.miembros (comunidad_id, usuario_id, rol)
  values (v_comm_id, v_uid, 'miembro')
  on conflict (comunidad_id, usuario_id) do nothing;

  -- Actualizar comunidad activa en perfil
  update public.perfiles
  set comunidad_activa = v_comm_id
  where id = v_uid;

  return pg_catalog.jsonb_build_object(
    'user_id', v_uid,
    'community_id', v_comm_id,
    'community_name', v_comm_name,
    'role', 'member'
  );
end;
$$;

revoke all on function public.join_community_by_code(text) from public, anon;
grant execute on function public.join_community_by_code(text) to authenticated;

commit;
