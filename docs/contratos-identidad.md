# Contratos de identidad y comunidad — entrega G01

API preparada y utilizada por G01 para revisión de personas 2–5. No se ha comunicado ni obtenido aceptación directa de otros integrantes. Esta entrega no declara migraciones aplicadas ni integración funcional de los otros módulos.

Fuentes únicas: `src/shared/identity.ts` (tipos y proyecciones) y `src/shared/IdentityContext.tsx` (lectura/acciones de los contextos). Los servicios existentes reutilizan los mismos tipos de membresía y rol. No copiar definiciones a cada módulo.

## Usuario y sesión

`SessionUser`: `id` UUID de Supabase Auth y `email` opcional, privado del usuario actual. No incluye nombre visible, ubicación ni rol global. El perfil sigue separado según D17. No pasar el correo a publicaciones ni vistas de otros vecinos por usar este contrato.

`useSessionIdentity()` devuelve:

| status | user | Interpretación |
| --- | --- | --- |
| loading | null | Restauración/comprobación pendiente; no montar contenido privado. |
| signedOut | null | Sin sesión; mostrar acceso y desmontar contenido privado. |
| error | null | No se pudo comprobar; `error` contiene mensaje de UI. No usar la identidad anterior. |
| authenticated | SessionUser | Identidad comprobada por el flujo de G01. |

La sesión del SDK y sus tokens permanecen internos a G01. La proyección compartida copia únicamente id/correo y elimina metadatos editables. `toSessionIdentity` no autentica: se invoca desde useAuth después de la comprobación del servidor en observeSession. No construir una identidad de producción a partir de datos simulados o de un formulario.

`useSessionActions()` expone las acciones existentes:

- `retry(): void`: reintenta restauración; el estado vuelve a loading y luego resuelve.
- `signOut(): Promise<boolean>`: true cuando la operación de cierre local confirma; false si está ocupada o falla. No anunciar cierre confirmado si devuelve false. Los errores de acción se muestran en el flujo de acceso existente. No implica cerrar otros dispositivos.

Las acciones se delegan a la fuente de G01; los hooks de contexto no crean clientes, suscripciones o solicitudes nuevas. Un estado authenticated no sustituye RLS ni otras comprobaciones de autorización en backend.

## Comunidad, pertenencia y rol

`Community`: `{ id, name }`. `CommunityMembership` conserva el formato vigente de la RPC: `{ user_id, community_id, community_name, role }`. `CommunityRole` admite únicamente `representative` y `member`. `user_id` siempre corresponde al usuario de la sesión; la comunidad del objeto y de la membresía deben coincidir.

`useCommunityIdentity()` devuelve:

| status | community / membership | Interpretación |
| --- | --- | --- |
| loading | null / null | Consulta pendiente; no usar pertenencia anterior. |
| error | null / null | Fallo de consulta o datos inconsistentes; reintentar sin inventar pertenencia. |
| withoutCommunity | null / null | Consulta confirmada sin membresía. `hasProfile` distingue perfil completo. |
| member | Community / CommunityMembership | Pertenencia propia confirmada. |

Los estados withoutCommunity/member incluyen capacidades de interfaz derivadas de los datos del backend:

- `canCreateCommunity`: solo true sin comunidad, con perfil y autorización administrativa vigente.
- `canInviteNeighbors`: solo true con membresía representante y autorización administrativa vigente.

Estos indicadores sirven para presentar acciones. El servidor vuelve a comprobar actor, pertenencia y permisos en cada operación. No inferir autorización de user_metadata ni permitir al cliente cambiar role. Un representante autorizado que ya pertenece a una comunidad no puede crear una segunda.

`useCommunityActions().refresh(): void` vuelve a consultar la fuente existente; no devuelve una membresía de forma inmediata. Observar el estado del contrato. Un error de escritura independiente no elimina una pertenencia previamente confirmada; el error de acción sigue en el módulo que la solicitó.

