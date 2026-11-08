# Recorridos

Contratos de comportamiento previstos; no describen una aplicación ya existente. Consulta las preguntas Q en [decisiones](decisiones.md).

## Comunidad
- Participantes: representante y vecino invitado.
- El vecino se registra, completa perfil y obtiene su código personal.
- El representante crea comunidad e invita usando el código; el vecino acepta.
- Resultado: ambos ven al vecino como integrante de la comunidad.
- Comprobar que otra cuenta no pueda aceptar esa invitación.
- Q01–Q03 resueltas en D17–D19. Flujo implementado en G01, con migraciones y verificación real pendientes; consultar las fichas T01.1–T01.5.

## Servicios y productos
- Un vecino publica una oferta y otro consulta sus datos dentro del alcance geográfico aprobado.
- El detalle facilita contacto por llamada o WhatsApp con el dato correcto.
- Abrir el marcador o WhatsApp no demuestra contratación ni servicio completado.
- Las estrellas necesitan reglas de Q04; productos y acciones complementarias necesitan Q09.

## Favores
- El solicitante publica una necesidad; otro vecino ofrece ayuda.
- El solicitante acepta un ofrecimiento y la coordinación queda en curso.
- El solicitante registra la finalización. Las reglas de cancelación y cierre de ofrecimientos están en [D25](decisiones.md#confirmadas).
- Resultado: ambas cuentas ven el mismo estado al volver a abrir.
- Dos aceptaciones simultáneas deben dejar una sola coordinación.

## Emergencias
- Un vecino reporta una situación; otros identifican necesidad y apoyo disponible.
- Reporte con tipo, urgencia, descripción y ubicación. Estados: abierta, en atención y solucionada. Atiende y cierra el autor o el representante (D26).
- Otro vecino ofrece ayuda con una nota; el autor o el representante la acepta o la rechaza (D27).
- Los reportes sobre personas vulnerables ocultan descripción y autor a quien no participa (D29).
- Sin conexión, el reporte queda guardado en el teléfono y se marca como pendiente; solo es «enviado» cuando el servidor lo confirma.
- Resultado esperado: distinguir necesidades abiertas de atendidas con vistas coherentes.
- No inferir del prototipo activación por junta vecinal, reporte “estoy bien” ni envío por SMS.

## Transversal
- Lista, mapa y detalle representan los mismos registros cuando existan.
- Volver no pierde cambios confirmados ni duplica operaciones.
- Tutorial y publicación necesitan Q08.
- Guardar una solicitud localmente no significa que otros la recibieron. Cuando haya sincronización, verificar ambos lados y distinguir pendiente de enviado.
