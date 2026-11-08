# Tarea T02.17: Recorrido interno del módulo y punto de entrada público

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), entregable «Recorrido publicar → descubrir → consultar → contactar/calificar», bloque 2 «Mantener coherencia entre lista, mapa y detalle» y bloque 3 «Permitir volver a la app conservando el contexto».
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (`@Fabrizio7S` en GitHub) con agente asignado.
- Estado: implementada; tipos comprobados. Pendiente de verificación en teléfono y conexión en `App.tsx` por Persona 5.
- Dependencias y decisiones: D16–D20; pantallas T02.9–T02.14.

## Resultado
Como vecino, puedo recorrer todo el módulo de servicios y productos desde un
solo componente (`ServicesFlowScreen`): explorar ofertas, abrir el detalle,
volver a la lista (con botón en pantalla o botón físico «Atrás» en Android),
publicar una oferta y gestionar o editar mis propias ofertas manteniendo los
datos sincronizados al volver.

## Alcance
- Incluye:
  - `src/app/flows/ServicesFlowScreen.tsx`: pestañas accesibles (`Explorar`, `Publicar`, `Mis ofertas`), navegación a `OfferDetailScreen` y `EditOfferScreen` con barra superior «← Volver…», soporte para `BackHandler` en Android y recarga al regresar tras cambios confirmados.
  - `src/features/services/index.ts`: exportaciones públicas del módulo para que Persona 5 conecte pantallas y adaptador de mapa desde un único punto.
- Excluye: modificar `App.tsx` (archivo compartido coordinado por Persona 5).
- Archivos: `src/app/flows/ServicesFlowScreen.tsx` y `src/features/services/index.ts`.

## Decisiones técnicas
- Al volver desde `OfferDetailScreen` o `EditOfferScreen`, o al cambiar de pestaña tras publicar/editar, se incrementa `refreshKey` para que `OfferListScreen` y `MyOffersScreen` consulten los datos actualizados.
- Se registra `BackHandler` de React Native únicamente mientras el vecino está en `detalle` o `editar`, para volver a la pestaña de origen sin salir de la aplicación.

## Aceptación
- Tocar una oferta en «Explorar» abre su detalle y «← Volver a ofertas» regresa a la lista recargando los resúmenes.
- Tocar «Editar» en «Mis ofertas» abre `EditOfferScreen` y «← Volver a mis ofertas» regresa a la lista propia recargando los cambios.
- No se modifica `App.tsx` ni otros archivos fuera de `src/features/services/`.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Tipos y exportaciones del módulo | `npx tsc --noEmit` | Salida 0 | Falta probar el recorrido en teléfono con Expo Go y conectar en `App.tsx` con Persona 5. |

## Cierre y continuación
- Cambios realizados: flujo completo `ServicesFlowScreen` y barril público `src/features/services/index.ts`.
- Fallos y pendientes: aplicar la migración en Supabase, conectar con sesión/comunidad (Persona 1) y navegación/mapa/offline (Persona 5), y verificar en teléfono con dos cuentas.
- Siguiente paso: revisar y confirmar commits en la rama `feature/servicios-productos` y abrir PR parcial hacia `main`.
- Propuesta de archivos para git add y mensaje de commit: la indica el agente en el chat; la ejecuta el integrante.
