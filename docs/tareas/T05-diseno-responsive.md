# T05 — Interfaz adaptable para la hackatón

Fecha: 2026-11-08. Rama: dev. Responsable nominal pendiente. Vinculado al frente de integración G05 (#5); solicitud directa del usuario de rediseñar frontend móvil y PC.

## Alcance de esta entrega

Acceso, portada, navegación y paleta compartida. Una persona puede iniciar sesión, descubrir los módulos desde Inicio y acceder a su comunidad. Se conservan los servicios de datos y los recorridos internos existentes. El nombre «Red vecinal» es descriptivo y provisional.

La solicitud autoriza el trabajo de presentación e integración en App.tsx, AuthPanel.tsx y el tema compartido. No incorpora dependencias, cambios de contratos ni migraciones. Las referencias gráficas no aprueban nuevas funciones como misiones, banco de tiempo o mensajería.

## Dirección visual

Skill aplicada: `.agents/skills/ui-ux-pro-max/SKILL.md`. Búsquedas locales: `neighborhood community warm accessible --design-system` y `responsive navigation accessibility --stack react-native`. Se adoptaron jerarquía clara, alto contraste, destinos rotulados, objetivos táctiles de al menos 44 y espaciado consistente. Se conserva el mecanismo de navegación del proyecto; no se instala la biblioteca sugerida por la skill.

Verde bosque, fondos crema, acentos salvia y terracota. Ilustración geométrica local de viviendas, decorativa y sin datos ficticios. El rojo se reserva para apoyo urgente. La entrada pública muestra historia y formulario en columnas desde 900 px, y versión compacta en teléfono. El marco autenticado usa barra lateral desde 1000 px y cinco destinos inferiores por debajo. Emergencias permanece en la cabecera. Contenido limitado a 1280 px; portada a 1160 px.

Archivos: `src/app/layout/NeighborhoodShell.tsx` reúne los componentes visuales, `src/shared/theme/index.ts` define colores, `src/app/AppRoot.tsx` conecta los recorridos y `App.tsx` adapta el margen de plataforma.

## Verificación y límites

- TypeScript aprobado antes de la revisión visual; repetido tras ajustar el acceso compacto.
- 86 pruebas existentes de src pasaron. No prueban el aspecto visual ni una integración remota nueva.
- Exportación Android/iOS/web aprobada fuera del sandbox. Advertencias existentes de imágenes referenciadas por CSS de Leaflet.
- Acceso inspeccionado en navegador local de escritorio y viewport de 375 × 812. La inspección detectó una portada demasiado alta en móvil; se compactaron título, espacios e ilustración.
- No se inició sesión ni se crearon cuentas para esta revisión. Portada privada, teclado nativo, áreas seguras y navegación autenticada requieren recorrido en dispositivo con una cuenta de prueba. La adaptación web no equivale a prueba física en teléfono.
- Las pantallas internas conservan su composición; esta entrega no declara un rediseño completo de todos sus formularios ni resuelve los hallazgos SQL de la revisión anterior.

## Revisión humana

Archivos propuestos para staging: App.tsx, src/app/AppRoot.tsx, src/shared/theme/index.ts, src/app/layout/NeighborhoodShell.tsx, docs/tareas/T05-diseno-responsive.md.

Mensaje sugerido: `feat(ui): añadir portada vecinal y navegación adaptable a móvil y escritorio`.

Pendiente: recorrer registro/acceso, Inicio → módulo → comunidad, cierre de sesión, tamaños 375/768/1440, texto ampliado y teclado en teléfono. No cerrar el issue #5 por esta entrega visual.

## Iteración — Barra inferior e iconos

Solicitud explícita: adaptar la barra a la referencia Inicio / Mapa / + / Solidario / Perfil. Se incorporan iconos lineales escalables en `src/shared/ui/AppIcon.tsx`, realizados con primitivas nativas y sin nuevas dependencias. También se aplican en escritorio, accesos de inicio y emergencias. Servicios sigue disponible desde Inicio y la navegación de escritorio. Perfil abre el espacio existente de perfil y comunidad.

El botón central abre un modal con tres opciones conectadas a formularios existentes: servicio/producto, préstamo/intercambio y reporte de emergencia. Tiene cierre explícito, cierre al tocar el fondo y onRequestClose para el botón atrás. AuthPanel coordina la intención y el remontaje del formulario; FavorsScreen incorpora la propiedad opcional initialCreating. Se mantienen los controles existentes de pertenencia a comunidad.

Comprobaciones: TypeScript y 86 pruebas existentes aprobados. Barra renderizada en una vista estática aislada a 375 × 812 e inspeccionada visualmente; esta vista no usa cuentas ni demuestra procesamiento de publicaciones. Exportación Android/iOS/web ejecutada. Pendiente probar interacción del modal, foco/lector de pantalla y envío real en teléfono.

Añadir a la revisión humana: `src/shared/ui/AppIcon.tsx`, `src/features/favors/screens/FavorsScreen.tsx`. Mensaje sugerido para esta iteración: `feat(ui): añadir iconos y barra inferior con acceso a publicar`.
