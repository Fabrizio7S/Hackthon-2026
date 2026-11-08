-- G03: Cadena de favores (préstamos, intercambios, solicitudes y guardados)
-- Conecta el módulo de favores con Supabase manteniendo aislamiento RLS y transiciones atómicas (D25).

CREATE TABLE IF NOT EXISTS public.favor_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES public.comunidades(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  owner_key text NOT NULL DEFAULT 'vecino',
  owner_name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('Préstamo', 'Intercambio')),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 80),
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 600),
  location text NOT NULL DEFAULT 'En tu comunidad',
  terms text NOT NULL DEFAULT 'Coordinar punto de encuentro y condiciones por mensaje',
  symbol text NOT NULL DEFAULT '🤝',
  color text NOT NULL DEFAULT '#e5eddf',
  image_uri text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_favor_publications_owner_id ON public.favor_publications(owner_id);
CREATE INDEX IF NOT EXISTS idx_favor_publications_community_id ON public.favor_publications(community_id);
CREATE INDEX IF NOT EXISTS idx_favor_publications_created_at ON public.favor_publications(created_at DESC);

CREATE TABLE IF NOT EXISTS public.favor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES public.favor_publications(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  requester_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'finished', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publication_id, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_favor_requests_publication_id ON public.favor_requests(publication_id);
CREATE INDEX IF NOT EXISTS idx_favor_requests_requester_id ON public.favor_requests(requester_id);

CREATE TABLE IF NOT EXISTS public.favor_saved (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  publication_id uuid NOT NULL REFERENCES public.favor_publications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, publication_id)
);

CREATE INDEX IF NOT EXISTS idx_favor_saved_publication_id ON public.favor_saved(publication_id);

ALTER TABLE public.favor_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favor_saved ENABLE ROW LEVEL SECURITY;

-- Políticas de favor_publications
CREATE POLICY "favor_publications_select_authenticated"
  ON public.favor_publications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "favor_publications_insert_own"
  ON public.favor_publications
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "favor_publications_update_own"
  ON public.favor_publications
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

-- Políticas de favor_requests
CREATE POLICY "favor_requests_select_authenticated"
  ON public.favor_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "favor_requests_insert_own"
  ON public.favor_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = requester_id
    AND NOT EXISTS (
      SELECT 1 FROM public.favor_publications p
      WHERE p.id = publication_id AND p.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "favor_requests_update_participants"
  ON public.favor_requests
  FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = requester_id
    OR EXISTS (
      SELECT 1 FROM public.favor_publications p
      WHERE p.id = publication_id AND p.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    (select auth.uid()) = requester_id
    OR EXISTS (
      SELECT 1 FROM public.favor_publications p
      WHERE p.id = publication_id AND p.owner_id = (select auth.uid())
    )
  );

-- Políticas de favor_saved
CREATE POLICY "favor_saved_select_own"
  ON public.favor_saved
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "favor_saved_insert_own"
  ON public.favor_saved
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "favor_saved_delete_own"
  ON public.favor_saved
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- RPC atómica para aceptar una solicitud y cerrar competidoras (D25)
CREATE OR REPLACE FUNCTION public.accept_favor_request(
  p_publication_id uuid,
  p_requester_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM public.favor_publications
  WHERE id = p_publication_id
  FOR UPDATE;

  IF v_owner_id IS NULL OR v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Solo el dueño de la publicación puede aceptar solicitudes.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.favor_requests
    WHERE publication_id = p_publication_id
      AND status IN ('accepted', 'finished')
  ) THEN
    RAISE EXCEPTION 'La publicación ya está en coordinación o terminada.';
  END IF;

  UPDATE public.favor_requests
  SET status = CASE
      WHEN requester_id = p_requester_id THEN 'accepted'
      ELSE 'closed'
    END,
    updated_at = now()
  WHERE publication_id = p_publication_id
    AND status = 'pending';
END;
$$;

REVOKE ALL ON FUNCTION public.accept_favor_request(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_favor_request(uuid, uuid) TO authenticated;

-- Semilla inicial combinando favores de public.publicaciones y catálogo comunitario
INSERT INTO public.favor_publications (
  id, community_id, owner_id, owner_key, owner_name, kind, title, description, location, terms, symbol, color
)
VALUES
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000003',
    'luz',
    'Lucía Fernández',
    'Préstamo',
    'Escalera plegable de 6 pasos',
    'Escalera ligera de aluminio para tareas en casa. Te la presto por el día.',
    '0.3 km · Zona A',
    'Disponible hoy · devolver antes de las 8 p. m.',
    '🪜',
    '#e4ebf4'
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000007',
    'luz',
    'Patricia Vega',
    'Intercambio',
    'Ropa de bebé (0 a 6 meses)',
    'Bolsa con bodies, gorritos y medias en buen estado para quien la necesite o desee intercambiar.',
    '0.5 km · Zona A',
    'Coordinar entrega por la tarde',
    '👶',
    '#f1e4e8'
  ),
  (
    '40000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000004',
    'carlos',
    'Carlos Salazar',
    'Préstamo',
    'Taladro percutor',
    'Ideal para pequeños arreglos en casa. Incluye un juego de brocas.',
    '0.5 km · Zona A',
    'Disponible hoy · hasta 2 días',
    '🛠️',
    '#e5eddf'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000003',
    'luz',
    'Lucía Fernández',
    'Intercambio',
    'Esquejes de plantas',
    'Tengo esquejes de potus y menta. Los intercambio por semillas o macetas pequeñas.',
    '0.8 km · Zona B',
    'Coordinar punto de encuentro',
    '🪴',
    '#f2e9db'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000003',
    'luz',
    'Lucía Fernández',
    'Préstamo',
    'Kit de costura',
    'Presto una caja con agujas, hilos, tijeras y cinta métrica para arreglos sencillos.',
    '0.8 km · Zona B',
    'Disponible por la tarde · hasta 3 días',
    '🧵',
    '#f1e4e8'
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000004',
    'carlos',
    'Carlos Salazar',
    'Intercambio',
    'Libros infantiles',
    'Tengo cuentos ilustrados para cambiar por otros libros para niñas y niños.',
    '0.5 km · Zona A',
    'Coordinar por la tarde',
    '📚',
    '#e4ebf4'
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000004',
    'carlos',
    'Carlos Salazar',
    'Préstamo',
    'Bomba para bicicleta',
    'Bomba de pie con manómetro. Sirve para válvulas finas y gruesas.',
    '0.5 km · Zona A',
    'Disponible hoy · préstamo por un día',
    '🚲',
    '#e5eddf'
  ),
  (
    '40000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000003',
    'luz',
    'Lucía Fernández',
    'Intercambio',
    'Rompecabezas de 500 piezas',
    'Rompecabezas completo de un paisaje. Lo cambio por un juego de mesa o por otro rompecabezas.',
    '0.8 km · Zona B',
    'Coordinar durante el fin de semana',
    '🧩',
    '#f2e9db'
  )
ON CONFLICT (id) DO NOTHING;
