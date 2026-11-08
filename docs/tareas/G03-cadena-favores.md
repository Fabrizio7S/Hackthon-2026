# G03 — Cadena de favores

- Responsable: Persona 3. Nombre y usuario de GitHub pendientes.
- Estado: demo de frontend implementada. Q05 resuelta en [D14](../decisiones.md#confirmadas). Acuerdos de integración por confirmar.
- Dependencias: Persona 1 para identidad, comunidad y permisos. Persona 5 para navegación, ubicación y sincronización.

## Entrega de frontend de Persona 3

El usuario pidió una demo de préstamos e intercambios publicados por vecinos. La demo usa las capturas como referencia para exploración, detalle y actividad. Este flujo de solicitud al dueño es el alcance de la demo. El contrato de necesidades de G03 se conserva más abajo para la integración con el equipo.

| Acción de la demo | Actor | Efecto local |
| --- | --- | --- |
| Solicitar préstamo o intercambio | Otro vecino | La solicitud aparece como pendiente en la actividad de ambos personajes. |
| Aceptar solicitud | Dueño de la publicación | La publicación pasa a coordinación y se cierran las solicitudes competidoras. |
| Marcar como terminada | Vecino que solicitó el recurso | La solicitud y la publicación pasan a terminadas. |
| Guardar o quitar de guardadas | Vecino que explora | Su lista personal cambia durante la sesión. |
| Crear publicación | Perfil de la demo | El botón «+» de Explorar abre un formulario de préstamo o intercambio. La publicación queda en «Mi actividad» durante la sesión. |
| Abrir WhatsApp | Vecino interesado | Se abre un mensaje preparado. La persona elige el contacto porque la demo usa perfiles ficticios. |

El estado vive en memoria y se reinicia al recargar. La interfaz usa un perfil fijo. Las solicitudes nuevas quedan pendientes en la demo actual. Se usan ubicaciones de ejemplo. La demo no acredita permisos de backend, envío entre dispositivos ni persistencia.

### Evidencia de la demo

- `npm run typecheck` y `npm run export` aprobados. Expo generó los bundles de Android, iOS y web.
- Comprobación con aserciones sobre `updateRequests`: solicitud duplicada, intentos de actores ajenos, segunda aceptación incompatible y cierre consistente. La prueba es del estado local y no mide concurrencia de servidor.
- En la versión anterior, con selector de vecinos, se verificaron en el navegador la búsqueda, la vista de lista, el detalle, volver, guardar y quitar de guardadas. También se completaron un préstamo y un intercambio entre personajes de la demo.
- Tras retirar el selector, se repitieron `npm run typecheck` y la exportación para Android, iOS y web. Ambas comprobaciones pasaron.
- El título «Cadena de favores» encabeza el módulo. Las pestañas aparecen debajo y preceden al buscador en Explorar. En el detalle se ocultan y «Volver» regresa a la pestaña de origen. `npm run typecheck` pasó con este ajuste.
- En el detalle, el estado de la publicación se muestra sobre la esquina superior derecha de la imagen. `npm run typecheck` pasó con el cambio.
- En Explorar, Tarjetas muestra una publicación a la vez con contador y botones «Anterior» y «Pasar». Lista incluye la descripción. Pasaron `npm run typecheck` y la exportación de Android, iOS y web. En navegador se comprobaron el avance y el retroceso, los límites, la búsqueda sin resultados, abrir y volver del detalle y guardar desde una tarjeta.
- Las tarjetas admiten arrastre horizontal y tienen más espacio entre la descripción y los botones. Explorar muestra seis publicaciones de ejemplo. Pasaron `npm run typecheck` y la exportación de Android, iOS y web. En el navegador se comprobó el arrastre con puntero en ambas direcciones, el límite de la primera tarjeta y la búsqueda de un ejemplo nuevo. El gesto táctil queda pendiente de comprobar en Expo Go.
- El detalle destaca quién publicó el recurso y muestra su promedio sobre cinco, calculado a partir de las reseñas de ejemplo del vecino. Cada reseña incluye autor, estrellas y comentario. Pasaron `npm run typecheck` y la exportación para Android, iOS y web. También se comprobaron los promedios de Carlos y Luz con los datos de ejemplo.
- En Tarjetas, el corazón junto a «Pasar» guarda o quita la publicación actual y aparece relleno cuando está guardada. `npm run typecheck` pasó con este ajuste.
- El botón «+» se fijó en la esquina inferior derecha de Explorar. En navegador se verificaron su posición, la validación de título y descripción, la creación y consulta de ambos tipos y la salida del formulario sin publicar. Pasaron `npm run typecheck` y la exportación de Android, iOS y web.
- Crear publicación admite una imagen opcional con vista previa y acciones para cambiarla o quitarla. La imagen se muestra en «Mis publicaciones» y en el detalle durante la sesión. En navegador se verificaron la selección, la vista previa, la eliminación antes de publicar y la imagen en la publicación y su detalle. Pasaron `npm run typecheck` y la exportación de Android, iOS y web. La selección desde la galería queda pendiente de comprobar en Expo Go.
- El texto del botón «Publicar» queda centrado en el formulario. `npm run typecheck` pasó con este ajuste.
- Verificación en Expo Go y apertura de WhatsApp en teléfono pendientes.

## Resultado observable

Un vecino publica una necesidad de ayuda sin dinero. Otro vecino ofrece ayuda y el solicitante acepta su ofrecimiento. Ambos consultan la coordinación y ven el mismo estado al reabrir la app. El actor autorizado registra la finalización o cancelación según Q05.

El flujo incluye lista, detalle, acciones disponibles, carga, lista vacía, error y reintento. Cada necesidad se asocia a su autor, comunidad y ubicación según el contrato compartido. Banco de tiempo, créditos, pagos y catálogo de préstamos quedan fuera del alcance. D14 fija el alcance de la primera entrega para la ayuda independiente y la devolución de objetos.

## Estados y permisos

Los nombres son descriptivos. La visibilidad de los datos y los nombres del modelo se cerrarán con los acuerdos de integración.

| Acción | Actor | Estado previo | Resultado o decisión pendiente |
| --- | --- | --- | --- |
| Publicar necesidad | Vecino autorizado en la comunidad | Sin necesidad publicada | Necesidad abierta. Confirmar campos mínimos y ubicación visible. |
| Ofrecer ayuda | Otro vecino autorizado en esa comunidad | Necesidad abierta | Ofrecimiento pendiente asociado a la necesidad. La misma operación repetida produce un solo ofrecimiento. |
| Aceptar ofrecimiento | Solicitante | Necesidad abierta y ofrecimiento pendiente | El ofrecimiento elegido queda aceptado, los demás se cierran y la necesidad pasa a coordinación. |
| Consultar coordinación | Solicitante y vecino aceptado | Coordinación existente | Ambos leen el estado persistido. Falta acordar datos de contacto, ubicación y demás información visible. |
| Finalizar | Solicitante | Coordinación en curso | Coordinación finalizada. |
| Cancelar necesidad | Solicitante | Necesidad abierta, antes de aceptar | Necesidad cancelada. Precisar cómo se representa el cierre de los ofrecimientos pendientes. |
| Cancelar coordinación | Solicitante o vecino aceptado | Coordinación en curso | Coordinación cancelada. D14 no define un flujo de reapertura. |

El solicitante debe poder consultar los ofrecimientos recibidos. Falta precisar qué puede consultar cada oferente, incluso si se acepta a otro vecino, y qué información queda visible para terceros. Una cuenta ajena a la coordinación no puede aceptar, cancelar ni finalizar en nombre de sus participantes.

### Decisiones para cerrar

- **Persona 1.** Identificador autenticado, fuente de membresía vigente y reglas de acceso que el backend usará para validar lecturas y transiciones. Acordar qué pasa con el acceso si un participante deja la comunidad.
- **Persona 5.** Rutas de lista, detalle y coordinación. Forma y precisión de la ubicación. Operaciones que admiten cola offline y contrato de reintentos, errores y conflictos.

## Datos e integración

- Versionar las migraciones y proteger las lecturas con RLS. Validar los actores, la comunidad y el estado actual en el backend, incluso para solicitudes directas que no pasan por la app.
- Hacer atómica la aceptación y cualquier cambio de estado asociado. Si llegan dos aceptaciones para la misma necesidad, debe persistir una sola coordinación compatible. Repetir la misma operación no debe crear otra coordinación.
- Distinguir una operación guardada en el dispositivo de una confirmada por el servidor. Después de reiniciar o recuperar conexión, mostrar el estado confirmado y conservar como pendientes las operaciones que sigan en cola.

## Plan de verificación

Usar A como solicitante, B como oferente y C como tercero. Para probar la carrera de aceptación, C también presenta un ofrecimiento elegible. Usar una cuenta de otra comunidad para comprobar el límite de acceso definido con Persona 1.

| Caso | Comprobación esperada |
| --- | --- |
| Recorrido en teléfono | A publica, B ofrece, A acepta y ambos consultan la coordinación. A finaliza y, tras reiniciar ambas sesiones, los estados coinciden. |
| Permisos | C intenta aceptar, cancelar y finalizar directamente contra el backend una coordinación ajena. Cada intento se rechaza y el estado persiste sin cambios. Comprobar también el acceso desde otra comunidad. |
| Doble pulsación y reintento | Repetir el envío del ofrecimiento y la aceptación, incluida una respuesta perdida después de guardar. Consultar el backend y comprobar un solo efecto por operación. |
| Aceptaciones concurrentes | Con A en dos clientes, aceptar a B y a C al mismo tiempo. Consultar el backend y comprobar una sola coordinación y el cierre del otro ofrecimiento. |
| Finalización y cancelación | Comprobar que B no puede finalizar y que solo A cancela antes de aceptar. En casos separados, comprobar que A y B pueden cancelar durante la coordinación y que ambas cuentas ven el mismo resultado. |
| Sincronización | Con pérdida real de conexión, guardar una operación admitida offline. El emisor la ve pendiente y el otro vecino aún no la recibe. Recuperar la conexión y verificar confirmación sin duplicados. |
| Base técnica | Ejecutar `npm run typecheck` y `npm run export` sobre el módulo integrado. |

## Evidencia y siguiente paso

El repositorio contiene la demo de frontend y el cliente mínimo de Supabase. Los casos de backend e integración descritos en la tabla siguen pendientes.

Para la demo, comprobar el recorrido y el botón de WhatsApp en Expo Go. Para una integración posterior, acordar el recorrido definitivo y los datos compartidos con Personas 1 y 5 antes de crear migraciones o conectar las pantallas.
