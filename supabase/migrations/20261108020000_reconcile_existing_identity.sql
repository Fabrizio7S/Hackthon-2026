-- T01.7 / D16-D19: Reconciliación no destructiva con el esquema existente en español.
-- Preserva las tablas existentes (perfiles, comunidades, miembros, invitaciones) y sus relaciones.
-- Incorpora código personal de vecino, autorización de representante y puente RPC compatible con G01.

begin;

-- 1. Incorporar código personal único para invitaciones en perfiles (D17)
alter table public.perfiles
  add column if not exists codigo_personal uuid not null default gen_random_uuid() unique;

-- 2. Tabla de representantes autorizados manualmente en backend (D19)
create table if not exists public.representantes_autorizados (
  usuario_id uuid primary key references public.perfiles(id) on delete cascade,
  creado_en timestamptz not null default now()
);

alter table public.representantes_autorizados enable row level security;
revoke all on public.representantes_autorizados from public, anon, authenticated;
grant select on public.representantes_autorizados to authenticated;

drop policy if exists representantes_autorizados_select_own on public.representantes_autorizados;
create policy representantes_autorizados_select_own on public.representantes_autorizados
  for select to authenticated
  using (usuario_id = auth.uid());

-- 3. Vista compatible public.profiles (permite lectura y edición desde profileService)
create or replace view public.profiles as
  select
    id,
    nombre as display_name,
    codigo_personal as personal_code
  from public.perfiles;

grant select, update on public.profiles to authenticated;

-- Regla de actualización para la vista profiles
create or replace rule profiles_upd as on update to public.profiles
  do instead update public.perfiles
    set nombre = new.display_name
    where id = old.id and id = auth.uid();

-- 4. RPC get_my_community: resuelve estado y membresía de la sesión activa
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
    'role', case when m.rol = 'admin' then 'representative' else 'member' end
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

