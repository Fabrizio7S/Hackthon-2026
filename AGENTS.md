# Instrucciones para agentes

## Reglas prioritarias
- No ejecutes git add ni git push, tampoco mediante variantes, scripts o automatizaciones. No modifiques el área de preparación mediante comandos equivalentes.
- No crees commits. Al cerrar una tarea verificada, propon archivos concretos para git add y un mensaje para git commit; él los revisa y ejecuta.
- No publiques ni despliegues sin solicitud explícita. No guardes secretos en código, documentos, registros o archivos versionados.
- Conserva los cambios ajenos. No reviertas ni sobrescribas trabajo fuera de tu tarea.
- Trabaja en una sola tarea a la vez y dentro del único grupo funcional activo del equipo. No abras otro grupo ni delegues tareas por iniciativa propia.
- No conviertas propuestas, dudas o ampliaciones del prototipo de referencia en requisitos aprobados.

## Proyecto y etapa
Aplicación móvil para un sector vecinal: productos y servicios cercanos, calificaciones, favores sin dinero y apoyo durante emergencias. Stack acordado: React Native con Expo, TypeScript y Supabase. Funcionalidad antes del acabado visual.

Etapa actual: inicialización de la base técnica, autorizada por el equipo. Entrada: index.ts y App.tsx. Gestor: npm; conserva package-lock.json. Usa los comandos de README.md. Esta autorización no incluye implementar funciones del producto ni conectar servicios externos.

## Entrada y lectura por tarea
1. Lee [README](README.md), [decisiones](docs/decisiones.md) y [estado de tareas](docs/tareas/README.md).
2. Consulta solo los documentos pertinentes:

| Trabajo | Documento |
| --- | --- |
| Alcance y bases del reto | [Producto](docs/producto.md) |
| Acciones, participantes y estados | [Recorridos](docs/recorridos.md) |
| Pantallas y referencias | [Diseño](docs/diseno.md) |
| Arquitectura e integración | [Tecnología](docs/tecnologia.md) |
| Comprobaciones y entrega | [Validación](docs/validacion.md) |
| Colaboración y continuidad | [Flujo de trabajo](docs/flujo-trabajo.md) |

La carpeta doc/ contiene material anterior pendiente de reformular: consérvala, pero no la uses como especificación vigente. El contexto actual vive en docs/.

## Ejecución y cierre
- Revisa el estado del repositorio y la ficha de tarea antes de editar. Define acción del usuario, resultado observable y comprobación.
- Resuelve con el equipo las decisiones bloqueantes. Avanza solo partes independientes autorizadas; no inventes reglas del producto.
- Usa componentes con propósito claro y separa presentación, estado y datos conforme a la estructura acordada.
- Comprueba móvil, volver y ambos participantes cuando corresponda. Mantén coherentes las vistas de los mismos datos.
- Identifica datos de ejemplo y simulaciones. Una simulación no demuestra una integración real.
- Ejecuta comprobaciones existentes y pertinentes. Informa qué pasó, qué falló y qué no se pudo comprobar.
- Actualiza la ficha con evidencia, límites y siguiente paso. Implementado no significa verificado.
- Actualiza los documentos afectados por decisiones aprobadas y evita duplicar reglas.
