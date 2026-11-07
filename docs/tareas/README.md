# Tareas y estado

Actualizado: 2026-11-07. Base técnica lista y apertura en teléfono confirmada por el usuario. Sin tarea en curso; siguiente grupo propuesto: G01.

| Grupo | Alcance | Estado |
| --- | --- | --- |
| [G00](G00-contexto.md) | Contexto, instrucciones y flujo | Base documental comprobada; revisión del equipo pendiente. |
| [T00.1](T00-1-inicializacion.md) (G00) | Inicializar React Native con Expo y TypeScript | Verificación inicial completada; compatibilidad nativa resuelta en T00.2. |
| [T00.2](T00-2-sdk58.md) (G00) | Compatibilidad con Expo Go SDK 58 | Verificada; apertura en teléfono confirmada por el usuario. |
| G01 | Acceso, perfil, comunidad e invitaciones | Propuesto; cerrar Q01–Q03, Q07 y Q10 según afecten al modelo. |
| G02 | Servicios/productos, contacto y estrellas | Propuesto; depende de G01 y Q04/Q09. |
| G03 | Favores y coordinación | Propuesto; depende de G01 y Q05. |
| G04 | Emergencias y apoyo | Propuesto; depende de comunidad y Q06. |

El orden es propuesto. Muro, favoritos, historial, tutorial, mapa y offline necesitan asignación al cerrar alcance; no están descartados. Permisos, ubicación y persistencia deben contemplarse antes de implementar modelos dependientes.

## Siguiente paso
Proponer como primera tarea de G01 el registro, inicio, persistencia y cierre de sesión con Supabase. Falta identificar el proyecto de Supabase y su configuración pública. Las decisiones de comunidades y perfil bloquean esas funciones posteriores, no la autenticación básica. Acordar alcance offline antes de implementar persistencia de datos del producto.

## Fichas
Copiar [plantilla](PLANTILLA.md) para cada tarea aprobada. Añadir al índice enlace, responsable, grupo y estado. Evidencia detallada en su ficha; no editar la de otra persona activa sin coordinación.

Estados: pendiente, preparada, en curso, bloqueada, implementada sin verificar, verificada. Una propuesta no está preparada sin dependencias resueltas y aceptación acordada. El índice no autoriza ejecución automática.
