-- G04: Emergencias, ofrecimientos de ayuda, recursos críticos y grupos de apoyo.
-- Q06 resuelta para esta entrega (D26–D29 en docs/decisiones.md).
-- Migración ADITIVA sobre las tablas existentes emergencias, recursos,
-- grupos_apoyo y grupo_integrantes. No modifica tablas de otros módulos.
-- Reglas:
--   * Reportar y consultar: cualquier miembro de la comunidad.
--   * Atender (en_atencion) y cerrar (solucionado): solo el autor del reporte o el
--     representante (miembros.rol = 'admin'). Transiciones validadas en trigger.
--   * Ayuda: ofrecimiento con nota (una vez por vecino y reporte); lo acepta o
--     rechaza el autor o el representante.
--   * Recursos y grupos: los registra y cambia el representante; los vecinos consultan
--     y se unen a grupos.
--   * Reporte de persona vulnerable: el detalle (descripción, autor y ubicación
--     precisa) lo ven solo el autor, el representante y los ayudantes aceptados.
--   * Todas las escrituras sobre emergencias pasan por funciones; el cliente no
--     puede insertar ni actualizar la tabla directamente.

-- 1. Columnas nuevas -------------------------------------------------------
alter table public.emergencias
  add column if not exists es_persona_vulnerable boolean not null default false,
  add column if not exists client_request_id uuid,
  add column if not exists ubicacion_origen text not null default 'desconocido',
  add column if not exists es_demo boolean not null default false,
  add column if not exists atendido_en timestamptz,
  add column if not exists cerrado_en timestamptz,
  add column if not exists cerrado_por uuid references public.perfiles(id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'emergencias_ubicacion_origen_check') then
    alter table public.emergencias add constraint emergencias_ubicacion_origen_check
      check (ubicacion_origen in ('dispositivo', 'zona_comunidad', 'desconocido'));
  end if;
end $$;

-- Un mismo envío (reintento, doble pulsación, cola offline) crea un solo reporte.
create unique index if not exists emergencias_solicitud_cliente_idx
  on public.emergencias (autor_id, client_request_id) where client_request_id is not null;

alter table public.recursos add column if not exists es_demo boolean not null default false;
alter table public.grupos_apoyo
  add column if not exists es_demo boolean not null default false,
  add column if not exists activo boolean not null default true;

comment on column public.emergencias.es_demo is 'G04: dato de demostración; la app lo identifica con una etiqueta.';
comment on column public.recursos.es_demo is 'G04: dato de demostración; no es un recurso real.';
comment on column public.grupos_apoyo.es_demo is 'G04: dato de demostración; no es un grupo real.';

-- 2. Ofrecimientos de ayuda --------------------------------------------------
create table if not exists public.emergencia_apoyos (
  id uuid primary key default gen_random_uuid(),
  emergencia_id uuid not null references public.emergencias(id) on delete cascade,
  ayudante_id uuid not null references public.perfiles(id) on delete cascade,
  nota text not null default '' check (char_length(nota) <= 200),
  estado text not null default 'ofrecido' check (estado in ('ofrecido', 'aceptado', 'rechazado', 'retirado')),
  client_request_id uuid,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (emergencia_id, ayudante_id)
);
create index if not exists emergencia_apoyos_emergencia_idx on public.emergencia_apoyos (emergencia_id);
create index if not exists emergencia_apoyos_ayudante_idx on public.emergencia_apoyos (ayudante_id);
alter table public.emergencia_apoyos enable row level security;
comment on table public.emergencia_apoyos is 'G04: ofrecimientos de ayuda sobre un reporte de emergencia (D28).';

-- 3. Funciones auxiliares (sin recursión de RLS) ----------------------------
create or replace function public.mi_comunidad_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select m.comunidad_id from public.miembros m where m.usuario_id = auth.uid() limit 1;
$$;

create or replace function public.es_ayudante_aceptado(p_emergencia uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.emergencia_apoyos a
    where a.emergencia_id = p_emergencia and a.ayudante_id = auth.uid() and a.estado = 'aceptado'
  );
$$;

create or replace function public.puede_gestionar_emergencia(p_emergencia uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.emergencias e
    where e.id = p_emergencia
      and public.es_miembro(e.comunidad_id)
      and (e.autor_id = auth.uid() or public.es_admin(e.comunidad_id))
  );
$$;

