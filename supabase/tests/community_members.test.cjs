const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.env.PROFILE_SQL_RUNTIME || '@electric-sql/pglite');

test('integrantes: composición compartida y privacidad', async t => {
  const db = new PGlite();
  const A = '11111111-1111-4111-8111-111111111111';
  const B = '22222222-2222-4222-8222-222222222222';
  const C = '33333333-3333-4333-8333-333333333333';
  const D = '44444444-4444-4444-8444-444444444444';
  const codes = {};
  async function asUser(id) {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    await db.exec('set role authenticated');
  }
  async function rpc(name, args = []) {
    const placeholders = args.map((_, index) => `$${index + 1}`).join(',');
    return (await db.query(`select public.${name}(${placeholders}) as result`, args)).rows[0].result;
  }
  async function denied(sql, args, code = '42501') {
    await assert.rejects(db.query(sql, args), error => error.code === code);
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
    for (const file of ['20261107230506_own_profile.sql', '20261107231438_community_creation.sql',
      '20261107232444_community_invitations.sql', '20261107233955_community_members.sql']) {
      await db.exec(fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8'));
    }
    for (const [id, name] of [[A, 'Ana'], [B, 'Bruno'], [C, 'Carla'], [D, 'Diego']]) {
      await asUser(id);
      codes[id] = (await db.query('insert into public.profiles(display_name) values ($1) returning personal_code', [name])).rows[0].personal_code;
    }
    await db.exec('reset role');
    await db.query('insert into community_internal.representative_authorizations values ($1),($2)', [A, D]);
    await asUser(A);
    const communityA = await rpc('create_community', ['Comunidad A']);
    const invitation = await rpc('send_invitation', [codes[B]]);
    await asUser(D);
    const communityD = await rpc('create_community', ['Comunidad D']);

    await t.test('sin pertenencia o con invitación pendiente no se consulta una lista', async () => {
      for (const id of [B, C]) {
        await asUser(id);
        await denied('select public.get_my_community_members()');
      }
    });

    await t.test('antes de aceptar solo aparece la representante', async () => {
      await asUser(A);
      const list = await rpc('get_my_community_members');
      assert.equal(list.community_id, communityA.community_id);
      assert.deepEqual(list.members, [{ display_name: 'Ana', role: 'representative', is_current_user: true }]);
    });

    await t.test('tras aceptación ambos participantes leen la misma composición sin duplicados', async () => {
      await asUser(B);
      await rpc('process_invitation', [invitation.id, true]);
      await rpc('process_invitation', [invitation.id, true]);
      const b = await rpc('get_my_community_members');
      await asUser(A);
      const a = await rpc('get_my_community_members');
      assert.equal(a.community_id, b.community_id);
      const composition = list => list.members.map(({ display_name, role }) => ({ display_name, role }));
      assert.deepEqual(composition(a), composition(b));
      assert.deepEqual(composition(a), [
        { display_name: 'Ana', role: 'representative' }, { display_name: 'Bruno', role: 'member' },
      ]);
      assert.equal(a.members.find(m => m.is_current_user).display_name, 'Ana');
      assert.equal(b.members.find(m => m.is_current_user).display_name, 'Bruno');
    });

    await t.test('la proyección no incluye ids de cuentas, correos, códigos ni ubicación', async () => {
      await asUser(B);
      const list = await rpc('get_my_community_members');
      assert.deepEqual(Object.keys(list).sort(), ['community_id', 'members']);
      for (const member of list.members) {
        assert.deepEqual(Object.keys(member).sort(), ['display_name', 'is_current_user', 'role']);
      }
    });

    await t.test('otra comunidad solo ve sus propios integrantes y no puede escoger una comunidad ajena', async () => {
      await asUser(D);
      const list = await rpc('get_my_community_members');
      assert.equal(list.community_id, communityD.community_id);
      assert.deepEqual(list.members.map(m => m.display_name), ['Diego']);
      await denied('select public.get_my_community_members($1::uuid)', [communityA.community_id], '42883');
      await asUser(C);
      await denied('select community_internal.get_my_community_members()');
    });

    await t.test('la lista no amplía SELECT a perfiles o filas de membresía ajenos', async () => {
      await asUser(B);
      assert.equal((await db.query('select * from public.profiles where id=$1', [A])).rows.length, 0);
      assert.equal((await db.query('select * from public.memberships where user_id=$1', [A])).rows.length, 0);
      await denied("update public.memberships set role='representative' where user_id=$1", [B]);
    });

    await t.test('consultar nuevamente refleja nombres confirmados en backend', async () => {
      await asUser(B);
      await db.query("update public.profiles set display_name='Bruno Actualizado' where id=$1", [B]);
      await asUser(A);
      assert.equal((await rpc('get_my_community_members')).members[1].display_name, 'Bruno Actualizado');
    });

    await t.test('cierre/cambio de identidad y anon no conservan acceso', async () => {
      await asUser('');
      await denied('select public.get_my_community_members()');
      await asUser(C);
      await denied('select public.get_my_community_members()');
      await db.exec('reset role; set role anon');
      await denied('select public.get_my_community_members()');
      await denied('select community_internal.get_my_community_members()');
    });
  } finally { await db.close(); }
});
