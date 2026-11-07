const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.env.PROFILE_SQL_RUNTIME || '@electric-sql/pglite');

test('invitaciones: permisos, estados, membresía y reintentos', async t => {
  const db = new PGlite();
  const A = '11111111-1111-4111-8111-111111111111';
  const B = '22222222-2222-4222-8222-222222222222';
  const C = '33333333-3333-4333-8333-333333333333';
  const D = '44444444-4444-4444-8444-444444444444';
  const missing = '99999999-9999-4999-8999-999999999999';
  const codes = {};
  async function asUser(id) {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    await db.exec('set role authenticated');
  }
  async function denied(sql, args, code = '42501') {
    await assert.rejects(db.query(sql, args), error => error.code === code);
  }
  async function rpc(name, args = []) {
    const placeholders = args.map((_, index) => `$${index + 1}`).join(',');
    return (await db.query(`select public.${name}(${placeholders}) as result`, args)).rows[0].result;
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
    for (const file of ['20261107230506_own_profile.sql', '20261107231438_community_creation.sql', '20261107232444_community_invitations.sql']) {
      await db.exec(fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8'));
    }
    for (const id of [A, B, C, D]) {
      await asUser(id);
      codes[id] = (await db.query("insert into public.profiles(display_name) values ('Vecino de prueba') returning personal_code")).rows[0].personal_code;
    }
    await db.exec('reset role');
    await db.query('insert into community_internal.representative_authorizations values ($1),($2)', [A, D]);
    await asUser(A);
    const communityA = await rpc('create_community', ['Comunidad A']);
    await asUser(D);
    const communityD = await rpc('create_community', ['Comunidad D']);
    let original, renewed, competing;

    await t.test('solo representante busca por código exacto y solo recibe nombre/código', async () => {
      await asUser(B);
      await denied('select public.find_neighbor($1)', [codes[A]]);
      await db.query("select set_config('request.jwt.claims', $1, false)", ['{"user_metadata":{"role":"representative"}}']);
      await denied('select public.find_neighbor($1)', [codes[A]]);
      await asUser(A);
      const found = await rpc('find_neighbor', [codes[B]]);
      assert.deepEqual(Object.keys(found).sort(), ['display_name', 'personal_code']);
      assert.equal(found.personal_code, codes[B]);
      assert.equal(await rpc('find_neighbor', [missing]), null);
      assert.equal((await db.query('select * from public.profiles where id=$1', [B])).rows.length, 0);
    });

    await t.test('enviar dos veces conserva una sola invitación pendiente', async () => {
      await asUser(A);
      original = await rpc('send_invitation', [codes[B]]);
      const repeated = await rpc('send_invitation', [codes[B]]);
      assert.equal(original.direction, 'outgoing');
      assert.equal(original.status, 'pending');
      assert.equal(original.community_id, communityA.community_id);
      assert.equal(repeated.id, original.id);
      assert.equal((await rpc('get_my_invitations')).length, 1);
    });

    await t.test('solo participantes ven la invitación; receptor no ve la comunidad antes de aceptar', async () => {
      await asUser(B);
      const incoming = await rpc('get_my_invitations');
      assert.equal(incoming.length, 1);
      assert.equal(incoming[0].direction, 'incoming');
      assert.equal(incoming[0].recipient_name, null);
      assert.equal(incoming[0].community_name, 'Comunidad A');
      assert.equal((await db.query('select * from public.communities')).rows.length, 0);
      await asUser(C);
      assert.equal((await rpc('get_my_invitations')).length, 0);
      await denied('select public.process_invitation($1,true)', [original.id]);
      await denied('select public.process_invitation($1,false)', [original.id]);
      await denied('select public.process_invitation($1,true)', [missing]);
      await asUser(A);
      await denied('select public.process_invitation($1,true)', [original.id]);
    });

    await t.test('rechazo es terminal e idempotente; un nuevo envío tiene otra identidad', async () => {
      await asUser(B);
      assert.equal((await rpc('process_invitation', [original.id, false])).status, 'rejected');
      assert.equal((await rpc('process_invitation', [original.id, false])).status, 'rejected');
      assert.equal((await rpc('process_invitation', [original.id, true])).status, 'rejected');
      assert.equal((await rpc('get_my_community')).membership, null);
      await asUser(A);
      renewed = await rpc('send_invitation', [codes[B]]);
      assert.notEqual(renewed.id, original.id);
      assert.equal(renewed.status, 'pending');
    });

    await t.test('aceptación incorpora como miembro y repetir no duplica ni cambia estado final', async () => {
      await asUser(D);
      competing = await rpc('send_invitation', [codes[B]]);
      await asUser(B);
      const accepted = await rpc('process_invitation', [renewed.id, true]);
      assert.equal(accepted.status, 'accepted');
      assert.equal((await rpc('process_invitation', [renewed.id, true])).status, 'accepted');
      assert.equal((await rpc('process_invitation', [renewed.id, false])).status, 'accepted');
      const status = await rpc('get_my_community');
      assert.equal(status.membership.role, 'member');
      assert.equal(status.membership.community_id, communityA.community_id);
      assert.equal((await db.query('select * from public.memberships')).rows.length, 1);
      assert.equal((await db.query('select * from public.communities')).rows[0].id, communityA.community_id);
    });

    await t.test('aceptar una segunda comunidad falla sin alterar invitación ni membresía', async () => {
      await asUser(B);
      await denied('select public.process_invitation($1,true)', [competing.id], '23505');
      assert.equal((await rpc('get_my_community')).membership.community_id, communityA.community_id);
      assert.equal((await rpc('get_my_invitations')).find(i => i.id === competing.id).status, 'pending');
      assert.equal((await rpc('process_invitation', [competing.id, false])).status, 'rejected');
      await asUser(D);
      await denied('select public.send_invitation($1)', [codes[B]], '23505');
      assert.equal((await rpc('get_my_community')).membership.community_id, communityD.community_id);
    });

    await t.test('no se invita a miembros ni a sí mismo; no se crean filas para códigos inexistentes', async () => {
      await asUser(A);
      await denied('select public.send_invitation($1)', [codes[B]], '23505');
      await denied('select public.send_invitation($1)', [codes[A]], '23505');
      await denied('select public.send_invitation($1)', [missing], 'P0002');
      assert.equal((await rpc('get_my_invitations')).length, 2);
      await asUser(C);
      await denied('select public.send_invitation($1)', [codes[D]]);
    });

    await t.test('fallo al guardar la membresía deja la invitación pendiente y permite reintentar', async () => {
      await asUser(A);
      const invitation = await rpc('send_invitation', [codes[C]]);
      await db.exec('reset role');
      await db.exec(`alter table public.memberships add constraint test_invitation_failure check(user_id <> '${C}')`);
      await asUser(C);
      await denied('select public.process_invitation($1,true)', [invitation.id], '23514');
      assert.equal((await rpc('get_my_community')).membership, null);
      assert.equal((await rpc('get_my_invitations'))[0].status, 'pending');
      await db.exec('reset role; alter table public.memberships drop constraint test_invitation_failure');
      await asUser(C);
      assert.equal((await rpc('process_invitation', [invitation.id, true])).status, 'accepted');
    });

    await t.test('no hay escritura directa de estados, destinatarios o roles ni acceso a auxiliares', async () => {
      await asUser(B);
      await denied('select * from public.community_invitations');
      await denied("update public.community_invitations set status='accepted' where id=$1", [competing.id]);
      await denied('update public.community_invitations set recipient_id=$1 where id=$2', [B, competing.id]);
      await denied('insert into public.community_invitations(community_id,sender_id,recipient_id) values($1,$2,$3)', [communityA.community_id, A, B]);
      await denied('delete from public.community_invitations where id=$1', [original.id]);
      await denied('select community_internal.invitation_json($1,$2)', [original.id, A]);
      await denied('select community_internal.representative_community()');
      await denied("update public.memberships set role='representative' where user_id=$1", [B]);
    });

    await t.test('retirar autorización bloquea búsqueda/envío y oculta la lista saliente', async () => {
      await db.exec('reset role');
      await db.query('delete from community_internal.representative_authorizations where user_id=$1', [A]);
      await asUser(A);
      await denied('select public.find_neighbor($1)', [codes[B]]);
      await denied('select public.send_invitation($1)', [codes[B]]);
      assert.equal((await rpc('get_my_invitations')).length, 0);
    });

    await t.test('anon y authenticated sin identidad no consultan ni procesan invitaciones', async () => {
      await asUser('');
      await denied('select public.get_my_invitations()');
      await denied('select public.process_invitation($1,true)', [renewed.id]);
      await db.exec('reset role; set role anon');
      await denied('select public.get_my_invitations()');
      await denied('select public.find_neighbor($1)', [codes[B]]);
      await denied('select public.send_invitation($1)', [codes[B]]);
      await denied('select public.process_invitation($1,true)', [renewed.id]);
    });
  } finally { await db.close(); }
});
