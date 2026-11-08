-- G03 Completo: Cancelación de solicitudes/coordinaciones (D25), retiro de publicación propia,
-- reseñas reales en Supabase (favor_reviews) y bucket público de imágenes (favor-images).

-- 1. Permitir eliminar publicaciones propias o actualizar solicitudes a 'closed'
CREATE POLICY "favor_publications_delete_own"
  ON public.favor_publications
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_id);

-- 2. RPC para cancelar solicitud pendiente o coordinación en curso según D25
CREATE OR REPLACE FUNCTION public.cancel_favor_request(
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
  v_status text;
  v_caller uuid := auth.uid();
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM public.favor_publications
  WHERE id = p_publication_id;

  SELECT status INTO v_status
  FROM public.favor_requests
  WHERE publication_id = p_publication_id
    AND requester_id = p_requester_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada.';
  END IF;

  -- Antes de aceptar ('pending'), solo el solicitante puede cancelar (D25)
  IF v_status = 'pending' AND v_caller <> p_requester_id THEN
    RAISE EXCEPTION 'Solo el solicitante puede cancelar una solicitud pendiente.';
  END IF;

  -- Durante la coordinación ('accepted'), puede cancelar el solicitante o el dueño (D25)
  IF v_status = 'accepted' AND v_caller <> p_requester_id AND v_caller <> v_owner_id THEN
    RAISE EXCEPTION 'Solo los participantes de la coordinación pueden cancelarla.';
  END IF;

  IF v_status NOT IN ('pending', 'accepted') THEN
    RAISE EXCEPTION 'La solicitud ya no puede cancelarse.';
  END IF;

  UPDATE public.favor_requests
  SET status = 'closed',
      updated_at = now()
  WHERE publication_id = p_publication_id
    AND requester_id = p_requester_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_favor_request(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_favor_request(uuid, uuid) TO authenticated;

-- 3. Tabla de reseñas de cadena de favores (public.favor_reviews)
CREATE TABLE IF NOT EXISTS public.favor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid REFERENCES public.favor_publications(id) ON DELETE CASCADE,
  target_owner_id uuid REFERENCES public.perfiles(id) ON DELETE CASCADE,
  target_owner_key text NOT NULL DEFAULT 'vecino',
  author_id uuid REFERENCES public.perfiles(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (char_length(btrim(comment)) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publication_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_favor_reviews_target_owner_id ON public.favor_reviews(target_owner_id);
CREATE INDEX IF NOT EXISTS idx_favor_reviews_publication_id ON public.favor_reviews(publication_id);

ALTER TABLE public.favor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favor_reviews_select_authenticated"
  ON public.favor_reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "favor_reviews_insert_own"
  ON public.favor_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = author_id
    AND (target_owner_id IS NULL OR target_owner_id <> (select auth.uid()))
  );

CREATE POLICY "favor_reviews_update_own"
  ON public.favor_reviews
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);

-- Semilla inicial de reseñas vecinales en favor_reviews
INSERT INTO public.favor_reviews (
  id, publication_id, target_owner_id, target_owner_key, author_id, author_name, stars, comment
)
VALUES
  (
    '50000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000004',
    'carlos',
    '00000000-0000-4000-8000-000000000001',
    'María Quispe',
    5,
    'Coordinamos rápido y el taladro estaba en buen estado.'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000005',
    '00000000-0000-4000-8000-000000000004',
    'carlos',
    '00000000-0000-4000-8000-000000000008',
    'Jorge Castillo',
    4,
    'El préstamo salió bien. Tuvimos que cambiar la hora de entrega.'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
    'luz',
    '00000000-0000-4000-8000-000000000006',
    'Elena Huamán',
    5,
    'Los esquejes estaban bien cuidados y Lucía me explicó cómo trasplantarlos.'
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    '40000000-0000-4000-8000-000000000006',
    '00000000-0000-4000-8000-000000000003',
    'luz',
    '00000000-0000-4000-8000-000000000002',
    'Julio Paredes',
    5,
    'El intercambio fue fácil de coordinar y cumplió lo acordado.'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Bucket público en Supabase Storage para fotos de favores
INSERT INTO storage.buckets (id, name, public)
VALUES ('favor-images', 'favor-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "favor_images_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'favor-images');

CREATE POLICY "favor_images_authenticated_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'favor-images');
