-- Pruebas de G04 (emergencias, ayuda, recursos y grupos) contra Postgres con RLS real.
--
-- Cómo ejecutarlas: pegar este archivo completo en el SQL Editor de Supabase (o con
-- execute_sql) DESPUÉS de aplicar 20261108050000_g04_emergencias.sql.
-- Es un único bloque DO: crea usuarios y comunidades ficticias, simula sesiones
-- con request.jwt.claims + SET ROLE authenticated y termina lanzando una
-- excepción con el reporte. Ese error es intencional: revierte TODO y no deja
-- datos. Si ves "REPORTE G04 ... Fallas: 0", todas las comprobaciones pasaron.
--
-- Límite conocido: una sola sesión no puede reproducir dos transacciones realmente
-- simultáneas; la exclusión mutua descansa en SELECT ... FOR UPDATE de las funciones.

do $t$
declare
  r_ uuid := 'a0000000-0000-4000-8000-000000000001'; -- representante (admin de C1)
  a_ uuid := 'a0000000-0000-4000-8000-000000000002'; -- autora de los reportes
  b_ uuid := 'a0000000-0000-4000-8000-000000000003'; -- ayudante
  x_ uuid := 'a0000000-0000-4000-8000-000000000004'; -- tercero de la misma comunidad
  o_ uuid := 'a0000000-0000-4000-8000-000000000005'; -- otra comunidad
  c1_ uuid := 'c0000000-0000-4000-8000-000000000001';
  c2_ uuid := 'c0000000-0000-4000-8000-000000000002';
  rid1 uuid := 'd0000000-0000-4000-8000-000000000001';
  rid2 uuid := 'd0000000-0000-4000-8000-000000000002';
  j jsonb;
  v text;
  e1 uuid; e2 uuid; ap1 uuid; ap2 uuid; rec uuid; grp uuid;
  n_fail int;
  report text;
