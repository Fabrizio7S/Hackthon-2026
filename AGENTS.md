# Instrucciones para agentes

## Reglas prioritarias

- No ejecutes git add ni git push, tampoco mediante variantes, scripts o automatizaciones. No modifiques el área de preparación mediante comandos equivalentes.
- No crees commits. Al terminar una tarea verificada, propone archivos concretos para git add y un mensaje de commit; el integrante los revisa y ejecuta.
- No publiques ni despliegues sin solicitud explícita.
- No guardes secretos en código, documentación, registros o archivos versionados.
- Conserva los cambios ajenos. No reviertas ni sobrescribas trabajo fuera de tu tarea.
- Se permite desarrollar en paralelo los módulos asignados a distintos integrantes.
- Cada agente trabaja en una sola tarea atómica dentro del issue asignado.
- Coordina antes de modificar navegación, contratos, dependencias, configuración, migraciones o archivos compartidos.
- No amplíes el alcance ni delegues tareas por iniciativa propia.
- No conviertas propuestas, decisiones pendientes o elementos de la imagen de referencia en requisitos aprobados.

## Proyecto y etapa

Aplicación móvil para un sector vecinal: productos y servicios cercanos,
calificaciones, favores sin dinero y apoyo durante emergencias.

Stack acordado: React Native con Expo, TypeScript y Supabase.
La funcionalidad precede al acabado visual.

La base técnica inicial está verificada. El desarrollo se organiza en cinco
responsabilidades:
1. Acceso, perfil, comunidades e invitaciones.
2. Servicios, productos, contacto y calificaciones.
3. Cadena de favores y coordinación.
4. Emergencias y recursos de apoyo.
5. Integración, navegación, mapas, offline y entrega.

Este reparto no significa que las funciones estén implementadas ni que las
decisiones pendientes estén resueltas.

Entrada: index.ts y App.tsx.
Gestor: npm; conserva package-lock.json.
Usa los comandos documentados en README.md.

El estado vigente, los responsables y las dependencias se registran en
docs/tareas/README.md.

## Entrada y lectura por tarea

1. Lee README.md, docs/decisiones.md y docs/tareas/README.md.
2. Lee el issue y la ficha de la tarea asignada.
3. Consulta únicamente los documentos pertinentes:

| Trabajo | Documento |
| --- | --- |
| Alcance y requisitos | docs/producto.md |
| Acciones, participantes y estados | docs/recorridos.md |
| Pantallas y referencias | docs/diseno.md |
| Arquitectura e integración | docs/tecnologia.md |
| Comprobaciones y entrega | docs/validacion.md |
| Colaboración e integración | docs/flujo-trabajo.md |

El contexto vigente vive en docs/.
Si existe material anterior en doc/, consérvalo, pero no lo uses como
especificación vigente.

## Antes de editar

- Revisa el estado del repositorio sin alterar staging.
- Identifica responsable, rama, issue y tarea concreta.
- Define acción del usuario, resultado observable y comprobación.
- Identifica archivos propios, archivos compartidos y dependencias.
- Resuelve las decisiones que bloquean la tarea.
- Avanza solo las partes independientes autorizadas.
- No implementes reglas de negocio suponiendo respuestas pendientes.

## Implementación

- Cada responsable entrega interfaz, estado, acceso a datos, permisos y pruebas de su módulo.
- Separa presentación, estado y datos conforme a la estructura acordada.
- Reutiliza contratos compartidos; no mantengas versiones incompatibles.
- Entrega cambios pequeños y verificables.
- Identifica datos de ejemplo y simulaciones.
- Una simulación no demuestra una integración real.
- Valida permisos y cambios de estado en backend, no únicamente en pantalla.
- Coordina cambios de esquema antes de aplicarlos a servicios compartidos.
- Una rama de Git no proporciona una base de datos independiente.
- No introduzcas dependencias ni infraestructura por iniciativa propia cuando afecten al equipo.

## Verificación y cierre

- Ejecuta las comprobaciones existentes y pertinentes.
- Verifica en teléfono los recorridos afectados.
- Comprueba navegación atrás, errores, reintentos y operaciones repetidas.
- Comprueba ambos participantes cuando corresponda.
- Mantén coherentes lista, mapa, detalle y estados de los mismos datos.
- Distingue guardado local de envío confirmado.
- Informa qué pasó, qué falló y qué no pudo comprobarse.
- Actualiza la ficha de tarea con evidencia, límites y siguiente paso.
- Implementado no significa verificado.
- No cierres un issue principal con criterios pendientes.
- Actualiza los documentos afectados por decisiones aprobadas.
- Evita duplicar reglas entre documentos.