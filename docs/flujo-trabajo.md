# Flujo de trabajo

## Organización

El proyecto se distribuye entre cinco integrantes:

| Responsable | Área |
| --- | --- |
| Persona 1 | Acceso, perfil, comunidades e invitaciones |
| Persona 2 | Servicios, productos, contacto y calificaciones |
| Persona 3 | Cadena de favores y coordinación |
| Persona 4 | Emergencias y recursos de apoyo |
| Persona 5 | Integración, navegación, mapas, offline y entrega |

Los nombres y usuarios de GitHub se registran en docs/tareas/README.md.

Cada integrante mantiene una copia local del mismo repositorio.
Se permite trabajar en paralelo en módulos asignados.
Cada agente trabaja en una sola tarea atómica.

Los issues principales agrupan responsabilidades.
Cada uno se entrega mediante cambios pequeños y verificables.

Cada responsable implementa y comprueba interfaz, datos, permisos y
comportamiento de su módulo.

Persona 5 coordina la integración y los contratos compartidos.
No concentra todo el backend ni todas las pruebas del equipo.

## Preparación común

Antes de comenzar funciones dependientes, acordar y registrar:

- Estructura de carpetas.
- Navegación y puntos de entrada de los módulos.
- Contratos mínimos de usuario, sesión y comunidad.
- Identificadores, ubicación y estados compartidos.
- Responsables de archivos centrales.
- Orden de migraciones.
- Configuración del entorno compartido.
- Alcance offline que afecta al modelo.

Una dependencia pendiente no impide avanzar partes independientes autorizadas.

Las simulaciones deben identificarse. No cuentan como integración real ni
justifican cerrar una tarea dependiente.

## Ramas

Cada tarea se desarrolla en una rama creada desde main actualizado.

Ramas sugeridas para los módulos:

| Área | Rama |
| --- | --- |
| Acceso y comunidades | feat/acceso-comunidades |
| Servicios y productos | feat/servicios-productos |
| Favores | feat/cadena-favores |
| Emergencias | feat/emergencias |
| Integración | feat/integracion-mapas-offline |

Estas ramas sirven para la primera entrega de cada módulo.
Después de integrar una rama, crear una nueva para el siguiente cambio.

No reutilizar una rama ya integrada para acumular trabajo nuevo.

Cada persona puede mantener un PR activo para su tarea actual.
Evitar ramas largas con todo el módulo sin integrar.

## Arranque de una tarea

1. Leer AGENTS.md y la documentación de entrada.
2. Revisar el issue y su ficha.
3. Comprobar el estado local sin alterar staging.
4. Identificar rama, responsable y dependencias.
5. Definir resultado observable y criterios de aceptación.
6. Identificar archivos propios y compartidos.
7. Resolver decisiones bloqueantes.
8. Implementar únicamente el alcance asignado.

Si existen cambios locales, conservarlos y coordinar antes de cambiar ramas
o incorporar cambios que puedan afectarlos.

## Archivos compartidos

Coordinar antes de modificar:

- App.tsx y registro de navegación.
- package.json y package-lock.json.
- app.json y configuración general.
- Cliente de Supabase.
- Contratos y componentes compartidos.
- Migraciones y políticas de acceso.
- Documentación global.

Registrar en la ficha quién modificará cada archivo compartido.
Evitar que varias personas editen simultáneamente el mismo archivo sin acuerdo.

Cada módulo conserva sus archivos propios siempre que sea posible.

## Base de datos y servicios compartidos

Una rama de Git no crea una base de datos independiente.

- Entregar cambios de esquema mediante migraciones revisables.
- Coordinar el orden de aplicación.
- No modificar migraciones que otra persona ya haya aplicado; añadir una nueva.
- No aplicar cambios destructivos a datos compartidos sin autorización explícita.
- Comprobar permisos por usuario y comunidad.
- No confiar únicamente en filtros de interfaz.
- No incluir claves administrativas en la aplicación móvil.
- Registrar los nombres de variables de configuración sin secretos.

## Pull Requests

Flujo de integración:

1. Implementar un cambio pequeño.
2. Ejecutar comprobaciones y registrar evidencia.
3. El integrante revisa y realiza sus commits.
4. El integrante sube la rama.
5. Abrir un Pull Request hacia main.
6. Indicar issue, alcance, comprobaciones y limitaciones.
7. Otro integrante revisa el cambio.
8. Corregir observaciones.
9. Integrar y comprobar el recorrido afectado.
10. Los demás integrantes incorporan los cambios de main.

No esperar a terminar todo el módulo para integrar avances utilizables.

Un PR parcial referencia el issue principal, pero no lo cierra.
Cerrar el issue principal solo cuando se cumplan todos sus criterios.

No integrar cambios que rompan el arranque o los recorridos ya verificados.

## Orden de integración

- Preparar contratos y navegación compartidos.
- Integrar acceso y comunidad.
- Integrar servicios, favores y emergencias conforme estén listas sus dependencias.
- Verificar recorridos conjuntos.
- Completar comprobaciones transversales.

Mapas y offline se diseñan desde el inicio cuando afectan a los modelos.
No deben quedar como añadidos improvisados al final.

## Verificación

Cada responsable comprueba:

- Carga, vacío, error y reintento.
- Validación de entradas.
- Doble pulsación y operaciones repetidas.
- Navegación atrás y reinicio.
- Persistencia de cambios confirmados.
- Permisos con una cuenta autorizada y otra sin autorización.
- Ambos participantes cuando corresponda.
- Pérdida y recuperación de conexión según el alcance aprobado.

Persona 5 coordina la verificación de la aplicación integrada.
Los errores se devuelven al propietario del módulo para su corrección.

## Cierre y continuidad

- Registrar resultados en la ficha correspondiente.
- Actualizar el issue y el índice de tareas.
- Documentar bloqueos y siguiente paso.
- Registrar decisiones aprobadas en docs/decisiones.md.
- Mantener README.md reproducible.
- No presentar compilación correcta como prueba suficiente del recorrido.

Los agentes proponen archivos y mensajes de commit.
Los humanos ejecutan git add, commits, push e integración.

La ficha conserva evidencia detallada.
El issue conserva alcance y seguimiento.
El índice conserva estado y enlaces.
No duplicar listas completas en los tres lugares.

Otra sesión debe poder retomar el trabajo sin depender del historial del chat.