-- 4. Triggers: validación de inserción y de transiciones en backend ----------
create or replace function public.emergencias_antes_insertar()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.descripcion := btrim(coalesce(new.descripcion, ''));
    if char_length(new.descripcion) < 5 then
      raise exception 'Describe la situación con al menos 5 letras' using errcode = '22023';
    end if;
    new.estado := 'abierta';
    new.es_demo := false;
    new.atendido_en := null;
    new.cerrado_en := null;
    new.cerrado_por := null;
  end if;
  return new;
end;
$$;

drop trigger if exists emergencias_insertar on public.emergencias;
create trigger emergencias_insertar before insert on public.emergencias
  for each row execute function public.emergencias_antes_insertar();

-- Sustituye la función del esquema original (la política que dejaba a cualquier
-- vecino cambiar el estado se elimina más abajo).
create or replace function public.emergencias_antes_actualizar()
returns trigger language plpgsql set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  -- Sin sesión de usuario (migraciones y mantenimiento del propietario): sin restricciones.
  if v_uid is null then
    return new;
  end if;

  if (new.id, new.comunidad_id, new.autor_id, new.categoria, new.nivel, new.descripcion,
      new.foto_path, new.es_persona_vulnerable, new.client_request_id, new.ubicacion_origen,
      new.es_demo, new.creado_en)
     is distinct from
     (old.id, old.comunidad_id, old.autor_id, old.categoria, old.nivel, old.descripcion,
      old.foto_path, old.es_persona_vulnerable, old.client_request_id, old.ubicacion_origen,
      old.es_demo, old.creado_en)
     or new.ubicacion::text is distinct from old.ubicacion::text then
    raise exception 'Solo se puede cambiar el estado del reporte' using errcode = '42501';
  end if;

  if new.estado is distinct from old.estado then
    if not (v_uid = old.autor_id or public.es_admin(old.comunidad_id)) then
      raise exception 'Solo el autor del reporte o el representante pueden cambiar su estado'
        using errcode = '42501';
    end if;
    if not ((old.estado = 'abierta' and new.estado in ('en_atencion', 'solucionado'))
         or (old.estado = 'en_atencion' and new.estado in ('abierta', 'solucionado'))) then
      raise exception 'Cambio de estado no permitido: % → %', old.estado, new.estado
        using errcode = 'P0001';
    end if;
    if new.estado = 'en_atencion' then
      new.atendido_en := now();
    elsif new.estado = 'abierta' then
      new.atendido_en := null;
    elsif new.estado = 'solucionado' then
      new.cerrado_en := now();
      new.cerrado_por := v_uid;
    end if;
  else
    new.atendido_en := old.atendido_en;
    new.cerrado_en := old.cerrado_en;
    new.cerrado_por := old.cerrado_por;
  end if;
  return new;
end;
$$;

-- 5. Marca de datos de demostración (comunidades semilla con identificadores ficticios)
update public.emergencias set es_demo = true where comunidad_id::text like '10000000-0000-4000-8000-%';
update public.recursos set es_demo = true where comunidad_id::text like '10000000-0000-4000-8000-%';
update public.grupos_apoyo set es_demo = true where comunidad_id::text like '10000000-0000-4000-8000-%';

-- 6. RLS y privilegios ---------------------------------------------------------
-- emergencias: lectura filtrada por privacidad; escritura solo mediante funciones.
drop policy if exists "emergencias: reportar en mi comunidad" on public.emergencias;
drop policy if exists "emergencias: vecinos actualizan el estado" on public.emergencias;
drop policy if exists "emergencias: ver las de mi comunidad" on public.emergencias;
create policy "emergencias: ver las visibles de mi comunidad" on public.emergencias
  for select to authenticated
  using (
    public.es_miembro(comunidad_id)
    and (
      not es_persona_vulnerable
      or autor_id = (select auth.uid())
      or public.es_admin(comunidad_id)
      or public.es_ayudante_aceptado(id)
    )
  );

revoke all on public.emergencias from anon;
revoke insert, update, delete, truncate, trigger, references on public.emergencias from authenticated;

-- emergencia_apoyos: lo ve su autor y quien gestiona el reporte; sin escritura directa.
drop policy if exists "emergencia_apoyos: ver los propios o los de mis reportes" on public.emergencia_apoyos;
create policy "emergencia_apoyos: ver los propios o los de mis reportes" on public.emergencia_apoyos
  for select to authenticated
  using (ayudante_id = (select auth.uid()) or public.puede_gestionar_emergencia(emergencia_id));
