-- Aislamiento estricto por comunidad (D18) para Servicios/Productos (G02) y Cadena de Favores (G03),
-- vinculación de fortegaquispe0@gmail.com a Vecinos Sam Fernando y enriquecimiento de datos reales.

-- 1. Función auxiliar segura para obtener la comunidad activa del usuario autenticado
CREATE OR REPLACE FUNCTION public.current_user_community_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT m.comunidad_id
  FROM public.miembros m
  WHERE m.usuario_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_community_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_community_id() TO authenticated;

-- 2. Trigger BEFORE INSERT en service_offers para asignar automáticamente la comunidad del autor
CREATE OR REPLACE FUNCTION public.service_offers_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF new.community_id IS NULL THEN
    new.community_id := public.current_user_community_id();
  END IF;

  IF new.community_id IS NULL THEN
    RAISE EXCEPTION 'Debes pertenecer a una comunidad para publicar una oferta.'
      USING ERRCODE = '42501';
  END IF;

  RETURN new;
END;
$$;

CREATE TRIGGER service_offers_before_insert
BEFORE INSERT ON public.service_offers
FOR EACH ROW EXECUTE FUNCTION public.service_offers_before_insert();

-- 3. Trigger BEFORE INSERT en favor_publications para asignar automáticamente la comunidad del autor
CREATE OR REPLACE FUNCTION public.favor_publications_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF new.community_id IS NULL THEN
    new.community_id := public.current_user_community_id();
  END IF;

  IF new.community_id IS NULL THEN
    RAISE EXCEPTION 'Debes pertenecer a una comunidad para publicar un favor.'
      USING ERRCODE = '42501';
  END IF;

  RETURN new;
END;
$$;

CREATE TRIGGER favor_publications_before_insert
BEFORE INSERT ON public.favor_publications
FOR EACH ROW EXECUTE FUNCTION public.favor_publications_before_insert();

-- 4. Actualizar políticas RLS para filtrar estrictamente por la comunidad del usuario autenticado
ALTER POLICY service_offers_select
  ON public.service_offers
  USING (
    community_id = (select public.current_user_community_id())
    AND (status = 'activa' OR author_id = (select auth.uid()))
  );

ALTER POLICY service_offers_insert
  ON public.service_offers
  WITH CHECK (
    author_id = (select auth.uid())
    AND status = 'activa'
    AND community_id = (select public.current_user_community_id())
  );

ALTER POLICY "favor_publications_select_authenticated"
  ON public.favor_publications
  USING (
    community_id = (select public.current_user_community_id())
  );

ALTER POLICY "favor_publications_insert_own"
  ON public.favor_publications
  WITH CHECK (
    (select auth.uid()) = owner_id
    AND community_id = (select public.current_user_community_id())
  );

-- 5. Incorporar la cuenta fortegaquispe0@gmail.com a la comunidad real "Vecinos Sam Fernando"
UPDATE public.perfiles
SET nombre = CASE WHEN nombre = 'Vecino' THEN 'Franco Ortega' ELSE nombre END,
    oficio = COALESCE(oficio, 'Coordinador vecinal'),
    comunidad_activa = 'ffd8c608-8d7c-42af-b434-1956612ec03c'
WHERE id = 'fe42b589-a7c7-482e-b07c-48c28a9bfea5';

INSERT INTO public.miembros (comunidad_id, usuario_id, rol)
VALUES ('ffd8c608-8d7c-42af-b434-1956612ec03c', 'fe42b589-a7c7-482e-b07c-48c28a9bfea5', 'admin')
ON CONFLICT (comunidad_id, usuario_id) DO UPDATE SET rol = 'admin';

-- 6. Mejorar la oferta existente en "Vecinos Sam Fernando" y poblar ofertas realistas para la comunidad
UPDATE public.service_offers
SET title = 'Clases de inglés práctico y escolar',
    description = 'Refuerzo escolar, conversación e inglés desde cero para niños, jóvenes y adultos de la cuadra. Horarios flexibles por la tarde.',
    contact_phone = '+51 987 654 321',
    latitude = -12.0468,
    longitude = -77.0422
