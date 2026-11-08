# Tarea T02.13: Editar, retirar y reactivar ofertas propias

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 1 «Implementar edición y retiro de ofertas propias conforme al acuerdo».
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: implementada; verificada en navegador con API **simulada**. Sin probar con Supabase real ni en teléfono.
- Dependencias y decisiones: D19 (solo el autor edita todos los campos salvo el tipo, retira y reactiva). Permisos en backend por la migración [T02.7](T02-7-migracion-ofertas.md), sin aplicar. Sesión de Persona 1.

## Resultado
Como autor, en «Mis ofertas» veo mis ofertas activas y retiradas, puedo
retirarlas o reactivarlas y abrir «Editar oferta» para cambiar título,
descripción o teléfono; el tipo se muestra pero no se puede cambiar.

## Alcance
- Incluye: `MyOffersScreen` (lista propia, «Retirar» y «Reactivar»), `EditOfferScreen` (formulario con los datos actuales) y `OfferFormFields`, con los campos compartidos con publicar.
- Cambios en código anterior: `PublishOfferScreen` usa `OfferFormFields` sin cambiar su comportamiento. En `OfferFormFields` y `StarRatingInput` se cambió `accessibilityState` por `aria-checked` y `aria-disabled`, porque en la web el estado marcado no se anunciaba.
- Excluye: editar la ubicación (Persona 5), navegación entre pantallas y borrado (D19: retirar cambia el estado).
- Archivos: `src/features/services/screens/MyOffersScreen.tsx`, `src/features/services/screens/EditOfferScreen.tsx`, `src/features/services/form/OfferFormFields.tsx`; cambios en `PublishOfferScreen.tsx` y `StarRatingInput.tsx`.

## Decisiones técnicas
- El estado mostrado (activa o retirada) cambia solo cuando el servidor confirma.
- Al editar se conserva la ubicación existente hasta integrar la de Persona 5.
- Retirar no pide confirmación porque se puede deshacer con «Reactivar».

## Aceptación
- El autor retira y reactiva su oferta; el estado cambia tras la confirmación.
- Un error deja el estado como estaba y muestra el motivo.
- Editar carga los datos actuales, valida y guarda; el tipo no se puede cambiar.
- Una oferta retirada deja de aparecer como activa (criterio del issue; la lista pública filtra `activa` y RLS la oculta a otros, probado en T02.7).

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Retirar con error y reintento | Expo web en el puerto 8082, `App.tsx` temporal no versionado con **API simulada**; el primer cambio de estado falla | Sigue «Activa» con «No hay conexión…»; al reintentar, «Retirada» y «Reactivar» | Error simulado. |
| Reactivar | Pulsar «Reactivar» | Vuelve a «Activa» con «Retirar» | — |
| Editar | Abrir «Editar», tocar «Producto», vaciar el título y guardar; después escribir un título nuevo y guardar | El tipo no cambia; «Escribe un título de al menos 3 letras.»; luego «Cambios guardados.» y se envió `kind: servicio` con el título nuevo | — |
| Datos al volver | Volver a «Mis ofertas» | Se ve «Gasfitería y electricidad» | Almacén simulado en memoria. |
| Publicar tras separar los campos | Pantalla «Publicar» con datos válidos | Valida y llega a la API (simulada como sin sesión) | — |
| Accesibilidad | Atributos ARIA en el navegador | Antes del cambio `aria-checked` vacío; después `Servicio:true`, `Producto:false` y `aria-disabled` en edición | Sin probar con TalkBack o VoiceOver. |
| Tipos | `npx tsc --noEmit` | Salida 0 | — |
| Tercero no modifica ofertas ajenas | Migración con PGlite (T02.7) | B no edita ni retira la oferta de A | Falta repetirlo con Supabase real y dos cuentas. |

## Cierre y continuación
- Cambios realizados: gestión de ofertas propias y formulario compartido.
- Fallos y pendientes: navegación entre «Mis ofertas» y «Editar» (Persona 5); probar con datos reales y en teléfono.
- Siguiente paso: aplicar la migración en Supabase cuando el equipo lo acuerde y probar el recorrido con dos cuentas reales.
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