revoke all on public.emergencia_apoyos from anon, authenticated;
grant select on public.emergencia_apoyos to authenticated;

-- recursos y grupos: alta y cambios solo del representante (D27).
drop policy if exists "recursos: agregar en mi comunidad" on public.recursos;
drop policy if exists "recursos: editar si lo creé o soy admin" on public.recursos;
drop policy if exists "recursos: borrar si lo creé o soy admin" on public.recursos;
create policy "recursos: agregar el representante" on public.recursos
  for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.es_admin(comunidad_id) and es_demo = false);
create policy "recursos: editar el representante" on public.recursos
  for update to authenticated
  using (public.es_admin(comunidad_id)) with check (public.es_admin(comunidad_id));
create policy "recursos: borrar el representante" on public.recursos
  for delete to authenticated using (public.es_admin(comunidad_id));

drop policy if exists "grupos_apoyo: crear en mi comunidad" on public.grupos_apoyo;
drop policy if exists "grupos_apoyo: editar si lo creé o soy admin" on public.grupos_apoyo;
create policy "grupos_apoyo: crear el representante" on public.grupos_apoyo
  for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.es_admin(comunidad_id) and es_demo = false);
create policy "grupos_apoyo: editar el representante" on public.grupos_apoyo
  for update to authenticated
  using (public.es_admin(comunidad_id)) with check (public.es_admin(comunidad_id));

revoke all on public.recursos, public.grupos_apoyo, public.grupo_integrantes from anon;
revoke truncate, trigger, references on public.recursos, public.grupos_apoyo, public.grupo_integrantes from authenticated;

