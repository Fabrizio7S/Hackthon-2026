# Tareas y estado

## Estado general

Base técnica inicial verificada.
La apertura en teléfono fue confirmada por el usuario.

Para retomar G01: [CONTINUAR-ISSUE-1.md](../CONTINUAR-ISSUE-1.md). Los dos diagnósticos del esquema existente ya están recibidos y analizados; evidencias completas en `docs/diagnosticos/issue-1/`. El siguiente paso es preparar la reconciliación, no repetir consultas ni aplicar las migraciones originales. La verificación del flujo real en teléfono sigue pendiente.

El proyecto se distribuye entre cinco responsabilidades.
Los nombres, usuarios de GitHub, enlaces de issues y asignaciones nominales
deben completarse.

Esta planificación no implica que las funciones estén implementadas.
No marcar tareas como en curso sin inicio confirmado por el responsable.

## Base técnica

| Tarea | Alcance | Estado |
| --- | --- | --- |
| [G00](G00-contexto.md) | Contexto, instrucciones y flujo | Base documental comprobada; actualizar coordinación para trabajo paralelo. |
| [T00.1](T00-1-inicializacion.md) | Inicializar React Native con Expo y TypeScript | Verificación inicial completada; compatibilidad nativa resuelta en T00.2. |
| [T00.2](T00-2-sdk58.md) | Compatibilidad con Expo Go SDK 58 | Verificada; apertura en teléfono confirmada por el usuario. |

## Distribución

| Grupo | Responsable | Alcance | Issue | Estado |
| --- | --- | --- | --- | --- |
| G01 | Persona 1: pendiente de nombre | Acceso, perfil, comunidades e invitaciones | [#1](https://github.com/Fabrizio7S/Hackthon-2026/issues/1) | [T01.1](T01-1-autenticacion.md)–[T01.7](T01-7-compatibilidad.md): implementación, contratos y reconciliación con Supabase completados y verificados en teléfono. |
| G02 | Persona 2: `@Fabrizio7S` | Servicios, productos, contacto y estrellas | [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2) | Integrado en `dev`: [T02.1](T02-1-contrato-ofertas.md)–[T02.17](T02-17-recorrido-modulo.md) implementados y migración de ofertas/calificaciones aplicada en Supabase. |
| G03 | Persona 3: pendiente de nombre | Cadena de favores y coordinación | Pendiente de enlazar | Integrado en `dev` al 100%: [G03](G03-cadena-favores.md) préstamos/intercambios, solicitudes, cancelaciones (D25), fotos en Storage y reseñas reales conectados a Supabase. |
| G04 | Persona 4: `@reydiazz` | Emergencias y recursos de apoyo | [#4](https://github.com/Fabrizio7S/Hackthon-2026/issues/4) | Integrado en `dev`: [G04](G04-emergencias.md) reportes, coordinación de ayuda, recursos y grupos de apoyo, cola local offline, adaptador de mapa y migración/RLS en Supabase. |
| G05 | Persona 5: pendiente de nombre | Integración, navegación, mapas, offline y entrega | [#5](https://github.com/Fabrizio7S/Hackthon-2026/issues/5) | Integrado en `dev`: mapa interactivo móvil (`react-native-maps`) y web (`react-leaflet`), geolocalización (`expo-location`), buscador/filtros en mapa y conexión directa con ofertas de Supabase (`toMapOffers`) y detalle de servicios. |

## Ramas sugeridas

| Grupo | Rama inicial |
| --- | --- |
| G01 | feat/acceso-comunidades |
| G02 | feat/servicios-productos |
| G03 | feat/cadena-favores |
| G04 | feat/emergencias |
| G05 | feat/integracion-mapas-offline |

Crear una nueva rama para el siguiente cambio después de integrar la anterior.
El procedimiento completo está en ../flujo-trabajo.md.

## Dependencias y bloqueos

| Grupo | Dependencias principales | Decisiones pendientes |
| --- | --- | --- |
| G01 | Acceso al proyecto compartido, revisión/aplicación de migración y contratos compartidos | Q01–Q03 resueltas en D17–D19; verificación real pendiente. |
| G02 | Sesión/comunidad y ubicación/mapa | Q04 y Q09 |
| G03 | Sesión/comunidad y contratos de estados | Q05 resuelta en D25. |
| G04 | Sesión/comunidad, ubicación y coordinación de apoyo | Q06 resuelta en D26–D29; Q07 y Q09 pendientes. |
| G05 | Contratos acordados con los demás responsables | Q07, Q08, Q09 y Q10 |

Q07 puede afectar los modelos de todos los grupos.
Resolver su alcance antes de consolidar persistencia y sincronización.

La autenticación básica de G01 puede avanzar independientemente de algunas
decisiones de comunidad.

No todas las partes de un módulo requieren esperar a que otro módulo termine.
Identificar contratos mínimos y tareas independientes.

## Primeras tareas

- G01: registro, inicio, persistencia y cierre de sesión.
- G02: acordar contrato de ofertas y campos mínimos.
- G03: definir actores y estados de necesidades/ofrecimientos.
- G04: definir reportes, estados, actores y recursos.
- G05: coordinar contratos, navegación, propietarios de archivos y alcance offline.

Estas tareas requieren asignación e inicio confirmado antes de pasar a en curso.

## Requisitos transversales

| Requisito | Coordinación | Participación |
| --- | --- | --- |
| Navegación e integración | Persona 5 | Todos los módulos |
| Ubicación y mapas | Persona 5 | Personas 2, 3 y 4 aportan datos |
| Offline y sincronización | Persona 5 | Cada responsable adapta su módulo |
| Tutorial y accesibilidad | Persona 5 | Todos verifican sus pantallas |
| Publicación en tres clics | Persona 5 | Responsables de formularios |
| Datos y permisos | Cada responsable | Revisión conjunta de contratos |
| Pruebas integradas | Persona 5 | Todos corrigen sus módulos |

Muro, adjuntos, reacciones, favoritos e historial requieren resolver Q09 y
asignar subtareas concretas.

No declararlos implementados ni descartados sin registrar la decisión.

## Fichas de tareas

Usar [PLANTILLA.md](PLANTILLA.md) para cada tarea atómica.

Registrar:
- Identificador y grupo.
- Responsable.
- Issue y rama.
- Resultado observable.
- Alcance y exclusiones.
- Dependencias y decisiones.
- Archivos compartidos que se modificarán.
- Criterios de aceptación.
- Evidencia, limitaciones y siguiente paso.

No editar la ficha de otra persona activa sin coordinación.

## Estados

- Pendiente: identificada, sin preparación completa.
- Preparada: alcance y aceptación acordados; dependencias necesarias resueltas.
- En curso: responsable trabajando en ella.
- Bloqueada: impedimento identificado y registrado.
- Implementada sin verificar: código disponible, comprobaciones pendientes.
- Verificada: criterios comprobados con evidencia.

La integración en main se registra además del estado de verificación.
Una tarea puede estar verificada en su rama y seguir pendiente de integración.

## Cierre

- Un PR parcial no cierra el issue principal.
- El issue principal se cierra cuando todos sus criterios están cumplidos.
- Registrar aplazamientos mediante decisión explícita del equipo.
- No ocultar fallos ni presentar simulaciones como integración real.
- Actualizar índice, ficha e issue sin duplicar toda la información.
