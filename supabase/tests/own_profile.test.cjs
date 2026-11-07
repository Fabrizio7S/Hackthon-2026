// PostgreSQL embebido de pruebas; auth.users/auth.uid son fixtures, no Supabase Auth real.
// Instalar PGlite fuera del proyecto y proporcionar PROFILE_SQL_RUNTIME (ver README).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.env.PROFILE_SQL_RUNTIME || '@electric-sql/pglite');

test('migración de perfil: permisos y RLS en PostgreSQL de pruebas', async t => {
  const db = new PGlite();
  const A = '11111111-1111-4111-8111-111111111111';
  const B = '22222222-2222-4222-8222-222222222222';
  const C = '33333333-3333-4333-8333-333333333333';
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      insert into auth.users values ('${A}'), ('${B}'), ('${C}');
    `);
    await db.exec(fs.readFileSync(path.join(__dirname, '../migrations/20261107230506_own_profile.sql'), 'utf8'));
    async function asUser(id) {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
      await db.exec('set role authenticated');
    }
    async function denied(sql, values, code = '42501') {
      await assert.rejects(db.query(sql, values), error => error.code === code);
    }
    let aCode;

    await t.test('crea identidad propia y código único en servidor', async () => {
      await asUser(A);
      const a = await db.query("insert into public.profiles(display_name) values ('Ana') returning *");
      assert.equal(a.rows[0].id, A);
      aCode = a.rows[0].personal_code;
      assert.match(aCode, /^[0-9a-f-]{36}$/);
      await asUser(B);
      const b = await db.query("insert into public.profiles(display_name) values ('Bruno') returning *");
      assert.equal(b.rows[0].id, B);
      assert.notEqual(b.rows[0].personal_code, aCode);
    });

    await t.test('repetir creación no duplica el perfil', async () => {
      await asUser(A);
      await denied("insert into public.profiles(display_name) values ('Ana')", [], '23505');
      assert.equal((await db.query('select * from public.profiles')).rows.length, 1);
    });

    await t.test('A no lee ni modifica el perfil de B', async () => {
      await asUser(A);
      assert.equal((await db.query('select * from public.profiles where id = $1', [B])).rows.length, 0);
      const update = await db.query("update public.profiles set display_name='Ajeno' where id=$1 returning id", [B]);
      assert.equal(update.rows.length, 0);
    });

    await t.test('C no consulta perfiles ajenos', async () => {
      await asUser(C);
      assert.equal((await db.query('select * from public.profiles')).rows.length, 0);
    });

    await t.test('el cliente no impone identidad ni código al crear', async () => {
      await asUser(C);
      await denied("insert into public.profiles(id,display_name) values ($1,'Tercero')", [A]);
      await denied("insert into public.profiles(display_name,personal_code) values ('Tercero',$1)", [aCode]);
    });

    await t.test('editar nombre conserva identidad y código', async () => {
      await asUser(A);
      const result = await db.query("update public.profiles set display_name='Ana María' where id=$1 returning *", [A]);
      assert.equal(result.rows[0].display_name, 'Ana María');
      assert.equal(result.rows[0].id, A);
      assert.equal(result.rows[0].personal_code, aCode);
      await denied('update public.profiles set personal_code = gen_random_uuid() where id=$1', [A]);
      await denied('update public.profiles set id=$1 where id=$2', [C, A]);
    });

    await t.test('backend rechaza nombre vacío, de varias líneas y demasiado largo', async () => {
      await asUser(A);
      for (const name of ['', '   ', 'Ana\nMaría', 'a'.repeat(101)]) {
        await denied('update public.profiles set display_name=$1 where id=$2', [name, A], '23514');
      }
    });

    await t.test('sin identidad no se crea un perfil', async () => {
      await asUser('');
      await denied("insert into public.profiles(display_name) values ('Sin sesión')", [], '42501');
    });

    await t.test('anon no lee ni escribe y authenticated no borra', async () => {
      await db.exec('reset role; set role anon');
      await denied('select * from public.profiles');
      await denied("insert into public.profiles(display_name) values ('Anónimo')");
      await asUser(A);
      await denied('delete from public.profiles where id=$1', [A]);
    });
  } finally {
    await db.close();
  }
});
