-- T01.3 / D18-D19. Requiere la migración de perfil y revisión del esquema remoto.
begin;

-- Esquema interno del módulo: mantener fuera de los esquemas expuestos por Data API.
create schema community_internal;
revoke all on schema community_internal from public, anon, authenticated;
grant usage on schema community_internal to authenticated;

create table community_internal.representative_authorizations (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table community_internal.representative_authorizations enable row level security;
revoke all on community_internal.representative_authorizations from public, anon, authenticated;
grant select on community_internal.representative_authorizations to authenticated;
create policy representative_authorization_select_own
  on community_internal.representative_authorizations for select to authenticated
  using ((select auth.uid()) = user_id);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id),
  constraint communities_name_valid check (
    char_length(name) between 1 and 100 and name = btrim(name)
    and name ~ '[^[:space:]]' and name !~ '[[:cntrl:]]'
  )
);

create table public.memberships (
  user_id uuid primary key references public.profiles(id),
  community_id uuid not null references public.communities(id) on delete cascade,
  role text not null check (role in ('representative', 'member'))
);
create index memberships_community_id on public.memberships(community_id);
create unique index memberships_one_representative on public.memberships(community_id)
  where role = 'representative';

alter table public.communities enable row level security;
alter table public.memberships enable row level security;
revoke all on public.communities, public.memberships from public, anon, authenticated;
grant select on public.communities, public.memberships to authenticated;

-- Pertenencia propia: evita políticas recursivas y no revela integrantes ajenos.
create policy memberships_select_own on public.memberships for select to authenticated
  using ((select auth.uid()) = user_id);
create policy communities_select_member on public.communities for select to authenticated
  using (exists (
    select 1 from public.memberships m
    where m.community_id = communities.id and m.user_id = (select auth.uid())
  ));

create function public.get_my_community()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select pg_catalog.jsonb_build_object(
    'can_create', exists (
      select 1 from community_internal.representative_authorizations a
      where a.user_id = (select auth.uid())
    ),
    'has_profile', exists (select 1 from public.profiles p where p.id = (select auth.uid())),
    'membership', (
      select pg_catalog.jsonb_build_object(
        'user_id', m.user_id, 'community_id', m.community_id,
        'role', m.role, 'community_name', c.name
      ) from public.memberships m join public.communities c on c.id = m.community_id
      where m.user_id = (select auth.uid())
    )
  );
$$;
revoke all on function public.get_my_community() from public, anon;
grant execute on function public.get_my_community() to authenticated;

-- Elevación acotada: la operación crea comunidad y membresía de manera atómica,
-- sin conceder escrituras de tablas al cliente. No confía en metadatos de usuario.
create function community_internal.create_community(p_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  clean_name text := pg_catalog.btrim(p_name);
  existing record;
  new_id uuid;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;
  if not exists (
    select 1 from community_internal.representative_authorizations a where a.user_id = actor
  ) then
    raise exception using errcode = '42501', message = 'Representative authorization required';
  end if;
  if clean_name is null or pg_catalog.char_length(clean_name) not between 1 and 100
    or clean_name !~ '[^[:space:]]' or clean_name ~ '[[:cntrl:]]' then
    raise exception using errcode = '22023', message = 'Invalid community name';
  end if;

  -- Bloqueo de la identidad: también deberá usarse al aceptar futuras invitaciones.
  perform 1 from public.profiles p where p.id = actor for update;
  if not found then
    raise exception using errcode = '23503', message = 'Complete profile first';
  end if;

  select m.community_id, m.role, c.name into existing
  from public.memberships m join public.communities c on c.id = m.community_id
  where m.user_id = actor;
  if found then
    if existing.role <> 'representative' or existing.name <> clean_name then
      raise exception using errcode = '23505', message = 'Already belongs to a community';
    end if;
    new_id := existing.community_id;
  else
    insert into public.communities(name, created_by) values (clean_name, actor) returning id into new_id;
    insert into public.memberships(user_id, community_id, role) values (actor, new_id, 'representative');
  end if;

  return pg_catalog.jsonb_build_object(
    'user_id', actor, 'community_id', new_id, 'role', 'representative', 'community_name', clean_name
  );
end;
$$;
revoke all on function community_internal.create_community(text) from public, anon;
grant execute on function community_internal.create_community(text) to authenticated;

-- La función expuesta es invoker; la elevación está dentro del esquema no expuesto.
create function public.create_community(p_name text)
returns jsonb language sql security invoker set search_path = '' as $$
  select community_internal.create_community(p_name);
$$;
revoke all on function public.create_community(text) from public, anon;
grant execute on function public.create_community(text) to authenticated;

commit;
