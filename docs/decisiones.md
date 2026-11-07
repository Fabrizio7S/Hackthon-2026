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
| D16 | Para T01.1, el usuario acordó registro e inicio mediante correo y contraseña. No determina datos del perfil ni resuelve Q01–Q03. |
| D17 | Q03, aprobada por el usuario para esta entrega: nombre visible obligatorio, correo privado obtenido de la sesión y código personal único generado por el servidor que el cliente no puede modificar. No se incorporan teléfono, dirección ni coordenadas. El perfil completo solo lo consulta su dueño; la búsqueda por código para invitaciones devolverá únicamente nombre y código a representantes autorizados. |
| D18 | Q01, aprobada por el usuario: una comunidad por vecino. Sin comunidad puede gestionar su perfil e invitaciones. Los datos de comunidad e integrantes solo son accesibles a miembros de esa comunidad. No determina la visibilidad de emergencias ni otros módulos. |
| D19 | Q02, aprobada por el usuario: representante autorizado manualmente en backend, sin asignación de roles desde el cliente. Solo el representante crea comunidad e invita. No se duplican invitaciones pendientes ni se invita a quien ya es miembro. Aceptar o rechazar repetidamente la misma invitación no produce cambios adicionales; después de rechazar puede enviarse una nueva invitación. |

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

- SQLite para persistencia y cola offline.
- PostGIS para consultas de cercanía.
- Devolución de objetos dentro de la primera entrega.
- Ampliaciones del prototipo enumeradas en producto.md.

## Preguntas

| ID | Decisión por resolver | Afecta |
| --- | --- | --- |
| Q01 | Resuelta para esta entrega en D18. | Pertenencia, consultas y permisos. |
| Q02 | Resuelta para esta entrega en D19. | Roles e invitaciones. |
| Q03 | Resuelta para esta entrega en D17. | Perfil y privacidad. |
| Q04 | ¿Qué rango tienen las estrellas, quién califica y cuántas veces? | Servicios y productos. |
| Q05 | ¿Quién confirma finalización? ¿Cómo se cancela? ¿Qué ocurre con otros ofrecimientos? ¿Se publica ayuda disponible sin necesidad previa? | Favores y coordinación. |
| Q06 | ¿Quién atiende y cierra emergencias? ¿Qué niveles, recursos y grupos se muestran? | Emergencias. |
| Q07 | ¿Qué funciona offline? ¿Cómo se gestionan reintentos, duplicados y conflictos? | Modelos, persistencia y sincronización. |
| Q08 | ¿Desde dónde se cuentan tres clics? ¿Cómo se verifica tutorial y accesibilidad? | Publicación y validación transversal. |
| Q09 | ¿Cuál es el alcance inicial de productos, muro, adjuntos, reacciones, favoritos e historial? | Cobertura y reparto de subtareas. |
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