-- 7. Funciones de lectura ------------------------------------------------------
-- Representación de un reporte para el vecino que llama. Aplica la privacidad de
-- personas vulnerables: sin detalle, devuelve ubicación redondeada (~1 km).
create or replace function public.emergencia_a_json(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  e public.emergencias%rowtype;
  v_uid uuid := auth.uid();
  v_gestiona boolean;
  v_visible boolean;
  v_geom extensions.geometry;
begin
  select * into e from public.emergencias where id = p_id;
  if not found or v_uid is null or not public.es_miembro(e.comunidad_id) then
    return null;
  end if;
  v_gestiona := e.autor_id = v_uid or public.es_admin(e.comunidad_id);
  v_visible := not e.es_persona_vulnerable or v_gestiona or public.es_ayudante_aceptado(e.id);
  v_geom := e.ubicacion::extensions.geometry;
  if not v_visible then
    v_geom := extensions.st_snaptogrid(v_geom, 0.01);
  end if;
  return jsonb_build_object(
    'id', e.id,
    'categoria', e.categoria,
    'nivel', e.nivel,
    'estado', e.estado,
    'es_persona_vulnerable', e.es_persona_vulnerable,
    'detalle_restringido', not v_visible,
    'descripcion', case when v_visible then e.descripcion else null end,
    'lat', extensions.st_y(v_geom),
    'lng', extensions.st_x(v_geom),
    'ubicacion_origen', e.ubicacion_origen,
    'ubicacion_aproximada', not v_visible,
    'es_mio', e.autor_id = v_uid,
    'autor_nombre', case when v_visible then (select p.nombre from public.perfiles p where p.id = e.autor_id) else null end,
    'puede_gestionar', v_gestiona,
    'apoyos_ofrecidos', (select count(*) from public.emergencia_apoyos a
                          where a.emergencia_id = e.id and a.estado in ('ofrecido', 'aceptado')),
    'apoyos_aceptados', (select count(*) from public.emergencia_apoyos a
                          where a.emergencia_id = e.id and a.estado = 'aceptado'),
    'mi_apoyo', (select jsonb_build_object('id', a.id, 'estado', a.estado)
                   from public.emergencia_apoyos a
                  where a.emergencia_id = e.id and a.ayudante_id = v_uid),
    'es_demo', e.es_demo,
    'creado_en', e.creado_en,
    'actualizado_en', e.actualizado_en,
    'atendido_en', e.atendido_en,
    'cerrado_en', e.cerrado_en
  );
end;
$$;

create or replace function public.listar_emergencias()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  v_com uuid;
  v_nombre text;
  v_zona extensions.geometry;
  v_zona_nombre text;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  v_com := public.mi_comunidad_id();
  if v_com is null then
    raise exception 'Necesitas pertenecer a una comunidad para ver las emergencias' using errcode = '42501';
  end if;
  select c.nombre, c.zona::extensions.geometry, c.zona_nombre
    into v_nombre, v_zona, v_zona_nombre
    from public.comunidades c where c.id = v_com;
  return jsonb_build_object(
    'community_id', v_com,
    'community_name', v_nombre,
    'zona', jsonb_build_object('lat', extensions.st_y(v_zona), 'lng', extensions.st_x(v_zona), 'nombre', v_zona_nombre),
    'soy_representante', public.es_admin(v_com),
    'items', coalesce((
      select jsonb_agg(public.emergencia_a_json(x.id) order by x.creado_en desc)
      from (select id, creado_en from public.emergencias
             where comunidad_id = v_com order by creado_en desc limit 200) x
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.obtener_emergencia(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  v_json jsonb := public.emergencia_a_json(p_id);
  v_uid uuid := auth.uid();
  v_gestiona boolean;
  v_apoyos jsonb;
begin
  if v_json is null then
    raise exception 'El reporte ya no está disponible' using errcode = 'P0002';
  end if;
  v_gestiona := (v_json ->> 'puede_gestionar')::boolean;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id, 'ayudante_id', a.ayudante_id, 'ayudante_nombre', p.nombre,
           'nota', a.nota, 'estado', a.estado, 'es_mio', a.ayudante_id = v_uid,
           'creado_en', a.creado_en) order by a.creado_en), '[]'::jsonb)
    into v_apoyos
    from public.emergencia_apoyos a
    join public.perfiles p on p.id = a.ayudante_id
   where a.emergencia_id = p_id and a.estado <> 'retirado'
     and (v_gestiona or a.ayudante_id = v_uid);
  return v_json || jsonb_build_object('apoyos', v_apoyos);
end;
$$;

create or replace function public.listar_apoyo_comunidad()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_com uuid;
  v_zona extensions.geometry;
  v_zona_nombre text;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  v_com := public.mi_comunidad_id();
  if v_com is null then
    raise exception 'Necesitas pertenecer a una comunidad para ver los recursos de apoyo' using errcode = '42501';
  end if;
  select c.zona::extensions.geometry, c.zona_nombre into v_zona, v_zona_nombre
    from public.comunidades c where c.id = v_com;
  return jsonb_build_object(
    'community_id', v_com,
    'soy_representante', public.es_admin(v_com),
    'zona', jsonb_build_object('lat', extensions.st_y(v_zona), 'lng', extensions.st_x(v_zona), 'nombre', v_zona_nombre),
    'recursos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'tipo', r.tipo, 'nombre', r.nombre, 'lugar', r.lugar, 'detalle', r.detalle,
        'lat', extensions.st_y(r.ubicacion::extensions.geometry),
        'lng', extensions.st_x(r.ubicacion::extensions.geometry),
        'disponible', r.disponible, 'es_demo', r.es_demo,
        'registrado_por', p.nombre, 'actualizado_en', r.actualizado_en)
        order by r.disponible desc, r.nombre)
      from public.recursos r left join public.perfiles p on p.id = r.creado_por
      where r.comunidad_id = v_com
    ), '[]'::jsonb),
    'grupos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'tipo', g.tipo, 'nombre', g.nombre, 'descripcion', g.descripcion,
        'activo', g.activo, 'es_demo', g.es_demo, 'registrado_por', p.nombre,
        'integrantes', (select count(*) from public.grupo_integrantes gi where gi.grupo_id = g.id),
        'soy_integrante', exists (select 1 from public.grupo_integrantes gi
                                   where gi.grupo_id = g.id and gi.usuario_id = v_uid),
        'creado_en', g.creado_en)
        order by g.activo desc, g.nombre)
      from public.grupos_apoyo g left join public.perfiles p on p.id = g.creado_por
      where g.comunidad_id = v_com
    ), '[]'::jsonb)
  );
end;
$$;