WHERE id = '2c1fb653-9477-42ae-add8-88e6eed12521';

INSERT INTO public.service_offers (
  id, author_id, community_id, kind, title, description, contact_phone, latitude, longitude, status
)
VALUES
  (
    '60000000-0000-4000-8000-000000000001',
    '59d68119-166e-4e7a-96d6-539e6081d7bb',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'servicio',
    'Soporte técnico de celulares y laptops',
    'Formateo, limpieza, instalación de programas, configuración de WhatsApp para adultos mayores y revisión de Wi-Fi a domicilio.',
    '+51 991 234 567',
    -12.0459,
    -77.0431,
    'activa'
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '773ac894-a9c6-4da2-8718-2c0fbd63feb5',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'producto',
    'Postres caseros y queques de naranja',
    'Queques recién horneados sin conservantes, ideales para el lonche familiar. Pedidos por tajada o molde entero.',
    '+51 992 345 678',
    -12.0472,
    -77.0419,
    'activa'
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    'c28d2d54-728b-4379-82c7-93214330b1f1',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'servicio',
    'Gasfitería y reparaciones eléctricas de urgencia',
    'Cambio de griferías, reparación de fugas de agua, llaves térmicas y luminarias en toda la zona de Av. Casa Hacienda.',
    '+51 993 456 789',
    -12.0455,
    -77.0425,
    'activa'
  ),
  (
    '60000000-0000-4000-8000-000000000004',
    '59d68119-166e-4e7a-96d6-539e6081d7bb',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'producto',
    'Miel de abeja pura y polen natural',
    'Frascos de 500 g traídos directamente de Oxapampa. Entrega inmediata sin costo de envío dentro del sector.',
    '+51 991 234 567',
    -12.0462,
    -77.0435,
    'activa'
  )
ON CONFLICT (id) DO NOTHING;

-- Calificaciones iniciales para las ofertas de Vecinos Sam Fernando
INSERT INTO public.service_offer_ratings (offer_id, rater_id, stars)
VALUES
  ('2c1fb653-9477-42ae-add8-88e6eed12521', '59d68119-166e-4e7a-96d6-539e6081d7bb', 5),
  ('2c1fb653-9477-42ae-add8-88e6eed12521', '773ac894-a9c6-4da2-8718-2c0fbd63feb5', 5),
  ('60000000-0000-4000-8000-000000000001', 'c28d2d54-728b-4379-82c7-93214330b1f1', 5),
  ('60000000-0000-4000-8000-000000000001', '773ac894-a9c6-4da2-8718-2c0fbd63feb5', 4),
  ('60000000-0000-4000-8000-000000000002', '59d68119-166e-4e7a-96d6-539e6081d7bb', 5),
  ('60000000-0000-4000-8000-000000000003', '59d68119-166e-4e7a-96d6-539e6081d7bb', 5),
  ('60000000-0000-4000-8000-000000000004', 'c28d2d54-728b-4379-82c7-93214330b1f1', 5)
ON CONFLICT (offer_id, rater_id) DO NOTHING;

