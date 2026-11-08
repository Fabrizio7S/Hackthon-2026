# Gestión de comunidad y ofertas propias

- Rama `feature/comunidad-servicio-actualización`.
- Responsabilidades G01 y G02. Issue «callejones sin salida» asignado en la conversación.
- Estado: implementado en la rama. Migración y recorrido con cuentas reales pendientes de verificar en el entorno acordado.

| Bloque | Acción y resultado | Implementación |
| --- | --- | --- |
| A | Un vecino confirma «Abandonar comunidad» y la pantalla pasa a `withoutCommunity` al confirmar Supabase. | `CommunityPanel.tsx`, `useCommunity.ts`, `communityService.ts` y `leave_community()`. |
| B | Un representante autorizado confirma una baja y la fila y el contador se actualizan al recibir la confirmación. | `MembersPanel.tsx`, `membersService.ts` y `remove_community_member(uuid)`. |
| C | Un representante autorizado corrige el nombre y la cabecera muestra el valor confirmado. | `CommunityPanel.tsx`, `useCommunity.ts`, `communityService.ts` y `update_community_name(text)`. |
| D | El autor puede editar o retirar desde el detalle. El retiro confirmado quita la oferta del mapa local y vuelve a consultar las ofertas de la pestaña de origen. | `OfferDetailScreen.tsx`, `ServicesFlowScreen.tsx` y la operación existente `setStatus`. |

La [migración](../../supabase/migrations/20261108090000_manage_community.sql) trabaja con las tablas existentes. Adapta el límite del nombre a 1–100 caracteres y reserva el borrado de membresías de la aplicación para las RPC. El listado conserva su respuesta anterior y añade el identificador de destino únicamente para los vecinos que el representante autorizado puede dar de baja.

## Comprobación en teléfono

Tras aplicar la migración en el entorno acordado, usar dos cuentas de prueba de la misma comunidad, una representante y otra vecina.

1. Con la cuenta vecina, abrir Mi comunidad, pulsar «Abandonar comunidad», cancelar y comprobar que sigue la membresía. Repetir y confirmar. Debe aparecer la vista para unirse a una comunidad sin recargar la app.
2. Volver a unir a la cuenta vecina. Con el representante, comprobar que la papelera aparece junto al vecino y que no aparece en la fila propia. Confirmar la baja y comprobar que la fila y el contador cambian. Consultar de nuevo Mi comunidad desde la cuenta vecina para comprobar la ausencia de membresía.
3. Cambiar el nombre con el representante y comprobar el valor nuevo en la cabecera. Probar el rechazo de un nombre vacío. Verificar que la cuenta vecina no dispone de la edición.
4. Publicar una oferta con ubicación. Abrir su detalle desde el mapa, entrar en «Editar» y volver al detalle. Confirmar «Retirar oferta» y comprobar que desaparece del mapa y de Explorar. En Mis ofertas debe figurar retirada. La otra cuenta no debe poder editar ni retirar la oferta del autor.

## Evidencia

- La prueba local con PGlite cubre salida repetida, limpieza del perfil, último representante, roles, autoexpulsión, nómina, reingreso y límites del nombre. Usa un esquema de prueba y no aplica la migración a Supabase remoto.
- La prueba del servicio de integrantes verifica que el identificador necesario para la baja se conserva solo para las filas administrables.
- Pasaron 89 pruebas de `src`, 10 pruebas SQL contando el contenedor de la suite, `npm run typecheck` y la exportación para Android, iOS y web. La exportación web emitió avisos por imágenes referenciadas desde el CSS de Leaflet.
- Queda pendiente repetir los recorridos en teléfono con el proyecto de prueba y comprobar el retiro desde la lista y el mapa con una oferta real.

## Archivos para revisión en Git

- `src/features/community/components/CommunityPanel.tsx`, `MembersPanel.tsx`, `communityService.ts`, `membersService.ts`, `membersService.test.cjs` y `useCommunity.ts`.
- `src/features/services/screens/OfferDetailScreen.tsx` y `ServicesFlowScreen.tsx`.
- `supabase/migrations/20261108090000_manage_community.sql` y `supabase/tests/reconcile_existing_identity.test.cjs`.
- `docs/tareas/gestion-comunidad-y-ofertas.md`.

Mensaje sugerido `feat: gestionar membresías y retirar ofertas desde el detalle`.
