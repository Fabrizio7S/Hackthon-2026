begin;

alter table public.comunidades
  drop constraint if exists comunidades_nombre_check,
  add constraint comunidades_nombre_check check (pg_catalog.char_length(pg_catalog.btrim(nombre)) between 1 and 100);

-- Las bajas de la aplicación pasan por las RPC y su comprobación de roles.
revoke delete on public.miembros from public, anon, authenticated;

create function public.leave_community()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_community uuid;
  v_role public.miembros.rol%type;
begin
  if v_user is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;

  select comunidad_id into v_community from public.miembros where usuario_id = v_user;
  if v_community is null then return; end if;

  -- Serializa las bajas de una misma comunidad antes de contar sus representantes.
  perform 1 from public.comunidades where id = v_community for update;
  select rol into v_role from public.miembros
    where comunidad_id = v_community and usuario_id = v_user for update;
  if not found then return; end if;

  if v_role = 'admin' and not exists (
    select 1 from public.miembros
    where comunidad_id = v_community and rol = 'admin' and usuario_id <> v_user
  ) then
    raise exception 'La comunidad necesita al menos un representante' using errcode = '42501';
  end if;

  delete from public.miembros where comunidad_id = v_community and usuario_id = v_user;
  update public.perfiles set comunidad_activa = null
    where id = v_user and comunidad_activa = v_community;
end;
$$;

create function public.remove_community_member(p_target_user_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_community uuid;
begin
  if v_user is null or p_target_user_id is null or p_target_user_id = v_user then
    raise exception 'No puedes dar de baja a este integrante' using errcode = '42501';
  end if;

  select comunidad_id into v_community from public.miembros
    where usuario_id = v_user and rol = 'admin';
  perform 1 from public.comunidades where id = v_community for update;

  if not exists (select 1 from public.miembros where comunidad_id = v_community and usuario_id = v_user and rol = 'admin')
    or not exists (select 1 from public.representantes_autorizados where usuario_id = v_user) then
    raise exception 'Se requiere un representante autorizado' using errcode = '42501';
  end if;

  delete from public.miembros
    where comunidad_id = v_community and usuario_id = p_target_user_id and rol = 'miembro';
  if not found then
    raise exception 'El usuario no es un vecino de esta comunidad' using errcode = '42501';
  end if;

  update public.perfiles set comunidad_activa = null
    where id = p_target_user_id and comunidad_activa = v_community;
end;
$$;

create function public.update_community_name(p_name text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_community uuid;
  v_name text := pg_catalog.btrim(coalesce(p_name, ''));
begin
  if pg_catalog.char_length(v_name) not between 1 and 100 or v_name ~ '[[:cntrl:]]' then
    raise exception 'Nombre de comunidad inválido' using errcode = '22023';
  end if;

  select comunidad_id into v_community from public.miembros
    where usuario_id = v_user and rol = 'admin';
  perform 1 from public.comunidades where id = v_community for update;

  if not exists (select 1 from public.miembros where comunidad_id = v_community and usuario_id = v_user and rol = 'admin')
    or not exists (select 1 from public.representantes_autorizados where usuario_id = v_user) then
    raise exception 'Se requiere un representante autorizado' using errcode = '42501';
  end if;

  update public.comunidades set nombre = v_name where id = v_community returning nombre into v_name;
  return v_name;
end;
$$;

-- El identificador de destino se entrega solo al representante y solo para vecinos que puede dar de baja.
create or replace function public.get_my_community_members()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_community uuid;
  v_can_manage boolean;
  v_members jsonb;
begin
  select comunidad_id, rol = 'admin' into v_community, v_can_manage
    from public.miembros where usuario_id = v_user;
  if v_community is null then
    raise exception 'No perteneces a ninguna comunidad' using errcode = '42501';
  end if;
  v_can_manage := v_can_manage and exists (
    select 1 from public.representantes_autorizados where usuario_id = v_user
  );

  select pg_catalog.jsonb_agg(
    pg_catalog.jsonb_build_object(
      'display_name', p.nombre,
      'role', case when m.rol = 'admin' then 'representative' else 'member' end,
      'is_current_user', m.usuario_id = v_user
    ) || case when v_can_manage and m.rol = 'miembro' and m.usuario_id <> v_user
      then pg_catalog.jsonb_build_object('user_id', m.usuario_id) else '{}'::jsonb end
    order by m.unido_en asc
  ) into v_members
  from public.miembros m join public.perfiles p on p.id = m.usuario_id
  where m.comunidad_id = v_community;

  return pg_catalog.jsonb_build_object('community_id', v_community, 'members', coalesce(v_members, '[]'::jsonb));
end;
$$;

revoke all on function public.leave_community(), public.remove_community_member(uuid),
  public.update_community_name(text), public.get_my_community_members() from public, anon;
grant execute on function public.leave_community(), public.remove_community_member(uuid),
  public.update_community_name(text), public.get_my_community_members() to authenticated;

commit;
