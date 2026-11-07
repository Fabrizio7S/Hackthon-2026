-- T01.4 / D17-D19. Requiere perfil y creación de comunidad; revisar antes de aplicar.
begin;

create table public.community_invitations (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id),
  sender_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create unique index community_invitations_pending on public.community_invitations(community_id, recipient_id)
  where status = 'pending';
create index community_invitations_recipient on public.community_invitations(recipient_id);
create index community_invitations_sender on public.community_invitations(sender_id);
alter table public.community_invitations enable row level security;
-- Acceso exclusivamente por operaciones acotadas; no abrir escritura de estados.
revoke all on public.community_invitations from public, anon, authenticated;

create function community_internal.representative_community()
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  own_community uuid;
begin
  if actor is null or not exists (
    select 1 from community_internal.representative_authorizations a where a.user_id = actor
  ) then
    raise exception using errcode = '42501', message = 'Representative authorization required';
  end if;
  select m.community_id into own_community from public.memberships m
    where m.user_id = actor and m.role = 'representative';
  if not found then
    raise exception using errcode = '42501', message = 'Representative membership required';
  end if;
  return own_community;
end;
$$;
revoke all on function community_internal.representative_community() from public, anon, authenticated;

create function community_internal.find_neighbor(p_code uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  result jsonb;
begin
  perform community_internal.representative_community();
  select pg_catalog.jsonb_build_object('display_name', p.display_name, 'personal_code', p.personal_code)
    into result from public.profiles p where p.personal_code = p_code;
  return result;
end;
$$;
revoke all on function community_internal.find_neighbor(uuid) from public, anon;
grant execute on function community_internal.find_neighbor(uuid) to authenticated;

-- El renderizador interno no es un punto de entrada del cliente.
create function community_internal.invitation_json(p_id uuid, p_actor uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select pg_catalog.jsonb_build_object(
    'id', i.id, 'community_id', i.community_id, 'community_name', c.name, 'status', i.status,
    'direction', case when i.recipient_id = p_actor then 'incoming' else 'outgoing' end,
    'recipient_name', case when i.sender_id = p_actor then p.display_name else null end
  ) from public.community_invitations i
  join public.communities c on c.id = i.community_id
  join public.profiles p on p.id = i.recipient_id
  where i.id = p_id and (i.sender_id = p_actor or i.recipient_id = p_actor);
$$;
revoke all on function community_internal.invitation_json(uuid, uuid) from public, anon, authenticated;

create function community_internal.send_invitation(p_code uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  own_community uuid;
  recipient uuid;
  invitation_id uuid;
begin
  own_community := community_internal.representative_community();
  -- Mismo orden de bloqueo que aceptación y creación: perfil antes de invitación.
  select p.id into recipient from public.profiles p where p.personal_code = p_code for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Neighbor not found';
  end if;
  if exists (select 1 from public.memberships m where m.user_id = recipient) then
    raise exception using errcode = '23505', message = 'Neighbor already belongs to a community';
  end if;
  select i.id into invitation_id from public.community_invitations i
    where i.community_id = own_community and i.recipient_id = recipient and i.status = 'pending';
  if not found then
    insert into public.community_invitations(community_id, sender_id, recipient_id)
      values (own_community, actor, recipient) returning id into invitation_id;
  end if;
  return community_internal.invitation_json(invitation_id, actor);
end;
$$;
revoke all on function community_internal.send_invitation(uuid) from public, anon;
grant execute on function community_internal.send_invitation(uuid) to authenticated;

create function community_internal.get_my_invitations()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  result jsonb;
begin
  if actor is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  select coalesce(pg_catalog.jsonb_agg(community_internal.invitation_json(i.id, actor)
      order by i.created_at desc, i.id), '[]'::jsonb) into result
  from public.community_invitations i
  where i.recipient_id = actor or (
    i.sender_id = actor and exists (
      select 1 from public.memberships m
      join community_internal.representative_authorizations a on a.user_id = m.user_id
      where m.user_id = actor and m.role = 'representative' and m.community_id = i.community_id
    )
  );
  return result;
end;
$$;
revoke all on function community_internal.get_my_invitations() from public, anon;
grant execute on function community_internal.get_my_invitations() to authenticated;

create function community_internal.process_invitation(p_id uuid, p_accept boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  invitation public.community_invitations%rowtype;
  own_community uuid;
begin
  if actor is null or p_accept is null then
    raise exception using errcode = '42501', message = 'Recipient required';
  end if;
  -- No distinguir un id inexistente de uno ajeno.
  if not exists (select 1 from public.community_invitations i where i.id = p_id and i.recipient_id = actor) then
    raise exception using errcode = '42501', message = 'Recipient required';
  end if;
  perform 1 from public.profiles p where p.id = actor for update;
  select * into invitation from public.community_invitations i
    where i.id = p_id and i.recipient_id = actor for update;
  if not found then raise exception using errcode = '42501', message = 'Recipient required'; end if;
  if invitation.status <> 'pending' then
    return community_internal.invitation_json(invitation.id, actor);
  end if;
  if p_accept then
    select m.community_id into own_community from public.memberships m where m.user_id = actor;
    if found and own_community <> invitation.community_id then
      raise exception using errcode = '23505', message = 'Already belongs to another community';
    end if;
    if own_community is null then
      insert into public.memberships(user_id, community_id, role) values (actor, invitation.community_id, 'member');
    end if;
  end if;
  update public.community_invitations set status = case when p_accept then 'accepted' else 'rejected' end
    where id = invitation.id;
  return community_internal.invitation_json(invitation.id, actor);
end;
$$;
revoke all on function community_internal.process_invitation(uuid, boolean) from public, anon;
grant execute on function community_internal.process_invitation(uuid, boolean) to authenticated;

create function public.find_neighbor(p_code uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select community_internal.find_neighbor(p_code);
$$;
create function public.send_invitation(p_code uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select community_internal.send_invitation(p_code);
$$;
create function public.get_my_invitations()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select community_internal.get_my_invitations();
$$;
create function public.process_invitation(p_id uuid, p_accept boolean)
returns jsonb language sql security invoker set search_path = '' as $$
  select community_internal.process_invitation(p_id, p_accept);
$$;
revoke all on function public.find_neighbor(uuid), public.send_invitation(uuid),
  public.get_my_invitations(), public.process_invitation(uuid, boolean) from public, anon;
grant execute on function public.find_neighbor(uuid), public.send_invitation(uuid),
  public.get_my_invitations(), public.process_invitation(uuid, boolean) to authenticated;

commit;
