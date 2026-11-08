const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.env.PROFILE_SQL_RUNTIME || '@electric-sql/pglite');

test('migración de compatibilidad: reconciliación con esquema español en PostgreSQL de pruebas', async t => {
  const db = new PGlite();
  const repId = '11111111-1111-4111-8111-111111111111';
  const neighborId = '22222222-2222-4222-8222-222222222222';

  // 1. Setup mock environment representing remote Supabase
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create schema extensions;

    -- Simular st_makepoint y st_setsrid de PostGIS
    create or replace function extensions.st_makepoint(lng double precision, lat double precision)
    returns text language sql immutable as $$ select lng || ',' || lat $$;

    create or replace function extensions.st_setsrid(pt text, srid integer)
    returns text language sql immutable as $$ select pt || ':' || srid $$;

    create table auth.users (id uuid primary key, email text);
    create or replace function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create or replace function auth.jwt() returns jsonb language sql stable as
      $$ select jsonb_build_object('sub', current_setting('request.jwt.claim.sub', true), 'email', current_setting('request.jwt.claim.email', true)) $$;
    grant usage on schema auth, extensions to anon, authenticated;
    grant execute on all functions in schema auth, extensions to anon, authenticated;

    -- Tipos enum existentes
    create type public.rol_miembro as enum ('admin', 'miembro');
    create type public.estado_invitacion as enum ('pendiente', 'aceptada', 'rechazada');

    -- Tablas existentes en español
    create table public.perfiles (
      id uuid primary key references auth.users(id) on delete cascade,
      nombre text not null check (char_length(trim(both from nombre)) >= 2 and char_length(trim(both from nombre)) <= 60),
      oficio text check (oficio is null or char_length(oficio) <= 40),
      tutorial_visto boolean not null default false,
      comunidad_activa uuid,
      creado_en timestamptz not null default now()
    );

    create table public.perfiles_privado (
      id uuid primary key references public.perfiles(id) on delete cascade,
      telefono text check (telefono is null or telefono ~ '^\\+?[0-9 ]{6,20}$')
    );

    create table public.comunidades (
      id uuid primary key default gen_random_uuid(),
      nombre text not null check (char_length(trim(both from nombre)) >= 3 and char_length(trim(both from nombre)) <= 60),
      codigo_invitacion text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
      zona text not null default 'POINT(0 0)',
      zona_nombre text check (zona_nombre is null or char_length(zona_nombre) <= 80),
      creada_por uuid not null references public.perfiles(id),
      creado_en timestamptz not null default now()
    );

    create table public.miembros (
      comunidad_id uuid not null references public.comunidades(id) on delete cascade,
      usuario_id uuid not null references public.perfiles(id) on delete cascade,
      rol public.rol_miembro not null default 'miembro',
      unido_en timestamptz not null default now(),
      primary key (comunidad_id, usuario_id)
    );

    create table public.invitaciones (
      id uuid primary key default gen_random_uuid(),
      comunidad_id uuid not null references public.comunidades(id) on delete cascade,
      correo text not null check (correo = lower(correo) and correo like '%_@_%'),
      invitado_por uuid not null references public.perfiles(id) on delete cascade,
      estado public.estado_invitacion not null default 'pendiente',
      creado_en timestamptz not null default now(),
      unique (comunidad_id, correo)
    );

    alter table public.perfiles enable row level security;
    alter table public.comunidades enable row level security;
    alter table public.miembros enable row level security;
    alter table public.invitaciones enable row level security;

    create policy "perfiles_select" on public.perfiles for select to authenticated using (id = auth.uid());
    create policy "perfiles_update" on public.perfiles for update to authenticated using (id = auth.uid());

    grant usage on schema public to anon, authenticated;
    grant all on all tables in schema public to authenticated;
  `);

  // 2. Read and apply the migration file
  const migrationSql = fs.readFileSync(path.join(__dirname, '../migrations/20261108020000_reconcile_existing_identity.sql'), 'utf8');
  // For PGlite mock, replace geography cast with text if needed
  const sanitizedMigrationSql = migrationSql.replace(/::extensions\.geography/g, '');
  await db.exec(sanitizedMigrationSql);

  async function asUser(id, email = 'user@example.com') {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    await db.query("select set_config('request.jwt.claim.email', $1, false)", [email]);
    await db.exec('set role authenticated');
  }

  // Insert initial fixtures
  await db.exec(`
    insert into auth.users (id, email) values
      ('${repId}', 'rep@vecinos.pe'),
      ('${neighborId}', 'vecino@vecinos.pe');

    insert into public.perfiles (id, nombre) values
      ('${repId}', 'Don Alberto'),
      ('${neighborId}', 'Doña Carmen');

    insert into public.representantes_autorizados (usuario_id) values ('${repId}');
  `);

  await t.test('Alberto consulta estado inicial y verifica permisos de creación', async () => {
    await asUser(repId, 'rep@vecinos.pe');
    const status = (await db.query('select public.get_my_community() as s')).rows[0].s;
    assert.equal(status.can_create, true);
    assert.equal(status.has_profile, true);
    assert.equal(status.membership, null);
  });

  await t.test('Alberto crea la comunidad y adquiere rol de representante', async () => {
    await asUser(repId, 'rep@vecinos.pe');
    const comm = (await db.query("select public.create_community('Los Álamos') as c")).rows[0].c;
    assert.equal(comm.community_name, 'Los Álamos');
    assert.equal(comm.role, 'representative');

    const status = (await db.query('select public.get_my_community() as s')).rows[0].s;
    assert.equal(status.membership.community_name, 'Los Álamos');
    assert.equal(status.membership.role, 'representative');
  });

  let neighborCode;
  await t.test('Carmen consulta su perfil mediante la vista profiles y obtiene su código personal', async () => {
    await asUser(neighborId, 'vecino@vecinos.pe');
    const prof = (await db.query(`select * from public.profiles where id = $1`, [neighborId])).rows[0];
    assert.equal(prof.display_name, 'Doña Carmen');
    assert.match(prof.personal_code, /^[0-9a-f-]{36}$/);
    neighborCode = prof.personal_code;
  });

  await t.test('Alberto busca a Carmen por código personal sin revelar datos privados', async () => {
    await asUser(repId, 'rep@vecinos.pe');
    const found = (await db.query('select public.find_neighbor($1) as n', [neighborCode])).rows[0].n;
    assert.equal(found.display_name, 'Doña Carmen');
    assert.equal(found.personal_code, neighborCode);
  });

  let invitationId;
  await t.test('Alberto envía invitación por código personal', async () => {
    await asUser(repId, 'rep@vecinos.pe');
    const sent = (await db.query('select public.send_invitation($1) as i', [neighborCode])).rows[0].i;
    assert.equal(sent.status, 'pending');
    assert.equal(sent.recipient_name, 'Doña Carmen');
    assert.equal(sent.direction, 'outgoing');
    invitationId = sent.id;
  });

  await t.test('Carmen recibe la invitación entrante y la acepta', async () => {
    await asUser(neighborId, 'vecino@vecinos.pe');
    const invs = (await db.query('select public.get_my_invitations() as invs')).rows[0].invs;
    assert.equal(invs.length, 1);
    assert.equal(invs[0].id, invitationId);
    assert.equal(invs[0].direction, 'incoming');

    const accepted = (await db.query('select public.process_invitation($1, true) as p', [invitationId])).rows[0].p;
    assert.equal(accepted.status, 'accepted');

    const status = (await db.query('select public.get_my_community() as s')).rows[0].s;
    assert.equal(status.membership.community_name, 'Los Álamos');
    assert.equal(status.membership.role, 'member');
  });

  await t.test('Lista de integrantes refleja ambos miembros', async () => {
    await asUser(neighborId, 'vecino@vecinos.pe');
    const list = (await db.query('select public.get_my_community_members() as m')).rows[0].m;
    assert.equal(list.members.length, 2);
  });

  await t.test('Carmen actualiza su nombre desde la vista profiles', async () => {
    await asUser(neighborId, 'vecino@vecinos.pe');
    await db.query("update public.profiles set display_name = 'Carmen Rosa' where id = $1", [neighborId]);
    const updated = (await db.query('select * from public.profiles where id = $1', [neighborId])).rows[0];
    assert.equal(updated.display_name, 'Carmen Rosa');
  });

  await t.test('la gestión de comunidad conserva los permisos y la consistencia del perfil', async () => {
    await db.exec('reset role');
    for (const name of ['20261108080000_join_community_by_code.sql', '20261108090000_manage_community.sql']) {
      await db.exec(fs.readFileSync(path.join(__dirname, '../migrations', name), 'utf8'));
    }

    const communityStatus = async () => (await db.query('select public.get_my_community() as status')).rows[0].status;
    const members = async () => (await db.query('select public.get_my_community_members() as list')).rows[0].list.members;
    const activeCommunity = async id => (await db.query('select comunidad_activa from public.perfiles where id = $1', [id])).rows[0].comunidad_activa;
    const denied = { code: '42501' };

    await asUser(neighborId);
    assert.ok((await members()).every(member => !('user_id' in member)));
    await assert.rejects(db.query('select public.remove_community_member($1)', [repId]), denied);
    await assert.rejects(db.query("select public.update_community_name('Cambio ajeno')"), denied);
    await db.query('select public.leave_community()');
    await db.query('select public.leave_community()');
    assert.equal((await communityStatus()).membership, null);
    assert.equal(await activeCommunity(neighborId), null);

    await asUser(repId);
    const { community_id, invite_code } = (await communityStatus()).membership;
    assert.equal((await members()).length, 1);
    await assert.rejects(db.query('select public.leave_community()'), denied);
    await assert.rejects(db.query('delete from public.miembros where usuario_id = $1', [repId]), denied);
    await assert.rejects(db.query('select public.remove_community_member($1)', [repId]), denied);
    await assert.rejects(db.query('select public.remove_community_member($1)', [neighborId]), denied);

    for (const name of [' ', 'x'.repeat(101)]) {
      await assert.rejects(db.query('select public.update_community_name($1)', [name]), { code: '22023' });
    }
    for (const name of [' A ', 'x'.repeat(100)]) {
      const result = await db.query('select public.update_community_name($1) as name', [name]);
      assert.equal(result.rows[0].name, name.trim());
      assert.equal((await communityStatus()).membership.community_name, name.trim());
    }

    await asUser(neighborId);
    await db.query('select public.join_community_by_code($1)', [invite_code]);
    assert.equal(await activeCommunity(neighborId), community_id);
    await asUser(repId);
    const roster = await members();
    assert.equal(roster.find(member => member.role === 'member').user_id, neighborId);
    assert.ok(!('user_id' in roster.find(member => member.is_current_user)));
    await db.query('select public.remove_community_member($1)', [neighborId]);
    assert.equal((await members()).length, 1);
    await asUser(neighborId);
    assert.equal((await communityStatus()).membership, null);
    assert.equal(await activeCommunity(neighborId), null);

    // Con dos representantes, solo uno puede salir dejando al otro a cargo.
    await db.exec('reset role');
    await db.query('insert into public.miembros (comunidad_id, usuario_id, rol) values ($1, $2, $3)',
      [community_id, neighborId, 'admin']);
    await db.query('insert into public.representantes_autorizados (usuario_id) values ($1)', [neighborId]);
    await asUser(repId);
    await assert.rejects(db.query('select public.remove_community_member($1)', [neighborId]), denied);
    await db.query('select public.leave_community()');
    assert.equal((await communityStatus()).membership, null);
    await asUser(neighborId);
    await assert.rejects(db.query('select public.leave_community()'), denied);

    await db.exec('reset role');
    await db.exec('set role anon');
    await assert.rejects(db.query('select public.leave_community()'), denied);
    await db.exec('reset role');
  });
  await db.close();
});