-- 7. Poblar Cadena de Favores para "Vecinos Sam Fernando"
INSERT INTO public.favor_publications (
  id, community_id, owner_id, owner_key, owner_name, kind, title, description, location, terms, symbol, color
)
VALUES
  (
    '70000000-0000-4000-8000-000000000001',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    '59d68119-166e-4e7a-96d6-539e6081d7bb',
    'carlos',
    'Fabrizio',
    'Préstamo',
    'Taladro percutor con juego de brocas',
    'Ideal para colgar cuadros, repisas o pequeños arreglos en casa. Funciona para concreto y madera.',
    '0.2 km · Av. Casa Hacienda',
    'Disponible hoy · préstamo hasta por 2 días',
    '🛠️',
    '#e5eddf'
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'c28d2d54-728b-4379-82c7-93214330b1f1',
    'luz',
    'Kirito',
    'Préstamo',
    'Escalera plegable de aluminio (5 pasos)',
    'Escalera estable y liviana para cambiar focos, limpiar ventanas altas o podar ramas bajas.',
    '0.3 km · Av. Casa Hacienda',
    'Disponible toda la semana · devolver el mismo día',
    '🪜',
    '#e4ebf4'
  ),
  (
    '70000000-0000-4000-8000-000000000003',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    '773ac894-a9c6-4da2-8718-2c0fbd63feb5',
    'luz',
    'Juan',
    'Intercambio',
    'Esquejes de menta, romero y suculentas',
    'Tengo plantitas aromáticas enraizadas listas para maceta. Las intercambio por tierra preparada, semillas o macetas pequeñas.',
    '0.4 km · Sector Sam Fernando',
    'Coordinar entrega por la tarde en el parque',
    '🪴',
    '#f2e9db'
  ),
  (
    '70000000-0000-4000-8000-000000000004',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    '59d68119-166e-4e7a-96d6-539e6081d7bb',
    'carlos',
    'Fabrizio',
    'Préstamo',
    'Inflador de pie con manómetro para bicicleta',
    'Sirve para llantas de bicicleta, pelotas y colchones inflables. Incluye adaptadores.',
    '0.2 km · Av. Casa Hacienda',
    'Disponible fines de semana y tardes',
    '🚲',
    '#e5eddf'
  ),
  (
    '70000000-0000-4000-8000-000000000005',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    '773ac894-a9c6-4da2-8718-2c0fbd63feb5',
    'luz',
    'Juan',
    'Intercambio',
    'Libros de lectura y novelas clásicas',
    'Colección de novelas y cuentos en excelente estado para intercambiar temporal o definitivamente con vecinos lectores.',
    '0.4 km · Sector Sam Fernando',
    'Coordinar por WhatsApp',
    '📚',
    '#e4ebf4'
  ),
  (
    '70000000-0000-4000-8000-000000000006',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'c28d2d54-728b-4379-82c7-93214330b1f1',
    'carlos',
    'Kirito',
    'Préstamo',
    'Extensión eléctrica reforzada de 15 metros',
    'Cable vulcanizado con triple toma a tierra para trabajos en patio, jardín o eventos comunitarios.',
    '0.3 km · Av. Casa Hacienda',
    'Disponible bajo coordinación previa',
    '🔌',
    '#f1e4e8'
  )
ON CONFLICT (id) DO NOTHING;

-- Reseñas vecinales para los favores de Vecinos Sam Fernando
INSERT INTO public.favor_reviews (
  id, publication_id, target_owner_id, target_owner_key, author_id, author_name, stars, comment
)
VALUES
  (
    '80000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    '59d68119-166e-4e7a-96d6-539e6081d7bb',
    'carlos',
    'c28d2d54-728b-4379-82c7-93214330b1f1',
    'Kirito',
    5,
    'Fabrizio me prestó el taladro con todas las brocas y pude instalar mis repisas en media hora.'
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000002',
    'c28d2d54-728b-4379-82c7-93214330b1f1',
    'luz',
    '773ac894-a9c6-4da2-8718-2c0fbd63feb5',
    'Juan',
    5,
    'La escalera está como nueva y muy segura. Coordinamos rapidísimo por WhatsApp.'
  ),
  (
    '80000000-0000-4000-8000-000000000003',
    '70000000-0000-4000-8000-000000000003',
    '773ac894-a9c6-4da2-8718-2c0fbd63feb5',
    'luz',
    '59d68119-166e-4e7a-96d6-539e6081d7bb',
    'Fabrizio',
    5,
    'Las plantitas de romero y menta prendieron súper bien en mi balcón. ¡Muchas gracias!'
  )
ON CONFLICT (id) DO NOTHING;
