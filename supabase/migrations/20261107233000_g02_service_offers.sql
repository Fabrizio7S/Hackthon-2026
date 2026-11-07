-- G02: ofertas de servicios/productos y sus calificaciones.
-- Responsable: Persona 2. Ficha: docs/tareas/T02-7-migracion-ofertas.md.
-- Decisiones: D16 (campos), D17 (teléfono), D18 (estrellas), D19 (edición y retiro).
--
-- PROVISIONAL hasta el contrato de comunidad de Persona 1:
--   community_id no tiene clave foránea y la lectura no se limita por comunidad.
--   Añadir ambas cosas en una migración nueva; no editar esta si ya se aplicó.
-- PROVISIONAL hasta el contrato de ubicación de Persona 5: latitude/longitude.

-- ---------------------------------------------------------------------------
-- Ofertas
-- ---------------------------------------------------------------------------
create table public.service_offers (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  community_id uuid,
  client_request_id uuid,
  kind text not null check (kind in ('servicio', 'producto')),
  title text not null check (char_length(btrim(title)) between 3 and 80),
  description text check (description is null or char_length(description) <= 500),
  contact_phone text not null check (contact_phone ~ '^\+?[0-9 ().-]{6,25}$'),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  status text not null default 'activa' check (status in ('activa', 'retirada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_offers_location_pair check ((latitude is null) = (longitude is null)),
  -- Evita duplicados si el mismo envío llega dos veces (Q07).
  constraint service_offers_client_request_unique unique (author_id, client_request_id)
);

comment on table public.service_offers is 'G02: ofertas de servicios y productos (D16-D19).';

create index service_offers_status_created_idx on public.service_offers (status, created_at desc);

-- Campos que no cambian tras publicar y updated_at automático.
create function public.service_offers_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
     or new.author_id <> old.author_id
     or new.kind <> old.kind
     or new.created_at <> old.created_at
     or new.community_id is distinct from old.community_id
     or new.client_request_id is distinct from old.client_request_id then
    raise exception 'No se puede cambiar id, autor, tipo, comunidad ni fecha de creación de una oferta'
      using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger service_offers_before_update
before update on public.service_offers
for each row execute function public.service_offers_before_update();

alter table public.service_offers enable row level security;

-- Lectura: ofertas activas y las propias (aunque estén retiradas).
-- PROVISIONAL: falta limitar a la comunidad del vecino.
create policy service_offers_select on public.service_offers
for select to authenticated
using (status = 'activa' or author_id = (select auth.uid()));

-- Crear: siempre como autor y activa.
create policy service_offers_insert on public.service_offers
for insert to authenticated
with check (author_id = (select auth.uid()) and status = 'activa');

-- Editar, retirar y reactivar: solo el autor (D19).
create policy service_offers_update on public.service_offers
for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));

-- Sin política de borrado: retirar cambia el estado.

revoke all on public.service_offers from anon;
grant select, insert, update on public.service_offers to authenticated;

-- ---------------------------------------------------------------------------
-- Calificaciones (D18)
-- ---------------------------------------------------------------------------
create table public.service_offer_ratings (
  offer_id uuid not null references public.service_offers (id) on delete cascade,
  rater_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Una calificación por vecino y oferta.
  primary key (offer_id, rater_id)
);

comment on table public.service_offer_ratings is 'G02: una calificación de 1 a 5 por vecino y oferta (D18).';

create function public.service_offer_ratings_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.offer_id <> old.offer_id or new.rater_id <> old.rater_id or new.created_at <> old.created_at then
    raise exception 'Solo se puede cambiar el número de estrellas'
      using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger service_offer_ratings_before_update
before update on public.service_offer_ratings
for each row execute function public.service_offer_ratings_before_update();

alter table public.service_offer_ratings enable row level security;

-- Ver calificaciones de las ofertas que el vecino puede ver.
create policy service_offer_ratings_select on public.service_offer_ratings
for select to authenticated
using (exists (select 1 from public.service_offers o where o.id = offer_id));

-- Calificar: como uno mismo, una oferta activa visible y que no sea propia.
create policy service_offer_ratings_insert on public.service_offer_ratings
for insert to authenticated
with check (
  rater_id = (select auth.uid())
  and exists (
    select 1 from public.service_offers o
    where o.id = offer_id and o.status = 'activa' and o.author_id <> (select auth.uid())
  )
);

-- Cambiar la propia nota, con las mismas condiciones.
create policy service_offer_ratings_update on public.service_offer_ratings
for update to authenticated
using (rater_id = (select auth.uid()))
with check (
  rater_id = (select auth.uid())
  and exists (
    select 1 from public.service_offers o
    where o.id = offer_id and o.status = 'activa' and o.author_id <> (select auth.uid())
  )
);

revoke all on public.service_offer_ratings from anon;
grant select, insert, update on public.service_offer_ratings to authenticated;

-- Promedio y cantidad por oferta. security_invoker aplica las políticas de quien consulta.
create view public.service_offer_rating_summary
with (security_invoker = true) as
select
  offer_id,
  round(avg(stars)::numeric, 2) as average,
  count(*)::integer as rating_count
from public.service_offer_ratings
group by offer_id;

revoke all on public.service_offer_rating_summary from anon;
grant select on public.service_offer_rating_summary to authenticated;
