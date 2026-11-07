# Tarea T02.9: Pantalla para publicar una oferta

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 1 «Publicaciones»: formulario con validaciones y sin duplicados.
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: implementada; verificada en navegador con API **simulada**. Sin probar con Supabase real ni en teléfono.
- Dependencias y decisiones: D16, D17. Migración [T02.7](T02-7-migracion-ofertas.md) sin aplicar, sesión de Persona 1, navegación y ubicación de Persona 5.

## Resultado
Como vecino, elijo servicio o producto, escribo título, descripción opcional y
teléfono, pulso «Publicar» y veo «Oferta publicada»; si algo falta veo qué
corregir en cada campo, y si falla la conexión puedo reintentar sin duplicar.

## Alcance
- Incluye: `PublishOfferScreen` con selector de tipo, contadores de caracteres, errores por campo, error general, estado «Publicando…», confirmación y «Publicar otra».
- Excluye: ubicación (se publica sin ella), registro en la navegación, editar y retirar (siguiente tarea).
- Archivo: `src/features/services/screens/PublishOfferScreen.tsx`. Usa `validateOffer`, `offersApi.create`, `useSubmitOnce` y la paleta de G02. No modifica `App.tsx`.

## Decisiones técnicas
- `api` es un parámetro opcional para pruebas; por defecto usa el Supabase compartido.
- El identificador de envío se conserva entre reintentos y se renueva solo tras publicar con éxito, para que el servidor reconozca el mismo envío (T02.8).
- Se informa que el teléfono se mostrará completo (D17).
- Ubicación pendiente: Persona 5 ya usa `expo-location` en `feature/mapa-offline`, con el mismo formato `{ latitude, longitude }` de G02. Se añadirá cuando esa rama llegue a `main`.
- La pantalla no reserva espacio para la barra de estado; lo resolverá la navegación compartida.

## Aceptación
- Con el formulario vacío se ven los errores de tipo, título y teléfono, y no se envía nada.
- Varios toques en «Publicar» generan un solo envío.
- Tras un error de conexión, reintentar usa el mismo identificador y termina en «Oferta publicada».

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Formulario vacío | Expo web en el puerto 8082, pantalla temporal no versionada en `App.tsx` con **API simulada** que usa la validación real | Errores «Elige si ofreces un servicio o un producto», «Escribe un título de al menos 3 letras» y «Escribe un número…», con bordes rojos | — |
| Doble envío y error de red | Formulario completo y tres toques seguidos; la API simulada falla la primera vez | Un solo envío registrado, «Publicando…» y luego «No hay conexión. Revisa tu internet e inténtalo de nuevo.» | Error simulado, no un corte de red real. |
| Reintento sin duplicar | Pulsar «Publicar» de nuevo | Mismo identificador en ambos envíos y pantalla «Oferta publicada» | API simulada. |
| Accesibilidad | Árbol de accesibilidad del navegador | `radio "Servicio"`, `radio "Producto"`, campos con nombre y `button "Publicar"` (corregido en esta tarea; antes no tenían nombre) | Sin probar con TalkBack o VoiceOver. |
| Ancho de teléfono | Vista 375×812 | Se ve completo, sin desbordes | La web no sustituye al teléfono. |
| Tipos | `npx tsc --noEmit` | Salida 0 | — |
| Supabase real y teléfono | — | No ejecutado | Faltan la migración aplicada y la sesión. |

## Cierre y continuación
- Cambios realizados: pantalla de publicar oferta.
- Fallos y pendientes: integrar ubicación, sesión y navegación; probar con Supabase real y en teléfono.
- Siguiente paso: pantalla de listado de ofertas con `useListLoader`, `ListStateView`, `RatingSummary` y `formatDistance`.
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
