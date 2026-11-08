# Decisiones y pendientes

Registrar acuerdos aprobados, su motivo y las tareas afectadas.
Las propuestas y preguntas pendientes no son requisitos confirmados.

## Confirmadas

| ID | Acuerdo |
| --- | --- |
| D01 | Las decisiones del equipo prevalecen sobre el prototipo de referencia. |
| D02 | React Native con Expo, TypeScript y Supabase. |
| D03 | Funcionalidad antes del acabado visual. El estado real de implementación se registra en el índice de tareas. |
| D04 | Un representante perteneciente al sector crea la comunidad. |
| D05 | El representante invita mediante el código personal del vecino; el vecino acepta. |
| D06 | Los servicios se coordinan principalmente por contacto directo. |
| D07 | Favores: publicar necesidad, ofrecer ayuda, aceptar y completar dentro de la app. |
| D08 | Calificación con estrellas; elegibilidad y reglas pendientes. |
| D09 | Devolución de préstamos deseable según tiempo disponible. |
| D10 | Desarrollo paralelo por módulos asignados; una tarea atómica por agente y coordinación previa de archivos y contratos compartidos. Sustituye la regla anterior de un único grupo funcional activo. |
| D11 | Agentes sin git add, cambios de staging, commits ni git push. Proponen archivos y mensaje de commit para ejecución humana. |
| D12 | La inicialización autorizada comprendió Expo con TypeScript, npm y pantalla inicial. No demuestra implementación de funciones de negocio. |
| D13 | Actualizar a Expo SDK 58 para coincidir con Expo Go instalado por el usuario. La ficha T00.2 registra la verificación. |
| D14 | Repartir el proyecto entre cinco responsabilidades: acceso/comunidades; servicios/productos; favores; emergencias; integración/mapas/offline. |
| D15 | Cada responsable implementa y comprueba interfaz, datos y permisos de su módulo. Integración coordina los contratos y recorridos conjuntos. |
| D16 | G02, campos de oferta para la primera entrega: tipo (servicio o producto, mismos campos), título, descripción, teléfono, ubicación opcional y estado activa/retirada. Sin precio, categoría ni foto. Decidido por Persona 2 el 2026-11-07; comunicar al equipo. Detalle en [T02.1](tareas/T02-1-contrato-ofertas.md). |
| D17 | G02, el teléfono de contacto se escribe en cada oferta y se muestra completo a los vecinos que pueden ver la oferta. No depende del perfil. Decidido por Persona 2 el 2026-11-07. |
| D18 | G02, estrellas de 1 a 5: cualquier vecino que pueda ver la oferta califica una vez por oferta, puede cambiar su nota y no califica su propia oferta. Resuelve Q04. Decidido por Persona 2 el 2026-11-07. |
| D19 | G02, edición y retiro: solo el autor edita (todos los campos salvo el tipo), retira y reactiva su oferta. Decidido por Persona 2 el 2026-11-07. |
| D20 | G02, búsqueda y filtros mínimos para la primera entrega: búsqueda por texto en título y descripción (sin distinguir mayúsculas ni tildes) y filtro por tipo (Todos, Servicios, Productos) conforme a los campos de D16. Decidido por Persona 2 el 2026-11-07. Detalle en [T02.14](tareas/T02-14-busqueda-filtros.md). |

## Organización prevista

- Una copia local del mismo repositorio por integrante.
- Ramas propias y entregas pequeñas mediante Pull Requests.
- Revisión por otro integrante antes de integrar.
- Nombres, usuarios de GitHub e integrador nominal pendientes de registrar.
- La publicación o despliegue requiere solicitud explícita.

El procedimiento se documenta en flujo-trabajo.md.
No repetir sus reglas completas aquí.

## Provisional

Emergencias siempre disponible.
Falta confirmar reglas de atención, coordinación y cierre.

## Propuestas sin aprobación

- Una comunidad por usuario para la primera entrega.
- SQLite para persistencia y cola offline.
- PostGIS para consultas de cercanía.
- Devolución de objetos dentro de la primera entrega.
- Ampliaciones del prototipo enumeradas en producto.md.

## Preguntas

| ID | Decisión por resolver | Afecta |
| --- | --- | --- |
| Q01 | ¿Una o varias comunidades por usuario? ¿Qué se ve fuera de la propia? | Pertenencia, consultas y permisos. |
| Q02 | ¿Cómo se reconoce al representante? ¿Quién más invita? ¿Qué ocurre al rechazar o repetir invitaciones? | Roles e invitaciones. |
| Q03 | ¿Qué datos de perfil son obligatorios y qué ubicación se muestra a otros? | Perfil y privacidad. |
| Q04 | ¿Qué rango tienen las estrellas, quién califica y cuántas veces? Resuelta en D18. | Servicios y productos. |
| Q05 | ¿Quién confirma finalización? ¿Cómo se cancela? ¿Qué ocurre con otros ofrecimientos? ¿Se publica ayuda disponible sin necesidad previa? | Favores y coordinación. |
| Q06 | ¿Quién atiende y cierra emergencias? ¿Qué niveles, recursos y grupos se muestran? | Emergencias. |
| Q07 | ¿Qué funciona offline? ¿Cómo se gestionan reintentos, duplicados y conflictos? | Modelos, persistencia y sincronización. |
| Q08 | ¿Desde dónde se cuentan tres clics? ¿Cómo se verifica tutorial y accesibilidad? | Publicación y validación transversal. |
| Q09 | ¿Cuál es el alcance inicial de productos, muro, adjuntos, reacciones, favoritos e historial? Productos resuelto en D16; el resto sigue abierto. | Cobertura y reparto de subtareas. |
| Q10 | ¿Quién ocupa cada responsabilidad, quién integra y quién revisa cada entrega? | Coordinación del equipo. |

Q10 está parcialmente resuelta por el reparto en cinco responsabilidades.
Falta completar nombres, usuarios y responsables de revisión.

## Tratamiento de decisiones

1. Resolver la pregunta con el equipo.
2. Registrar acuerdo, motivo y alcance.
3. Actualizar los documentos afectados.
4. Identificar tareas desbloqueadas o que requieren cambios.
5. Mantener trazabilidad de la decisión anterior cuando se sustituya.

No dar por resuelta una pregunta por conveniencia técnica.

Las decisiones que afectan al modelo compartido deben resolverse antes de
implementar funciones dependientes.

## Imagen de referencia

La imagen orienta el diseño, pero no aprueba automáticamente:
- Activación global de un modo emergencia.
- Tarjetas deslizables.
- Catálogo de préstamos como flujo principal de favores.
- Polígonos de zonas confirmadas.
- Reacciones o comentarios.
- Contacto automático con servicios oficiales.

Consultar producto.md y recorridos.md para el alcance funcional.