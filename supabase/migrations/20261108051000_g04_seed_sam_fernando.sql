-- G04: Datos iniciales de emergencias, ofrecimientos de ayuda, recursos críticos y
-- grupos de apoyo para la comunidad real Vecinos Sam Fernando (ffd8c608-8d7c-42af-b434-1956612ec03c).

UPDATE public.emergencias
SET descripcion = 'Corte de alumbrado público en el pasaje central; ya fue restablecido tras revisar la caja general.',
    atendido_en = creado_en + interval '25 minutes',
    cerrado_en = creado_en + interval '90 minutes',
    cerrado_por = '59d68119-166e-4e7a-96d6-539e6081d7bb'
WHERE id = 'ca288549-2e2b-4d78-ac8b-b81c6a57482e'
  AND coalesce(descripcion, '') = '';

INSERT INTO public.emergencias (
  id, comunidad_id, autor_id, categoria, nivel, descripcion, ubicacion,
  estado, es_persona_vulnerable, ubicacion_origen, es_demo, creado_en, atendido_en
) VALUES
  (
    'e4040001-0000-4000-8000-000000000001',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'c28d2d54-728b-4379-82c7-93214330b1f1',
    'agua',
    'critica',
    'Ruptura de tubería matriz en la esquina del parque San Fernando; el agua está entrando a las viviendas de la primera cuadra.',
    extensions.st_setsrid(extensions.st_makepoint(-76.8516, -12.2207), 4326)::extensions.geography,
    'abierta',
    false,
    'dispositivo',
    false,
    now() - interval '35 minutes',
    null
  ),
  (
    'e4040001-0000-4000-8000-000000000002',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    '773ac894-a9c6-4da2-8718-2c0fbd63feb5',
    'salud',
    'alta',
    'Adulto mayor en el bloque B necesita control urgente de presión arterial y acompañamiento preventivo al centro de salud.',
    extensions.st_setsrid(extensions.st_makepoint(-76.8524, -12.2213), 4326)::extensions.geography,
    'en_atencion',
    true,
    'dispositivo',
    false,
    now() - interval '2 hours',
    now() - interval '95 minutes'
  ),
  (
    'e4040001-0000-4000-8000-000000000003',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'fe42b589-a7c7-482e-b07c-48c28a9bfea5',
    'vivienda',
    'media',
    'Cable de poste caído sobre la vereda frente al lote 14; se requiere acordonar el paso peatonal mientras llega la cuadrilla.',
    extensions.st_setsrid(extensions.st_makepoint(-76.8519, -12.2215), 4326)::extensions.geography,
    'abierta',
    false,
    'zona_comunidad',
    false,
    now() - interval '15 minutes',
    null
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.emergencia_apoyos (
  id, emergencia_id, ayudante_id, nota, estado, creado_en, actualizado_en
) VALUES
  (
    'e4040002-0000-4000-8000-000000000001',
    'e4040001-0000-4000-8000-000000000001',
    'fe42b589-a7c7-482e-b07c-48c28a9bfea5',
    'Llevo llave maestra para cerrar la válvula general de la cuadra y sacos de contención.',
    'ofrecido',
    now() - interval '20 minutes',
    now() - interval '20 minutes'
  ),
  (
    'e4040002-0000-4000-8000-000000000002',
    'e4040001-0000-4000-8000-000000000002',
    '59d68119-166e-4e7a-96d6-539e6081d7bb',
    'Voy con tensiómetro digital y botiquín de primeros auxilios en 5 minutos.',
    'aceptado',
    now() - interval '100 minutes',
    now() - interval '95 minutes'
  ),
  (
    'e4040002-0000-4000-8000-000000000003',
    'e4040001-0000-4000-8000-000000000003',
    'c28d2d54-728b-4379-82c7-93214330b1f1',
    'Tengo conos reflectivos y cinta de peligro para señalizar la vereda.',
    'ofrecido',
    now() - interval '8 minutes',
    now() - interval '8 minutes'
  )
ON CONFLICT (emergencia_id, ayudante_id) DO NOTHING;

INSERT INTO public.recursos (
  id, comunidad_id, tipo, nombre, lugar, detalle, ubicacion, disponible, creado_por, es_demo
) VALUES
  (
    'e4040003-0000-4000-8000-000000000001',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'botiquin',
    'Botiquín Comunitario Principal',
    'Local Comunal San Fernando (Puerta 1)',
    'Incluye tensiómetro digital, oxímetro, gasas estériles, vendas y solución salina.',
    extensions.st_setsrid(extensions.st_makepoint(-76.8520, -12.2210), 4326)::extensions.geography,
    true,
    'fe42b589-a7c7-482e-b07c-48c28a9bfea5',
    false
  ),
  (
    'e4040003-0000-4000-8000-000000000002',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'zona_segura',
    'Punto de Encuentro Sísmico',
    'Losa Deportiva Central San Fernando',
    'Zona despejada de cables con iluminación solar de emergencia y megáfono.',
    extensions.st_setsrid(extensions.st_makepoint(-76.8515, -12.2208), 4326)::extensions.geography,
    true,
    'fe42b589-a7c7-482e-b07c-48c28a9bfea5',
    false
  ),
  (
    'e4040003-0000-4000-8000-000000000003',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'agua',
    'Cisterna de Reserva Vecinal',
    'Esquina Jr. Los Cipreses con Pasaje 2',
    'Tanque de 2,500 L de agua tratada para emergencias de corte prolongado.',
    extensions.st_setsrid(extensions.st_makepoint(-76.8525, -12.2212), 4326)::extensions.geography,
    true,
    '59d68119-166e-4e7a-96d6-539e6081d7bb',
    false
  ),
  (
    'e4040003-0000-4000-8000-000000000004',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'extintor',
    'Estación de Extintores PQS 12 kg',
    'Caseta de vigilancia ingreso norte',
    'Dos extintores multipropósito ABC recargados y llave maestra de gas y agua.',
    extensions.st_setsrid(extensions.st_makepoint(-76.8518, -12.2205), 4326)::extensions.geography,
    true,
    'fe42b589-a7c7-482e-b07c-48c28a9bfea5',
    false
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.grupos_apoyo (
  id, comunidad_id, tipo, nombre, descripcion, creado_por, activo, es_demo
) VALUES
  (
    'e4040004-0000-4000-8000-000000000001',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'brigada',
    'Brigada de Primera Respuesta y Evacuación',
    'Vecinos capacitados en primeros auxilios, corte de suministros y apoyo a personas vulnerables durante sismos o incendios.',
    'fe42b589-a7c7-482e-b07c-48c28a9bfea5',
    true,
    false
  ),
  (
    'e4040004-0000-4000-8000-000000000002',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'olla_comun',
    'Comedor Solidario San Fernando',
    'Organización de alimentación de emergencia y reparto de agua para familias afectadas o adultos mayores.',
    '59d68119-166e-4e7a-96d6-539e6081d7bb',
    true,
    false
  ),
  (
    'e4040004-0000-4000-8000-000000000003',
    'ffd8c608-8d7c-42af-b434-1956612ec03c',
    'oficios',
    'Red Técnica de Electricistas y Gasfiteros',
    'Vecinos con herramientas para atender fugas de agua, cortocircuitos y aseguramiento de techos o puertas.',
    'fe42b589-a7c7-482e-b07c-48c28a9bfea5',
    true,
    false
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.grupo_integrantes (grupo_id, usuario_id) VALUES
  ('e4040004-0000-4000-8000-000000000001', 'fe42b589-a7c7-482e-b07c-48c28a9bfea5'),
  ('e4040004-0000-4000-8000-000000000001', '59d68119-166e-4e7a-96d6-539e6081d7bb'),
  ('e4040004-0000-4000-8000-000000000001', 'c28d2d54-728b-4379-82c7-93214330b1f1'),
  ('e4040004-0000-4000-8000-000000000002', '59d68119-166e-4e7a-96d6-539e6081d7bb'),
  ('e4040004-0000-4000-8000-000000000002', '773ac894-a9c6-4da2-8718-2c0fbd63feb5'),
  ('e4040004-0000-4000-8000-000000000003', 'fe42b589-a7c7-482e-b07c-48c28a9bfea5'),
  ('e4040004-0000-4000-8000-000000000003', 'c28d2d54-728b-4379-82c7-93214330b1f1')
ON CONFLICT DO NOTHING;
