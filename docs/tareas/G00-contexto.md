# G00 — Preparar contexto compartido

- Responsable: usuario como interlocutor del equipo; agente asignado a esta tarea.
- Estado: base documental verificada; aceptación del contenido por el equipo pendiente.
- Fecha: 2026-11-07.

## Resultado y alcance
Un integrante puede orientar a su agente desde README.md y encontrar reglas, acuerdos,
preguntas abiertas, recorridos y continuidad sin depender exclusivamente de este chat.
No incluye inicialización de la app, instalaciones ni cambios en servicios externos.

## Cambios
- Reformulado AGENTS.md con los acuerdos actuales y restricciones de Git.
- Creado contexto temático, entrada común independiente de herramienta y plantilla de tareas.
- Copiado el esquema del equipo a docs/referencias/prototipo-equipo.png.
- Conservado doc/diseno sin modificaciones.

## Evidencia observada
Esta evidencia corresponde a la preparación documental anterior a la inicialización.
El estado técnico posterior está en [T00.1](T00-1-inicializacion.md).

- Comprobación de enlaces locales: cero enlaces rotos.
- git diff --check: sin errores después de normalizar finales de línea. Git avisa de conversión futura LF/CRLF en Windows.
- git status --short: AGENTS.md modificado; README.md y docs/ nuevos; sin cambios preparados.
- No se ejecutaron pruebas móviles ni se probó carga automática en herramientas específicas. No existe aún aplicación.
- No se ha realizado una prueba independiente de arranque con otro agente.

## Continuación
Revisar Q01–Q03 y Q10 con el equipo. Acordar Q07 antes de implementar persistencia.
El índice de grupos sigue siendo una propuesta, sin grupo de implementación activo.

## Propuesta para revisión humana de Git
Archivos sugeridos para preparar, revisando antes su contenido:

- AGENTS.md
- README.md
- docs/producto.md
- docs/decisiones.md
- docs/recorridos.md
- docs/diseno.md
- docs/tecnologia.md
- docs/flujo-trabajo.md
- docs/validacion.md
- docs/tareas/README.md
- docs/tareas/PLANTILLA.md
- docs/tareas/G00-contexto.md
- docs/referencias/prototipo-equipo.png

Mensaje sugerido: `docs: preparar contexto y flujo compartido para agentes`.
El agente no ejecuta git add, git commit ni git push.
