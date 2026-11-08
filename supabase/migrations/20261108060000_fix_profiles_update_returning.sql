-- Corrige el guardado del nombre de perfil.
-- La app actualiza con UPDATE ... RETURNING (supabase-js: update().select().single()).
-- La regla profiles_upd de la vista public.profiles no tenía RETURNING, así que PostgREST
-- respondía 400 (SQLSTATE 0A000: cannot perform UPDATE RETURNING on relation "profiles")
-- y la app mostraba "No pudimos completar la operación. Revisa tu conexión…".
-- Se conserva la semántica: solo se actualiza el nombre del propio usuario.
create or replace rule profiles_upd as
  on update to public.profiles
  do instead
    update public.perfiles
       set nombre = new.display_name
     where perfiles.id = old.id
       and perfiles.id = auth.uid()
    returning perfiles.id, perfiles.nombre, perfiles.codigo_personal;