El contrato de consulta no devuelve perfiles de integrantes. Para esa pantalla existe una proyección distinta y mínima: nombre visible, rol y marca de fila propia. No usar el acceso al listado para consultar perfiles completos o códigos ajenos.

## Montaje y consumo

Montaje actual:

- App → AuthPanel → SessionIdentityProvider → AuthContent.
- Dentro del contenido autenticado: ProfilePanel y CommunityPanel.
- CommunityPanel → CommunityIdentityProvider → lista de integrantes e invitaciones.

AuthContent y MembersPanel ya usan los contratos. Los providers reciben los valores/acciones de useAuth y useCommunity; mantienen una sola fuente. Los hooks lanzan un error de integración si se usan fuera de su provider. No devuelven un usuario ficticio o una comunidad predeterminada.

Para incorporar rutas de servicios/favores/emergencias, Persona 5 debe mantener sus consumidores dentro de los alcances apropiados. Si mueve los providers, debe mover junto a ellos la fuente existente y conservar una sola instancia; no montar useAuth/useCommunity por pantalla ni abrir otro cliente Supabase.

Ejemplo de lectura dentro de ambos providers:

```tsx
import { useCommunityIdentity, useSessionIdentity } from '../../shared/IdentityContext';

export function ContenidoDelModulo() {
  const session = useSessionIdentity();
  const identity = useCommunityIdentity();

  if (session.status !== 'authenticated' || identity.status !== 'member') {
    return null; // El contenedor del flujo presenta acceso/carga/error.
  }

  const userId = session.user.id;
  const communityId = identity.community.id;
  // Usar estos identificadores en el servicio propio y comprobar permisos en backend.
  // Este ejemplo no implementa un módulo ni habilita operaciones offline.
  return null;
}
```

## Cierre, cambio de cuenta y caché

G01 desmonta las vistas privadas durante comprobación, cierre o cambio de identidad. Los paneles se montan con clave de usuario y, cuando corresponde, comunidad. Las lecturas anteriores se descartan al desmontar o cambiar alcance. El SDK elimina su sesión guardada al confirmar cierre.

Actualmente los perfiles, invitaciones e integrantes solo se mantienen en estado de pantalla; no existe caché privada persistente de esos datos. Los otros módulos deben aislar cualquier futura caché por userId/communityId, cancelar o ignorar resultados antiguos y coordinar la limpieza con Persona 5 antes de montar otra cuenta. Este contrato no incluye todavía un registro global de limpiadores ni demuestra que limpie almacenes que otros módulos creen después.

Q07 sigue pendiente: estos contratos no aprueban alcance offline ni colas de envío. Cargar datos guardados no debe presentarse como actualización confirmada.

## Responsabilidades de recepción

| Persona | Revisión necesaria |
| --- | --- |
| 2 — servicios/productos | Identidad del autor, comunidad del registro y permisos de lectura/escritura de su módulo. |
| 3 — favores | Participantes/autor y comunidad; estados de coordinación siguen dependiendo de Q05. |
| 4 — emergencias | Identidad/comunidad sin asumir que D18 decide la visibilidad global de emergencias; Q06 pendiente. |
| 5 — integración | Ubicación de providers, guardas de rutas, cierre/cambio de usuario y limpieza de futuras cachés. |

Revisión/aceptación de consumidores, aplicación de las cuatro migraciones, asesores del proyecto y pruebas integradas con dos cuentas y una ajena siguen pendientes. La entrega en repositorio no implica que esos pasos estén completados.

## Comprobaciones locales

```powershell
node --test src/shared/identity.test.cjs src/shared/IdentityContext.test.cjs
npm run typecheck
npm run export
```

Doce pruebas nuevas: nueve de proyecciones y tres de contexto usando React/React DOM Server reales. Verifican privacidad, estados sin datos anteriores, pertenencia propia, capacidades, contexto ausente y delegación de acciones. No prueban montaje nativo, ciclo de vida de hooks en teléfono ni Supabase remoto.
