const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.env.PROFILE_SQL_RUNTIME || '@electric-sql/pglite');

// Identidades y Auth de prueba; no conecta con Supabase remoto.
test('creación de comunidad: autorización, atomicidad y privacidad', async t => {
  const db = new PGlite();
  const A = '11111111-1111-4111-8111-111111111111';
  const B = '22222222-2222-4222-8222-222222222222';
  const C = '33333333-3333-4333-8333-333333333333';
  const D = '44444444-4444-4444-8444-444444444444';
  async function asUser(id) {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    await db.exec('set role authenticated');
  }
  async function denied(sql, values, code = '42501') {
    await assert.rejects(db.query(sql, values), error => error.code === code);
  }
  async function create(name) {
    return (await db.query('select public.create_community($1) as result', [name])).rows[0].result;
  }
  async function status() {
    return (await db.query('select public.get_my_community() as result')).rows[0].result;
  }
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      insert into auth.users values ('${A}'), ('${B}'), ('${C}'), ('${D}');
    `);
    for (const file of ['20261107230506_own_profile.sql', '20261107231438_community_creation.sql']) {
      await db.exec(fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8'));
    }
    for (const id of [A, B, D]) {
      await asUser(id);
      await db.query("insert into public.profiles(display_name) values ('Vecino de prueba')");
    }
    await db.exec('reset role');
    await db.query('insert into community_internal.representative_authorizations(user_id) values ($1),($2),($3)', [A, C, D]);
    let communityA;

    await t.test('sin identidad o autorización no se crea comunidad', async () => {
      await asUser('');
      await denied("select public.create_community('Barrio')");
      await asUser(B);
      await db.query("select set_config('request.jwt.claims', $1, false)", ['{"user_metadata":{"role":"representative"}}']);
      await denied("select public.create_community('Barrio')");
      await denied("select community_internal.create_community('Barrio')");
      const current = await status();
      assert.equal(current.can_create, false);
      assert.equal(current.has_profile, true);
      assert.equal(current.membership, null);
    });

    await t.test('el cliente no se autoriza ni modifica autorizaciones ajenas', async () => {
      await asUser(B);
      assert.equal((await db.query('select * from community_internal.representative_authorizations')).rows.length, 0);
      await denied('insert into community_internal.representative_authorizations(user_id) values ($1)', [B]);
      await denied('delete from community_internal.representative_authorizations where user_id=$1', [A]);
    });

    await t.test('ser representante no evita completar perfil o validar nombre', async () => {
      await asUser(C);
      assert.equal((await status()).has_profile, false);
      await denied("select public.create_community('Barrio')", [], '23503');
      await asUser(A);
      for (const name of [null, '', '   ', 'Comunidad\nDos', 'a'.repeat(101)]) {
        await denied('select public.create_community($1)', [name], '22023');
      }
    });

    await t.test('creación y reintento devuelven la misma comunidad con una membresía', async () => {
      await asUser(A);
      communityA = await create('  Barrio A  ');
      assert.equal(communityA.user_id, A);
      assert.equal(communityA.role, 'representative');
      assert.equal(communityA.community_name, 'Barrio A');
      const repeated = await create('Barrio A');
      assert.equal(repeated.community_id, communityA.community_id);
      assert.equal((await db.query('select * from public.memberships')).rows.length, 1);
      assert.equal((await db.query('select * from public.communities')).rows.length, 1);
      assert.equal((await status()).membership.community_id, communityA.community_id);
      await denied("select public.create_community('Otra comunidad')", [], '23505');
    });

    await t.test('terceros y representantes de otra comunidad no ven la comunidad A', async () => {
      await asUser(B);
      assert.equal((await db.query('select * from public.communities')).rows.length, 0);
      assert.equal((await db.query('select * from public.memberships')).rows.length, 0);
      await asUser(D);
      const other = await create('Barrio D');
      assert.notEqual(other.community_id, communityA.community_id);
      assert.equal((await db.query('select * from public.communities')).rows.length, 1);
      assert.equal((await db.query('select * from public.communities where id=$1', [communityA.community_id])).rows.length, 0);
      assert.equal((await db.query('select * from public.profiles where id=$1', [A])).rows.length, 0);
    });

    await t.test('ni el representante escribe directamente comunidades, membresías o roles', async () => {
      await asUser(A);
      await denied("insert into public.communities(name,created_by) values ('No permitido',$1)", [A]);
      await denied("insert into public.memberships(user_id,community_id,role) values ($1,$2,'representative')", [B, communityA.community_id]);
      await denied("update public.memberships set role='member' where user_id=$1", [A]);
      await denied("update public.communities set name='Otro' where id=$1", [communityA.community_id]);
      await denied('delete from public.memberships where user_id=$1', [A]);
    });

    await t.test('si falla la membresía se revierte también la nueva comunidad', async () => {
      await asUser(C);
      await db.query("insert into public.profiles(display_name) values ('Representante C')");
      await db.exec('reset role');
      const before = (await db.query('select count(*)::int as n from public.communities')).rows[0].n;
      // Restricción exclusiva del fixture: provoca un fallo en la segunda escritura.
      await db.exec(`alter table public.memberships add constraint test_membership_failure check (user_id <> '${C}')`);
      await asUser(C);
      await denied("select public.create_community('Se revierte')", [], '23514');
      await db.exec('reset role');
      const after = (await db.query('select count(*)::int as n from public.communities')).rows[0].n;
      assert.equal(after, before);
      await db.exec('alter table public.memberships drop constraint test_membership_failure');
    });

    await t.test('un miembro consulta su comunidad y no puede crear una segunda', async () => {
      await db.exec('reset role');
      await db.query("insert into public.memberships(user_id,community_id,role) values ($1,$2,'member')", [B, communityA.community_id]);
      await db.query('insert into community_internal.representative_authorizations(user_id) values ($1)', [B]);
      await asUser(B);
      const own = await status();
      assert.equal(own.membership.role, 'member');
      assert.equal(own.membership.community_id, communityA.community_id);
      assert.equal((await db.query('select * from public.communities')).rows.length, 1);
      await denied("select public.create_community('Barrio B')", [], '23505');
    });

    await t.test('retirar autorización impide una nueva llamada privilegiada', async () => {
      await db.exec('reset role');
      await db.query('delete from community_internal.representative_authorizations where user_id=$1', [A]);
      await asUser(A);
      assert.equal((await status()).can_create, false);
      await denied("select public.create_community('Barrio A')");
    });

    await t.test('anon no ejecuta funciones ni consulta datos', async () => {
      await db.exec('reset role; set role anon');
      await denied('select public.get_my_community()');
      await denied("select public.create_community('No permitido')");
      await denied('select * from public.communities');
      await denied('select * from public.memberships');
    });
  } finally { await db.close(); }
});
