-- Permite buscar e invitar vecinos tanto por su código corto legible (VEC-XXXX-XXXX)
-- como por el UUID completo, manteniendo intacta la columna public.perfiles.codigo_personal (uuid unique)
-- y la vista public.profiles.

begin;

create or replace function public.format_personal_code(p_uuid uuid)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select 'VEC-' || pg_catalog.upper(pg_catalog.substr(p_uuid::text, 1, 4))
       || '-'   || pg_catalog.upper(pg_catalog.substr(p_uuid::text, 5, 4));
$$;

grant execute on function public.format_personal_code(uuid) to authenticated;

create or replace function public.find_neighbor(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_raw text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_code, '')));
  v_clean text;
  v_uuid uuid := null;
  v_res jsonb := null;
begin
  if v_uid is null or not exists (select 1 from public.representantes_autorizados where usuario_id = v_uid) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if v_raw ~ '^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$' then
    v_uuid := v_raw::uuid;
  else
    v_clean := pg_catalog.regexp_replace(v_raw, '^VEC-', '');
    v_clean := pg_catalog.replace(v_clean, '-', '');
    if v_clean !~ '^[0-9A-F]{8}$' then
      raise exception 'Código inválido' using errcode = '22P02';
    end if;
  end if;

  select pg_catalog.jsonb_build_object(
    'display_name', p.nombre,
    'personal_code', p.codigo_personal::text
  )
  into v_res
  from public.perfiles p
  where (v_uuid is not null and p.codigo_personal = v_uuid)
     or (v_uuid is null and pg_catalog.upper(pg_catalog.substr(p.codigo_personal::text, 1, 8)) = v_clean)
  limit 1;

  if v_res is null then
    raise exception 'Vecino no encontrado' using errcode = 'P0002';
  end if;

  return v_res;
end;
$$;

revoke all on function public.find_neighbor(text) from public, anon;
grant execute on function public.find_neighbor(text) to authenticated;

create or replace function public.send_invitation(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_raw text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_code, '')));
  v_clean text;
  v_uuid uuid := null;
  v_comm_id uuid;
  v_comm_name text;
  v_dest_id uuid;
  v_dest_name text;
  v_dest_email text;
  v_inv_id uuid;
  v_inv_status public.estado_invitacion;
begin
  if v_uid is null or not exists (select 1 from public.representantes_autorizados where usuario_id = v_uid) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select m.comunidad_id, c.nombre into v_comm_id, v_comm_name
  from public.miembros m
  join public.comunidades c on c.id = m.comunidad_id
  where m.usuario_id = v_uid and m.rol = 'admin';

  if v_comm_id is null then
    raise exception 'No administras una comunidad' using errcode = '42501';
  end if;

  if v_raw ~ '^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$' then
    v_uuid := v_raw::uuid;
  else
    v_clean := pg_catalog.regexp_replace(v_raw, '^VEC-', '');
    v_clean := pg_catalog.replace(v_clean, '-', '');
    if v_clean !~ '^[0-9A-F]{8}$' then
      raise exception 'Código inválido' using errcode = '22P02';
    end if;
  end if;

  select p.id, p.nombre, u.email into v_dest_id, v_dest_name, v_dest_email
  from public.perfiles p
  join auth.users u on u.id = p.id
  where (v_uuid is not null and p.codigo_personal = v_uuid)
     or (v_uuid is null and pg_catalog.upper(pg_catalog.substr(p.codigo_personal::text, 1, 8)) = v_clean)
  limit 1;

  if v_dest_id is null then
    raise exception 'Vecino no encontrado' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.miembros where usuario_id = v_dest_id) then
    raise exception 'El vecino ya pertenece a una comunidad' using errcode = '23505';
  end if;

  select id, estado into v_inv_id, v_inv_status
  from public.invitaciones
  where comunidad_id = v_comm_id and correo = pg_catalog.lower(v_dest_email);

  if v_inv_id is not null then
    if v_inv_status = 'pendiente' then
      return pg_catalog.jsonb_build_object(
        'id', v_inv_id,
        'community_id', v_comm_id,
        'community_name', v_comm_name,
        'status', 'pending',
        'direction', 'outgoing',
        'recipient_name', v_dest_name
      );
    elsif v_inv_status = 'rechazada' then
      update public.invitaciones
      set estado = 'pendiente', creado_en = now(), invitado_por = v_uid
      where id = v_inv_id;
    else
      raise exception 'Invitación ya aceptada' using errcode = '23505';
    end if;
  else
    insert into public.invitaciones (comunidad_id, correo, invitado_por, estado)
    values (v_comm_id, pg_catalog.lower(v_dest_email), v_uid, 'pendiente')
    returning id into v_inv_id;
  end if;

  return pg_catalog.jsonb_build_object(
    'id', v_inv_id,
    'community_id', v_comm_id,
    'community_name', v_comm_name,
    'status', 'pending',
    'direction', 'outgoing',
    'recipient_name', v_dest_name
  );
end;
$$;

revoke all on function public.send_invitation(text) from public, anon;
grant execute on function public.send_invitation(text) to authenticated;

commit;
