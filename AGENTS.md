AGENTS.md
Reglas prioritarias
- No ejecutes git add ni git push, incluidas sus variantes o automatizaciones que los ejecuten.
- No modifiques el área de preparación de Git mediante comandos equivalentes.
- No crees commits, publiques ni despliegues por iniciativa propia; realiza esas acciones solo ante una solicitud explícita.
- Conserva los cambios ajenos y realiza únicamente modificaciones relacionadas con la tarea.
- No guardes secretos en el código, los documentos, los registros ni los archivos versionados.
- Implementa una funcionalidad atómica y verificable a la vez.
Proyecto
[Nombre proyecto] conecta productos y servicios cercanos, recomendaciones vecinales,
favores sin dinero y apoyo comunitario durante emergencias.
La referencia visual es el prototipo minimalista de Claude enlazado en docs/diseno.md.
Tecnologías y etapa
- Interfaz móvil en React Native.
- Supabase para autenticación, datos y archivos cuando la tarea requiera integración.
- Respeta el lenguaje, las versiones, la navegación y el gestor de paquetes existentes.
- La etapa actual prioriza el prototipo navegable y sus recorridos completos.
- Identifica los datos de ejemplo y las funciones simuladas.
- No añadas servicios o integraciones ajenos al alcance solicitado.
Preparación
1. Inspecciona el repositorio y sus instrucciones locales.
2. Identifica el punto de entrada y los comandos disponibles en sus archivos de configuración.
3. Consulta la documentación temática necesaria.
4. Define una acción del usuario, su resultado observable y cómo comprobarlo.
5. Implementa el cambio mínimo que complete esa acción.
6. Verifica el recorrido antes de ampliar la funcionalidad.
Documentación por tarea
Si vas a…	Lee primero
Definir alcance, pantallas o reglas del producto	[Requisitos](docs/requisitos.md)
Diseñar interfaz, textos o navegación	[Diseño](docs/diseno.md)
Trabajar con React Native, Supabase o lógica de negocio	[Tecnología y desarrollo](docs/tecnologia.md)
Conectar pantallas, cambiar estados o entregar una versión	[Validación](docs/validacion.md)


Lee los detalles según su aplicabilidad; evita cargar documentación irrelevante.
La referencia guía la apariencia y los requisitos del producto definen la cobertura.
Las instrucciones explícitas del usuario prevalecen sobre decisiones anteriores.
Calidad y entrega
- Usa funciones con una responsabilidad y componentes con un propósito claro.
- Separa presentación, estado y acceso a datos siguiendo la estructura existente.
- Mantén coherentes lista, mapa, detalle y actividad después de cada cambio.
- Verifica móvil, acciones de volver y los dos participantes de una coordinación.
- Ejecuta comprobaciones disponibles y reporta resultados observados y límites concretos.
- Entrega cambios, recorrido verificado y pendientes. No inventes comandos ni pruebas.
Mantenimiento
Mantén aquí las reglas globales; modifica los documentos temáticos para los detalles.
Elimina instrucciones redundantes o sustituidas.
Al cambiar de etapa, actualiza las restricciones de prototipado sin alterar las reglas de Git.