begin
  create temp table t_res(id serial primary key, name text, ok boolean, detail text) on commit drop;

  execute $fn$
    create function pg_temp.chk(p_name text, p_ok boolean, p_detail text default null)
    returns void language sql as $b$
      insert into t_res(name, ok, detail) values (p_name, coalesce(p_ok, false), p_detail)
    $b$
  $fn$;

  -- Ejecuta p_sql como p_user (rol authenticated). Si p_expect es null espera éxito;
  -- si no, espera un error con ese SQLSTATE. Devuelve el texto del resultado.
  execute $fn$
    create function pg_temp.run(p_name text, p_user uuid, p_sql text, p_expect text default null)
    returns text language plpgsql as $b$
    declare v text; v_state text; v_msg text;
    begin
      perform set_config('request.jwt.claims',
        json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', p_user::text, true);
      set local role authenticated;
      begin
        execute p_sql into v;
        reset role;
        if p_expect is null then
          insert into t_res(name, ok, detail) values (p_name, true, left(v, 160));
        else
          insert into t_res(name, ok, detail)
          values (p_name, false, 'se esperaba ' || p_expect || ' y no hubo error: ' || left(coalesce(v, ''), 120));
        end if;
        return v;
      exception when others then
        get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text;
        reset role;
        insert into t_res(name, ok, detail)
        values (p_name, p_expect is not null and v_state = p_expect, v_state || ' ' || left(v_msg, 140));
        return null;
      end;
    end $b$
  $fn$;

  -- Preparación (como propietario) ------------------------------------------
  insert into auth.users(id, aud, role, email) values
    (r_, 'authenticated', 'authenticated', 'g04-r@test.local'),
    (a_, 'authenticated', 'authenticated', 'g04-a@test.local'),
    (b_, 'authenticated', 'authenticated', 'g04-b@test.local'),
    (x_, 'authenticated', 'authenticated', 'g04-x@test.local'),
    (o_, 'authenticated', 'authenticated', 'g04-o@test.local');
  insert into public.perfiles(id, nombre) values
    (r_, 'Rita Representante'), (a_, 'Ana Autora'), (b_, 'Beto Ayudante'),
    (x_, 'Xavi Tercero'), (o_, 'Omar Otra Comunidad')
  on conflict (id) do update set nombre = excluded.nombre;
  insert into public.comunidades(id, nombre, zona, creada_por) values
    (c1_, 'Comunidad G04 A', extensions.st_setsrid(extensions.st_makepoint(-77.0365, -12.0668), 4326)::extensions.geography, r_),
    (c2_, 'Comunidad G04 B', extensions.st_setsrid(extensions.st_makepoint(-77.0365, -12.0668), 4326)::extensions.geography, o_);
  insert into public.miembros(comunidad_id, usuario_id, rol) values
    (c1_, r_, 'admin'), (c1_, a_, 'miembro'), (c1_, b_, 'miembro'), (c1_, x_, 'miembro'), (c2_, o_, 'admin');

  -- 1. Reportar ---------------------------------------------------------------
  j := pg_temp.run('A crea un reporte', a_, format(
    $q$select public.crear_emergencia('agua','critica','Rotura de tubería en la cuadra 3',-12.0668,-77.0365,'dispositivo',false,%L)$q$, rid1))::jsonb;
  e1 := (j ->> 'id')::uuid;
  perform pg_temp.chk('El primer envío no es duplicado', (j ->> 'duplicado')::boolean = false, j::text);

  j := pg_temp.run('Reintento con el mismo identificador', a_, format(
    $q$select public.crear_emergencia('agua','critica','Rotura de tubería en la cuadra 3',-12.0668,-77.0365,'dispositivo',false,%L)$q$, rid1))::jsonb;
  perform pg_temp.chk('El reintento devuelve el mismo reporte y no duplica',
    (j ->> 'duplicado')::boolean and (j ->> 'id')::uuid = e1
    and (select count(*) from public.emergencias where autor_id = a_ and client_request_id = rid1) = 1, j::text);

  perform pg_temp.run('Descripción demasiado corta se rechaza', a_,
    $q$select public.crear_emergencia('agua','media','hi',-12.06,-77.03,'dispositivo',false,null)$q$, '22023');
  perform pg_temp.run('Categoría inválida se rechaza', a_,
    $q$select public.crear_emergencia('volcan','media','Descripción válida',-12.06,-77.03,'dispositivo',false,null)$q$, '22023');
  perform pg_temp.run('Coordenadas inválidas se rechazan', a_,
    $q$select public.crear_emergencia('agua','media','Descripción válida',120,-77.03,'dispositivo',false,null)$q$, '22023');
  perform pg_temp.run('Un usuario sin comunidad no puede reportar', (select gen_random_uuid()),
    $q$select public.crear_emergencia('agua','media','Descripción válida',-12.06,-77.03,'dispositivo',false,null)$q$, '42501');
  perform pg_temp.run('INSERT directo en emergencias está denegado', a_,
    $q$with i as (insert into public.emergencias(comunidad_id, autor_id, categoria, nivel, descripcion, ubicacion)
        values ('c0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','agua','media','prueba directa',
                extensions.st_setsrid(extensions.st_makepoint(-77,-12),4326)::extensions.geography) returning 1)
      select count(*)::text from i$q$, '42501');
  perform pg_temp.chk('El cliente no puede marcar un reporte como demo',
    (select es_demo from public.emergencias where id = e1) = false);

  -- 2. Consulta y aislamiento entre comunidades -------------------------------
  j := pg_temp.run('X lista las emergencias de su comunidad', x_, 'select public.listar_emergencias()')::jsonb;
  perform pg_temp.chk('X ve el reporte de A', jsonb_array_length(j -> 'items') = 1 and (j -> 'items' -> 0 ->> 'id')::uuid = e1, j::text);
  perform pg_temp.chk('X no es representante', (j ->> 'soy_representante')::boolean = false);
  j := pg_temp.run('R lista las emergencias', r_, 'select public.listar_emergencias()')::jsonb;
  perform pg_temp.chk('R es representante', (j ->> 'soy_representante')::boolean = true);
  j := pg_temp.run('O (otra comunidad) lista las suyas', o_, 'select public.listar_emergencias()')::jsonb;
  perform pg_temp.chk('O no ve reportes de otra comunidad', jsonb_array_length(j -> 'items') = 0, j::text);
  perform pg_temp.run('O no puede abrir el reporte de otra comunidad', o_,
    format('select public.obtener_emergencia(%L)', e1), 'P0002');
  perform pg_temp.run('SELECT directo de O no devuelve filas ajenas', o_,
    format('select (count(*) = 0)::text from public.emergencias where id = %L', e1));
  v := pg_temp.run('Conteo directo de O', o_, format('select count(*)::text from public.emergencias where id = %L', e1));
  perform pg_temp.chk('RLS oculta el reporte a O', v = '0', v);

  -- 3. Cambios de estado: solo autor o representante --------------------------
  perform pg_temp.run('UPDATE directo de estado está denegado', a_,
    format($q$with u as (update public.emergencias set estado = 'solucionado' where id = %L returning 1) select count(*)::text from u$q$, e1), '42501');
  perform pg_temp.run('X (tercero) no puede atender', x_,
    format($q$select public.cambiar_estado_emergencia(%L,'en_atencion')$q$, e1), '42501');
  perform pg_temp.run('X (tercero) no puede cerrar', x_,
    format($q$select public.cambiar_estado_emergencia(%L,'solucionado')$q$, e1), '42501');
  perform pg_temp.run('Estado inexistente se rechaza', a_,
    format($q$select public.cambiar_estado_emergencia(%L,'cerrado')$q$, e1), '22023');

  -- 4. Ayuda: ofrecer, aceptar ----------------------------------------------
  j := pg_temp.run('B ofrece ayuda', b_, format($q$select public.ofrecer_ayuda_emergencia(%L,'Tengo bidones',null)$q$, e1))::jsonb;
  ap1 := (j ->> 'id')::uuid;
  j := pg_temp.run('B repite el ofrecimiento', b_, format($q$select public.ofrecer_ayuda_emergencia(%L,'Tengo bidones',null)$q$, e1))::jsonb;
  perform pg_temp.chk('El ofrecimiento repetido no duplica', (j ->> 'duplicado')::boolean and (j ->> 'id')::uuid = ap1
    and (select count(*) from public.emergencia_apoyos where emergencia_id = e1 and ayudante_id = b_) = 1, j::text);
  perform pg_temp.run('A no puede ofrecer ayuda en su propio reporte', a_,
    format($q$select public.ofrecer_ayuda_emergencia(%L,'',null)$q$, e1), 'P0001');
  perform pg_temp.run('Nota demasiado larga se rechaza', x_,
    format($q$select public.ofrecer_ayuda_emergencia(%L,%L,null)$q$, e1, repeat('x', 201)), '22023');
  perform pg_temp.run('B no puede aceptar su propio ofrecimiento', b_,
    format('select public.resolver_apoyo_emergencia(%L,true)', ap1), '42501');
  perform pg_temp.run('X no puede aceptar el ofrecimiento de B', x_,
    format('select public.resolver_apoyo_emergencia(%L,true)', ap1), '42501');
  j := pg_temp.run('X consulta el detalle', x_, format('select public.obtener_emergencia(%L)', e1))::jsonb;
  perform pg_temp.chk('X no ve los ofrecimientos de otros', jsonb_array_length(j -> 'apoyos') = 0 and (j ->> 'apoyos_ofrecidos')::int = 1, j::text);
  j := pg_temp.run('A acepta el ofrecimiento de B', a_, format('select public.resolver_apoyo_emergencia(%L,true)', ap1))::jsonb;
  perform pg_temp.chk('El reporte pasa a en_atencion y registra la fecha',
    j ->> 'estado' = 'en_atencion' and j ->> 'atendido_en' is not null and (j ->> 'apoyos_aceptados')::int = 1, j::text);
  j := pg_temp.run('A repite la aceptación', a_, format('select public.resolver_apoyo_emergencia(%L,true)', ap1))::jsonb;
  perform pg_temp.chk('Aceptar de nuevo no cambia nada', j ->> 'estado' = 'en_atencion' and (j ->> 'apoyos_aceptados')::int = 1, j::text);
  perform pg_temp.run('Un ofrecimiento aceptado no puede rechazarse después', a_,
    format('select public.resolver_apoyo_emergencia(%L,false)', ap1), 'P0001');
  j := pg_temp.run('A ve el ofrecimiento con nombre y nota', a_, format('select public.obtener_emergencia(%L)', e1))::jsonb;
  perform pg_temp.chk('El autor ve el ayudante aceptado',
    j -> 'apoyos' -> 0 ->> 'ayudante_nombre' = 'Beto Ayudante' and j -> 'apoyos' -> 0 ->> 'estado' = 'aceptado', j::text);

  -- 5. Cierre ---------------------------------------------------------------
  perform pg_temp.run('X no puede cerrar un reporte en atención', x_,
    format($q$select public.cambiar_estado_emergencia(%L,'solucionado')$q$, e1), '42501');
  j := pg_temp.run('R (representante) cierra el reporte', r_,
    format($q$select public.cambiar_estado_emergencia(%L,'solucionado')$q$, e1))::jsonb;
  perform pg_temp.chk('Queda solucionado con fecha de cierre', j ->> 'estado' = 'solucionado' and j ->> 'cerrado_en' is not null, j::text);
  perform pg_temp.chk('Se registra quién cerró', (select cerrado_por from public.emergencias where id = e1) = r_);
  perform pg_temp.run('Un reporte solucionado no se reabre', a_,
    format($q$select public.cambiar_estado_emergencia(%L,'abierta')$q$, e1), 'P0001');
  perform pg_temp.run('No se ofrece ayuda en un reporte solucionado', x_,
    format($q$select public.ofrecer_ayuda_emergencia(%L,'',null)$q$, e1), 'P0001');
  v := pg_temp.run('Vista de B tras el cierre', b_, format('select (public.obtener_emergencia(%L) ->> %L)', e1, 'estado'));
  perform pg_temp.chk('Todos ven el mismo estado final', v = 'solucionado', v);

  -- 6. Personas vulnerables (D29) ----------------------------------------------
  j := pg_temp.run('A reporta una persona vulnerable', a_, format(
    $q$select public.crear_emergencia('salud','alta','Vecina adulta mayor sola con fiebre alta',-12.0668,-77.0365,'dispositivo',true,%L)$q$, rid2))::jsonb;
  e2 := (j ->> 'id')::uuid;
  j := pg_temp.run('X consulta el reporte vulnerable', x_, format('select public.obtener_emergencia(%L)', e2))::jsonb;
  perform pg_temp.chk('X no ve descripción ni autor',
    (j ->> 'detalle_restringido')::boolean and j -> 'descripcion' = 'null'::jsonb and j -> 'autor_nombre' = 'null'::jsonb, j::text);
  perform pg_temp.chk('X ve la ubicación solo aproximada (~1 km)',
    abs((j ->> 'lat')::float8 - (-12.07)) < 0.0000001 and (j ->> 'ubicacion_aproximada')::boolean, j::text);
  perform pg_temp.chk('X sí ve categoría, urgencia y estado', j ->> 'categoria' = 'salud' and j ->> 'nivel' = 'alta' and j ->> 'estado' = 'abierta');
  v := pg_temp.run('SELECT directo de X sobre el reporte vulnerable', x_, format('select count(*)::text from public.emergencias where id = %L', e2));
  perform pg_temp.chk('RLS oculta el detalle a X', v = '0', v);
  v := pg_temp.run('SELECT directo de O', o_, format('select count(*)::text from public.emergencias where id = %L', e2));
  perform pg_temp.chk('RLS oculta el reporte vulnerable a otra comunidad', v = '0', v);
  v := pg_temp.run('SELECT directo de A (autora)', a_, format('select count(*)::text from public.emergencias where id = %L', e2));
  perform pg_temp.chk('La autora lo ve', v = '1', v);
  j := pg_temp.run('R consulta el reporte vulnerable', r_, format('select public.obtener_emergencia(%L)', e2))::jsonb;
  perform pg_temp.chk('El representante ve el detalle completo',
    not (j ->> 'detalle_restringido')::boolean and j ->> 'descripcion' like 'Vecina adulta%' and abs((j ->> 'lat')::float8 - (-12.0668)) < 0.0011, j::text);
  j := pg_temp.run('B ofrece ayuda en el reporte vulnerable', b_, format($q$select public.ofrecer_ayuda_emergencia(%L,'Soy enfermero',null)$q$, e2))::jsonb;
  ap2 := (j ->> 'id')::uuid;
  j := pg_temp.run('B sigue sin ver el detalle antes de ser aceptado', b_, format('select public.obtener_emergencia(%L)', e2))::jsonb;
  perform pg_temp.chk('Ofrecer ayuda no revela el detalle', (j ->> 'detalle_restringido')::boolean, j::text);
  perform pg_temp.run('A acepta a B', a_, format('select public.resolver_apoyo_emergencia(%L,true)', ap2));
  j := pg_temp.run('B ve el detalle una vez aceptado', b_, format('select public.obtener_emergencia(%L)', e2))::jsonb;
  perform pg_temp.chk('El ayudante aceptado ve el detalle', not (j ->> 'detalle_restringido')::boolean and j ->> 'descripcion' like 'Vecina adulta%', j::text);
  j := pg_temp.run('B retira su ayuda', b_, format('select public.retirar_apoyo_emergencia(%L)', ap2))::jsonb;
  perform pg_temp.chk('Al retirar la ayuda B pierde el acceso al detalle', (j ->> 'detalle_restringido')::boolean, j::text);
  perform pg_temp.run('A rechaza a un ayudante que ya retiró su oferta', a_, format('select public.resolver_apoyo_emergencia(%L,false)', ap2), 'P0001');
  j := pg_temp.run('B vuelve a ofrecer tras retirar', b_, format($q$select public.ofrecer_ayuda_emergencia(%L,'Sigo disponible',null)$q$, e2))::jsonb;
  perform pg_temp.chk('Se reactiva el mismo ofrecimiento', (j ->> 'id')::uuid = ap2 and j ->> 'estado' = 'ofrecido', j::text);

  -- 7. Recursos críticos (solo el representante) ------------------------------
  perform pg_temp.run('A (vecina) no puede registrar recursos', a_,
    $q$select public.registrar_recurso_apoyo('agua','Bidones','Parroquia','',null,null)::text$q$, '42501');
  perform pg_temp.run('INSERT directo de recurso por A está denegado', a_,
    $q$with i as (insert into public.recursos(comunidad_id, tipo, nombre, lugar, creado_por)
        values ('c0000000-0000-4000-8000-000000000001','agua','Directo','Calle','a0000000-0000-4000-8000-000000000002') returning 1)
      select count(*)::text from i$q$, '42501');
  perform pg_temp.run('Tipo de recurso inválido', r_,
    $q$select public.registrar_recurso_apoyo('cohete','Bidones','Parroquia','',null,null)::text$q$, '22023');
  rec := pg_temp.run('R registra un recurso', r_,
    $q$select public.registrar_recurso_apoyo('botiquin','Botiquín comunal','Local vecinal','Con gasas y alcohol',-12.0668,-77.0365)::text$q$)::uuid;
  perform pg_temp.run('A no puede cambiar la disponibilidad', a_,
    format('select public.cambiar_disponibilidad_recurso(%L,false)::text', rec), '42501');
  v := pg_temp.run('UPDATE directo de X sobre el recurso', x_,
    format($q$with u as (update public.recursos set disponible = false where id = %L returning 1) select count(*)::text from u$q$, rec));
  perform pg_temp.chk('RLS impide que X modifique el recurso (0 filas)', v = '0', v);
  perform pg_temp.run('R marca el recurso como no disponible', r_,
    format('select public.cambiar_disponibilidad_recurso(%L,false)::text', rec));
  j := pg_temp.run('X lista el apoyo de la comunidad', x_, 'select public.listar_apoyo_comunidad()')::jsonb;
  perform pg_temp.chk('X ve el recurso con su fuente y disponibilidad',
    j -> 'recursos' -> 0 ->> 'registrado_por' = 'Rita Representante' and (j -> 'recursos' -> 0 ->> 'disponible')::boolean = false
    and (j -> 'recursos' -> 0 ->> 'es_demo')::boolean = false, j::text);
  j := pg_temp.run('O no ve recursos de otra comunidad', o_, 'select public.listar_apoyo_comunidad()')::jsonb;
  perform pg_temp.chk('Aislamiento de recursos', jsonb_array_length(j -> 'recursos') = 0, j::text);

  -- 8. Grupos de apoyo -------------------------------------------------------
  perform pg_temp.run('A no puede registrar grupos', a_,
    $q$select public.registrar_grupo_apoyo('brigada','Brigada nueva','')::text$q$, '42501');
  grp := pg_temp.run('R registra un grupo', r_,
    $q$select public.registrar_grupo_apoyo('olla_comun','Olla común G04','Almuerzo sábados')::text$q$)::uuid;
  perform pg_temp.run('B se une al grupo', b_, format('select public.unirse_grupo_apoyo(%L)::text', grp));
  perform pg_temp.run('B repite unirse (idempotente)', b_, format('select public.unirse_grupo_apoyo(%L)::text', grp));
  j := pg_temp.run('B lista el apoyo', b_, 'select public.listar_apoyo_comunidad()')::jsonb;
  perform pg_temp.chk('El grupo cuenta un integrante y B está dentro',
    (j -> 'grupos' -> 0 ->> 'integrantes')::int = 1 and (j -> 'grupos' -> 0 ->> 'soy_integrante')::boolean, j::text);
  perform pg_temp.run('O no puede unirse a un grupo ajeno', o_, format('select public.unirse_grupo_apoyo(%L)::text', grp), 'P0002');
  perform pg_temp.run('A no puede pausar el grupo', a_, format('select public.cambiar_estado_grupo_apoyo(%L,false)::text', grp), '42501');
  perform pg_temp.run('R pausa el grupo', r_, format('select public.cambiar_estado_grupo_apoyo(%L,false)::text', grp));
  perform pg_temp.run('X no puede unirse a un grupo pausado', x_, format('select public.unirse_grupo_apoyo(%L)::text', grp), 'P0001');
  perform pg_temp.run('B sale del grupo', b_, format('select public.salir_grupo_apoyo(%L)::text', grp));
  v := (select count(*)::text from public.grupo_integrantes where grupo_id = grp);
  perform pg_temp.chk('El grupo queda sin integrantes', v = '0', v);

  -- Reporte -------------------------------------------------------------------
  select count(*) filter (where not ok) into n_fail from t_res;
  select string_agg(format('%s %s%s', case when ok then 'OK    ' else 'FALLA ' end, name,
                           case when ok then '' else ' — ' || coalesce(detail, '') end), E'\n' order by id)
    into report from t_res;
  raise exception E'REPORTE G04 (error intencional: revierte todo)\n%\nPruebas: %  Fallas: %',
    report, (select count(*) from t_res), n_fail using errcode = 'P0001';
end
$t$;