-- 8. Funciones de escritura -----------------------------------------------------
create or replace function public.crear_emergencia(
  p_categoria text,
  p_nivel text,
  p_descripcion text,
  p_lat double precision,
  p_lng double precision,
  p_ubicacion_origen text default 'zona_comunidad',
  p_es_persona_vulnerable boolean default false,
  p_client_request_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_com uuid;
  v_id uuid;
  v_categoria public.categoria_emergencia;
  v_nivel public.nivel_emergencia;
  v_desc text := btrim(coalesce(p_descripcion, ''));
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  v_com := public.mi_comunidad_id();
  if v_com is null then
    raise exception 'Necesitas pertenecer a una comunidad para reportar' using errcode = '42501';
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'La ubicación del reporte no es válida' using errcode = '22023';
  end if;
  if char_length(v_desc) < 5 or char_length(v_desc) > 500 then
    raise exception 'La descripción debe tener entre 5 y 500 caracteres' using errcode = '22023';
  end if;
  if p_ubicacion_origen not in ('dispositivo', 'zona_comunidad', 'desconocido') then
    raise exception 'El origen de la ubicación no es válido' using errcode = '22023';
  end if;
  begin
    v_categoria := p_categoria::public.categoria_emergencia;
    v_nivel := p_nivel::public.nivel_emergencia;
  exception when invalid_text_representation then
    raise exception 'La categoría o la urgencia no son válidas' using errcode = '22023';
  end;

  if p_client_request_id is not null then
    select id into v_id from public.emergencias
     where autor_id = v_uid and client_request_id = p_client_request_id;
    if found then
      return jsonb_build_object('id', v_id, 'duplicado', true);
    end if;
  end if;

  begin
    insert into public.emergencias
      (comunidad_id, autor_id, categoria, nivel, descripcion, ubicacion, ubicacion_origen,
       es_persona_vulnerable, client_request_id)
    values
      (v_com, v_uid, v_categoria, v_nivel, v_desc,
       extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
       p_ubicacion_origen, coalesce(p_es_persona_vulnerable, false), p_client_request_id)
    returning id into v_id;
  exception when unique_violation then
    select id into v_id from public.emergencias
     where autor_id = v_uid and client_request_id = p_client_request_id;
    return jsonb_build_object('id', v_id, 'duplicado', true);
  end;
  return jsonb_build_object('id', v_id, 'duplicado', false);
end;
$$;

create or replace function public.cambiar_estado_emergencia(p_id uuid, p_estado text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  e public.emergencias%rowtype;
  v_nuevo public.estado_emergencia;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  begin
    v_nuevo := p_estado::public.estado_emergencia;
  exception when invalid_text_representation then
    raise exception 'El estado no es válido' using errcode = '22023';
  end;
  select * into e from public.emergencias where id = p_id for update;
  if not found or not public.es_miembro(e.comunidad_id) then
    raise exception 'El reporte ya no está disponible' using errcode = 'P0002';
  end if;
  if e.estado <> v_nuevo then
    -- El trigger valida actor y transición.
    update public.emergencias set estado = v_nuevo where id = p_id;
  end if;
  return public.obtener_emergencia(p_id);
end;
$$;

create or replace function public.ofrecer_ayuda_emergencia(
  p_emergencia uuid,
  p_nota text default '',
  p_client_request_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_nota text := btrim(coalesce(p_nota, ''));
  e public.emergencias%rowtype;
  a public.emergencia_apoyos%rowtype;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  if char_length(v_nota) > 200 then
    raise exception 'La nota puede tener hasta 200 caracteres' using errcode = '22023';
  end if;
  select * into e from public.emergencias where id = p_emergencia for share;
  if not found or not public.es_miembro(e.comunidad_id) then
    raise exception 'El reporte ya no está disponible' using errcode = 'P0002';
  end if;
  if e.autor_id = v_uid then
    raise exception 'No puedes ofrecer ayuda en tu propio reporte' using errcode = 'P0001';
  end if;
  if e.estado = 'solucionado' then
    raise exception 'Este reporte ya está solucionado' using errcode = 'P0001';
  end if;

  select * into a from public.emergencia_apoyos
   where emergencia_id = p_emergencia and ayudante_id = v_uid for update;
  if found then
    if a.estado in ('ofrecido', 'aceptado') then
      return jsonb_build_object('id', a.id, 'estado', a.estado, 'duplicado', true);
    elsif a.estado = 'rechazado' then
      raise exception 'Tu ofrecimiento ya fue respondido' using errcode = 'P0001';
    end if;
    update public.emergencia_apoyos
       set estado = 'ofrecido', nota = v_nota, actualizado_en = now()
     where id = a.id returning * into a;
    return jsonb_build_object('id', a.id, 'estado', a.estado, 'duplicado', false);
  end if;

  insert into public.emergencia_apoyos (emergencia_id, ayudante_id, nota, client_request_id)
  values (p_emergencia, v_uid, v_nota, p_client_request_id)
  on conflict (emergencia_id, ayudante_id) do nothing
  returning * into a;
  if not found then
    select * into a from public.emergencia_apoyos
     where emergencia_id = p_emergencia and ayudante_id = v_uid;
    return jsonb_build_object('id', a.id, 'estado', a.estado, 'duplicado', true);
  end if;
  return jsonb_build_object('id', a.id, 'estado', a.estado, 'duplicado', false);
end;
$$;

create or replace function public.resolver_apoyo_emergencia(p_apoyo uuid, p_aceptar boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  a public.emergencia_apoyos%rowtype;
  e public.emergencias%rowtype;
  v_nuevo text := case when p_aceptar then 'aceptado' else 'rechazado' end;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  select * into a from public.emergencia_apoyos where id = p_apoyo for update;
  if not found then
    raise exception 'El ofrecimiento ya no está disponible' using errcode = 'P0002';
  end if;
  select * into e from public.emergencias where id = a.emergencia_id for update;
  if not public.es_miembro(e.comunidad_id) then
    raise exception 'El ofrecimiento ya no está disponible' using errcode = 'P0002';
  end if;
  if not (e.autor_id = v_uid or public.es_admin(e.comunidad_id)) then
    raise exception 'Solo el autor del reporte o el representante pueden responder a los ofrecimientos'
      using errcode = '42501';
  end if;
  if a.estado = v_nuevo then
    return public.obtener_emergencia(e.id);
  end if;
  if a.estado <> 'ofrecido' then
    raise exception 'Este ofrecimiento ya no puede cambiarse' using errcode = 'P0001';
  end if;
  if e.estado = 'solucionado' then
    raise exception 'Este reporte ya está solucionado' using errcode = 'P0001';
  end if;
  update public.emergencia_apoyos set estado = v_nuevo, actualizado_en = now() where id = a.id;
  if p_aceptar and e.estado = 'abierta' then
    update public.emergencias set estado = 'en_atencion' where id = e.id;
  end if;
  return public.obtener_emergencia(e.id);
end;
$$;

create or replace function public.retirar_apoyo_emergencia(p_apoyo uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  a public.emergencia_apoyos%rowtype;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  select * into a from public.emergencia_apoyos where id = p_apoyo for update;
  if not found or a.ayudante_id <> v_uid then
    raise exception 'El ofrecimiento ya no está disponible' using errcode = 'P0002';
  end if;
  if a.estado = 'rechazado' then
    raise exception 'Este ofrecimiento ya fue rechazado' using errcode = 'P0001';
  end if;
  if a.estado <> 'retirado' then
    update public.emergencia_apoyos set estado = 'retirado', actualizado_en = now() where id = a.id;
  end if;
  return public.obtener_emergencia(a.emergencia_id);
end;
$$;

create or replace function public.registrar_recurso_apoyo(
  p_tipo text,
  p_nombre text,
  p_lugar text,
  p_detalle text default '',
  p_lat double precision default null,
  p_lng double precision default null
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_com uuid;
  v_tipo public.tipo_recurso;
  v_nombre text := btrim(coalesce(p_nombre, ''));
  v_lugar text := btrim(coalesce(p_lugar, ''));
  v_detalle text := btrim(coalesce(p_detalle, ''));
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  v_com := public.mi_comunidad_id();
  if v_com is null or not public.es_admin(v_com) then
    raise exception 'Solo el representante puede registrar recursos' using errcode = '42501';
  end if;
  begin
    v_tipo := p_tipo::public.tipo_recurso;
  exception when invalid_text_representation then
    raise exception 'El tipo de recurso no es válido' using errcode = '22023';
  end;
  if char_length(v_nombre) < 2 or char_length(v_nombre) > 60 then
    raise exception 'El nombre debe tener entre 2 y 60 caracteres' using errcode = '22023';
  end if;
  if char_length(v_lugar) < 2 or char_length(v_lugar) > 80 then
    raise exception 'El lugar debe tener entre 2 y 80 caracteres' using errcode = '22023';
  end if;
  if char_length(v_detalle) > 120 then
    raise exception 'El detalle puede tener hasta 120 caracteres' using errcode = '22023';
  end if;
  if (p_lat is null) <> (p_lng is null)
     or (p_lat is not null and (p_lat not between -90 and 90 or p_lng not between -180 and 180)) then
    raise exception 'La ubicación del recurso no es válida' using errcode = '22023';
  end if;
  insert into public.recursos (comunidad_id, tipo, nombre, lugar, detalle, ubicacion, creado_por)
  values (v_com, v_tipo, v_nombre, v_lugar, v_detalle,
          case when p_lat is null then null
               else extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography end,
          v_uid)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.registrar_grupo_apoyo(
  p_tipo text,
  p_nombre text,
  p_descripcion text default ''
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_com uuid;
  v_tipo public.tipo_grupo;
  v_nombre text := btrim(coalesce(p_nombre, ''));
  v_desc text := btrim(coalesce(p_descripcion, ''));
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  v_com := public.mi_comunidad_id();
  if v_com is null or not public.es_admin(v_com) then
    raise exception 'Solo el representante puede registrar grupos de apoyo' using errcode = '42501';
  end if;
  begin
    v_tipo := p_tipo::public.tipo_grupo;
  exception when invalid_text_representation then
    raise exception 'El tipo de grupo no es válido' using errcode = '22023';
  end;
  if char_length(v_nombre) < 3 or char_length(v_nombre) > 60 then
    raise exception 'El nombre debe tener entre 3 y 60 caracteres' using errcode = '22023';
  end if;
  if char_length(v_desc) > 200 then
    raise exception 'La descripción puede tener hasta 200 caracteres' using errcode = '22023';
  end if;
  insert into public.grupos_apoyo (comunidad_id, tipo, nombre, descripcion, creado_por)
  values (v_com, v_tipo, v_nombre, v_desc, v_uid)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.cambiar_disponibilidad_recurso(p_id uuid, p_disponible boolean)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_com uuid;
begin
  select comunidad_id into v_com from public.recursos where id = p_id;
  if v_com is null or not public.es_admin(v_com) then
    raise exception 'Solo el representante puede cambiar la disponibilidad de un recurso'
      using errcode = '42501';
  end if;
  update public.recursos set disponible = coalesce(p_disponible, false) where id = p_id;
end;
$$;

create or replace function public.cambiar_estado_grupo_apoyo(p_id uuid, p_activo boolean)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_com uuid;
begin
  select comunidad_id into v_com from public.grupos_apoyo where id = p_id;
  if v_com is null or not public.es_admin(v_com) then
    raise exception 'Solo el representante puede activar o pausar un grupo de apoyo'
      using errcode = '42501';
  end if;
  update public.grupos_apoyo set activo = coalesce(p_activo, false) where id = p_id;
end;
$$;

create or replace function public.unirse_grupo_apoyo(p_grupo uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  g public.grupos_apoyo%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  select * into g from public.grupos_apoyo where id = p_grupo;
  if not found or not public.es_miembro(g.comunidad_id) then
    raise exception 'El grupo ya no está disponible' using errcode = 'P0002';
  end if;
  if not g.activo then
    raise exception 'Este grupo no está activo por ahora' using errcode = 'P0001';
  end if;
  insert into public.grupo_integrantes (grupo_id, usuario_id) values (p_grupo, auth.uid())
  on conflict do nothing;
end;
$$;

create or replace function public.salir_grupo_apoyo(p_grupo uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  delete from public.grupo_integrantes where grupo_id = p_grupo and usuario_id = auth.uid();
end;
$$;

-- 9. Ejecución: solo usuarios autenticados -------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = any (array[
         'mi_comunidad_id', 'es_ayudante_aceptado', 'puede_gestionar_emergencia',
         'emergencia_a_json', 'listar_emergencias', 'obtener_emergencia', 'listar_apoyo_comunidad',
         'crear_emergencia', 'cambiar_estado_emergencia', 'ofrecer_ayuda_emergencia',
         'resolver_apoyo_emergencia', 'retirar_apoyo_emergencia', 'registrar_recurso_apoyo',
         'registrar_grupo_apoyo', 'cambiar_disponibilidad_recurso', 'cambiar_estado_grupo_apoyo',
         'unirse_grupo_apoyo', 'salir_grupo_apoyo'])
  loop
    execute format('revoke all on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;
