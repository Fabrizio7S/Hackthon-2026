# Tarea T02.7: Migración de ofertas y calificaciones con permisos (RLS)

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 5 «Datos e integración» y bloque 4 «Calificaciones» (validación en backend).
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: implementada y verificada en un PostgreSQL local (PGlite); **no aplicada** al proyecto compartido de Supabase.
- Dependencias y decisiones: D16–D19. Comunidad de Persona 1 y ubicación de Persona 5 pendientes (provisionales en la migración).

## Resultado
Como vecino con sesión, puedo publicar, editar, retirar y reactivar mis ofertas
y calificar con 1 a 5 estrellas las de otros; la base de datos impide modificar
ofertas ajenas, calificar dos veces o calificar la propia oferta.

## Alcance
- Incluye: tablas `service_offers` y `service_offer_ratings`, vista `service_offer_rating_summary`, restricciones, disparadores y políticas RLS.
- Excluye: aplicar la migración en el proyecto remoto, límite por comunidad, consultas desde la app y pantallas.
- Archivo: `supabase/migrations/20261107233000_g02_service_offers.sql`. Es la primera carpeta `supabase/` del repositorio.

## Decisiones técnicas
- Prefijo `service_` en tablas y funciones para no chocar con otros módulos.
- `author_id` y `rater_id` toman `auth.uid()` por defecto y las políticas impiden usar otro usuario.
- No se puede cambiar id, autor, tipo, comunidad ni fecha de creación (disparador); `updated_at` es automático.
- Sin borrado: no hay permiso DELETE; retirar cambia `status`.
- `client_request_id` es único por autor para el futuro manejo de reintentos (Q07).
- Calificaciones solo sobre ofertas activas, visibles y no propias; la clave primaria (oferta, vecino) impide duplicados. Esta restricción a ofertas activas es una decisión técnica: con una oferta retirada no se puede calificar ni cambiar la nota.
- La vista del resumen usa `security_invoker`, así que respeta los permisos de quien consulta.
- `anon` (sin sesión) no tiene acceso.
- **Provisional:** cualquier usuario con sesión lee ofertas activas. Falta limitar a la comunidad cuando Persona 1 publique su tabla de membresía; se hará en una migración nueva. `community_id` no tiene clave foránea todavía.
- **Provisional:** ubicación como `latitude`/`longitude` hasta el contrato de Persona 5.
- Las calificaciones individuales son visibles para quien ve la oferta. Si el equipo prefiere ocultar quién calificó, se cambiará en otra migración.

## Aceptación
- A publica y B ve la oferta; B no puede editarla, retirarla ni borrarla.
- Una oferta retirada deja de verse para otros y su autor puede reactivarla.
- Un vecino califica una vez de 1 a 5, puede cambiar su nota y no califica su propia oferta.
- Promedio y cantidad coinciden con las calificaciones.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Migración y permisos | Script con PGlite 0.2.17 (PostgreSQL en Node) fuera del repositorio. Simula `auth.users`, `auth.uid()` y los roles `anon` y `authenticated`; usuarios A, B y C | 31 de 31 comprobaciones pasan: publicar, suplantación, validaciones, duplicados, edición ajena, borrado, calificar, doble calificación, propia oferta, resumen 3.50/2, retiro, reactivación y acceso sin sesión | La simulación no es Supabase: no prueba la API REST, los JWT reales ni la configuración del proyecto remoto. |
| Proyecto remoto | — | No ejecutado | La migración no se aplicó: el proyecto es compartido y requiere coordinación. |

## Cómo aplicarla (cuando el equipo lo acuerde)
1. Confirmar con el equipo el orden de migraciones y que nadie más usa estos nombres.
2. En Supabase, SQL Editor, pegar el contenido del archivo y ejecutarlo una sola vez.
3. Comprobar en Table Editor que aparecen las dos tablas y la vista, con RLS activado.

## Cierre y continuación
- Cambios realizados: esquema y permisos de ofertas y calificaciones.
- Fallos y pendientes: aplicar en el proyecto remoto; limitar por comunidad; adaptar ubicación.
- Siguiente paso: capa de datos en la app (consultas a estas tablas con el cliente de Supabase) y formulario de publicar.
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