-- 5. RPC create_community: creación atómica autorizada con zona geográfica
create or replace function public.create_community(
  p_name text,
  p_lat double precision default -12.0668,
  p_lng double precision default -77.0365,
  p_zona_nombre text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := pg_catalog.btrim(p_name);
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;

  if not exists (select 1 from public.perfiles where id = v_uid) then
    raise exception 'Completa tu perfil antes de crear una comunidad' using errcode = '23503';
  end if;

  if not exists (select 1 from public.representantes_autorizados where usuario_id = v_uid) then
    raise exception 'Tu cuenta no está autorizada para crear una comunidad' using errcode = '42501';
  end if;

  if exists (select 1 from public.miembros where usuario_id = v_uid) then
    raise exception 'Ya perteneces a una comunidad' using errcode = '23505';
  end if;

  if pg_catalog.char_length(v_name) < 3 or pg_catalog.char_length(v_name) > 60 then
    raise exception 'El nombre debe tener entre 3 y 60 caracteres' using errcode = '22023';
  end if;

  insert into public.comunidades (nombre, zona, zona_nombre, creada_por)
  values (
    v_name,
    extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
    nullif(pg_catalog.btrim(p_zona_nombre), ''),
    v_uid
  )
  returning id into v_id;

  insert into public.miembros (comunidad_id, usuario_id, rol)
  values (v_id, v_uid, 'admin');

  update public.perfiles set comunidad_activa = v_id where id = v_uid;

  return pg_catalog.jsonb_build_object(
    'user_id', v_uid,
    'community_id', v_id,
    'community_name', v_name,
    'role', 'representative'
  );
end;
$$;

revoke all on function public.create_community(text, double precision, double precision, text) from public, anon;
grant execute on function public.create_community(text, double precision, double precision, text) to authenticated;

-- 6. RPC find_neighbor: búsqueda segura por código de vecino para representantes
create or replace function public.find_neighbor(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code uuid;
  v_res jsonb := null;
begin
  if v_uid is null or not exists (select 1 from public.representantes_autorizados where usuario_id = v_uid) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  begin
    v_code := p_code::uuid;
  exception when others then
    raise exception 'Código inválido' using errcode = '22P02';
  end;

  select pg_catalog.jsonb_build_object('display_name', p.nombre, 'personal_code', p.codigo_personal::text)
  into v_res
  from public.perfiles p
  where p.codigo_personal = v_code;

  if v_res is null then
    raise exception 'Vecino no encontrado' using errcode = 'P0002';
  end if;

  return v_res;
end;
$$;

revoke all on function public.find_neighbor(text) from public, anon;
grant execute on function public.find_neighbor(text) to authenticated;

-- 7. RPC send_invitation: invitación por código personal hacia la tabla existente de invitaciones
create or replace function public.send_invitation(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code uuid;
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

  begin
    v_code := p_code::uuid;
  exception when others then
    raise exception 'Código inválido' using errcode = '22P02';
  end;

  select p.id, p.nombre, u.email into v_dest_id, v_dest_name, v_dest_email
  from public.perfiles p
  join auth.users u on u.id = p.id
  where p.codigo_personal = v_code;

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

-- 8. RPC get_my_invitations: invitaciones entrantes y salientes
create or replace function public.get_my_invitations()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := pg_catalog.lower(auth.jwt() ->> 'email');
  v_result jsonb;
begin
  select coalesce(pg_catalog.jsonb_agg(inv), '[]'::jsonb) into v_result
  from (
    select pg_catalog.jsonb_build_object(
      'id', i.id,
      'community_id', i.comunidad_id,
      'community_name', c.nombre,
      'status', case i.estado when 'pendiente' then 'pending' when 'aceptada' then 'accepted' else 'rejected' end,
      'direction', 'incoming',
      'recipient_name', null
    ) as inv
    from public.invitaciones i
    join public.comunidades c on c.id = i.comunidad_id
    where i.correo = v_email and i.estado = 'pendiente'
    union all
    select pg_catalog.jsonb_build_object(
      'id', i.id,
      'community_id', i.comunidad_id,
      'community_name', c.nombre,
      'status', case i.estado when 'pendiente' then 'pending' when 'aceptada' then 'accepted' else 'rejected' end,
      'direction', 'outgoing',
      'recipient_name', p.nombre
    ) as inv
    from public.invitaciones i
    join public.comunidades c on c.id = i.comunidad_id
    left join auth.users u on pg_catalog.lower(u.email) = i.correo
    left join public.perfiles p on p.id = u.id
    where i.invitado_por = v_uid
  ) t;

  return v_result;
end;
$$;

revoke all on function public.get_my_invitations() from public, anon;
grant execute on function public.get_my_invitations() to authenticated;

-- 9. RPC process_invitation: aceptación o rechazo seguro de invitaciones
create or replace function public.process_invitation(p_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := pg_catalog.lower(auth.jwt() ->> 'email');
  v_comm_id uuid;
  v_comm_name text;
  v_status public.estado_invitacion;
begin
  select i.comunidad_id, c.nombre, i.estado into v_comm_id, v_comm_name, v_status
  from public.invitaciones i
  join public.comunidades c on c.id = i.comunidad_id
  where i.id = p_id and i.correo = v_email;

  if v_comm_id is null then
    raise exception 'Invitación no encontrada' using errcode = 'P0002';
  end if;

  if v_status <> 'pendiente' then
    return pg_catalog.jsonb_build_object(
      'id', p_id,
      'community_id', v_comm_id,
      'community_name', v_comm_name,
      'status', case v_status when 'aceptada' then 'accepted' else 'rejected' end,
      'direction', 'incoming',
      'recipient_name', null
    );
  end if;

  if p_accept then
    if exists (select 1 from public.miembros where usuario_id = v_uid) then
      raise exception 'Ya perteneces a una comunidad' using errcode = '23505';
    end if;

    update public.invitaciones set estado = 'aceptada' where id = p_id;
    insert into public.miembros (comunidad_id, usuario_id, rol)
    values (v_comm_id, v_uid, 'miembro')
    on conflict do nothing;

    update public.perfiles set comunidad_activa = v_comm_id where id = v_uid;

    return pg_catalog.jsonb_build_object(
      'id', p_id,
      'community_id', v_comm_id,
      'community_name', v_comm_name,
      'status', 'accepted',
      'direction', 'incoming',
      'recipient_name', null
    );
  else
    update public.invitaciones set estado = 'rechazada' where id = p_id;
    return pg_catalog.jsonb_build_object(
      'id', p_id,
      'community_id', v_comm_id,
      'community_name', v_comm_name,
      'status', 'rejected',
      'direction', 'incoming',
      'recipient_name', null
    );
  end if;
end;
$$;

revoke all on function public.process_invitation(uuid, boolean) from public, anon;
grant execute on function public.process_invitation(uuid, boolean) to authenticated;

-- 10. RPC get_my_community_members: miembros de la comunidad activa
create or replace function public.get_my_community_members()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_comm_id uuid;
  v_members jsonb;
begin
  select comunidad_id into v_comm_id from public.miembros where usuario_id = v_uid limit 1;
  if v_comm_id is null then
    raise exception 'No perteneces a ninguna comunidad' using errcode = '42501';
  end if;

  select pg_catalog.jsonb_agg(
    pg_catalog.jsonb_build_object(
      'display_name', p.nombre,
      'role', case when m.rol = 'admin' then 'representative' else 'member' end,
      'is_current_user', m.usuario_id = v_uid
    ) order by m.unido_en asc
  ) into v_members
  from public.miembros m
  join public.perfiles p on p.id = m.usuario_id
  where m.comunidad_id = v_comm_id;

  return pg_catalog.jsonb_build_object(
    'community_id', v_comm_id,
    'members', coalesce(v_members, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_my_community_members() from public, anon;
grant execute on function public.get_my_community_members() to authenticated;

commit;
