-- T01.2 / D17. Revisar el esquema del proyecto compartido antes de aplicar.
-- La ausencia de IF NOT EXISTS es deliberada: un esquema ajeno no debe ocultarse.
begin;

create table public.profiles (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null,
  personal_code uuid not null default gen_random_uuid() unique,
  constraint profiles_display_name_valid check (
    char_length(display_name) between 1 and 100
    and display_name = btrim(display_name)
    and display_name ~ '[^[:space:]]'
    and display_name !~ '[[:cntrl:]]'
  )
);

alter table public.profiles enable row level security;

-- Evitar que los privilegios por defecto otorguen edición de identidad o código.
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

commit;
