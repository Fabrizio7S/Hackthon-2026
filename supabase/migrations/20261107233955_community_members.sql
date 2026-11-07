-- T01.5 / D17-D18. Lectura mínima de integrantes; no ampliar acceso a perfiles.
begin;

create function community_internal.get_my_community_members()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  own_community uuid;
  result jsonb;
begin
  if actor is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  select m.community_id into own_community from public.memberships m where m.user_id = actor;
  if not found then raise exception using errcode = '42501', message = 'Community membership required'; end if;

  select pg_catalog.jsonb_build_object(
    'community_id', own_community,
    'members', coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'display_name', p.display_name, 'role', m.role, 'is_current_user', m.user_id = actor
    ) order by (m.role = 'representative') desc, pg_catalog.lower(p.display_name), m.user_id), '[]'::jsonb)
  ) into result from public.memberships m join public.profiles p on p.id = m.user_id
    where m.community_id = own_community;
  return result;
end;
$$;
revoke all on function community_internal.get_my_community_members() from public, anon;
grant execute on function community_internal.get_my_community_members() to authenticated;

create function public.get_my_community_members()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select community_internal.get_my_community_members();
$$;
revoke all on function public.get_my_community_members() from public, anon;
grant execute on function public.get_my_community_members() to authenticated;

commit;
