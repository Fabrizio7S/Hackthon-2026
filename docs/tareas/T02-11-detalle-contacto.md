# Tarea T02.11: Detalle de la oferta con contacto

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 2 «Implementar detalle de la oferta» y bloque 3 «Contacto».
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: implementada; verificada en navegador con datos y contacto **simulados**. Sin probar con Supabase real ni en teléfono.
- Dependencias y decisiones: D06, D17, D18. Migración [T02.7](T02-7-migracion-ofertas.md) sin aplicar, sesión de Persona 1 y navegación de Persona 5.

## Resultado
Como vecino, abro una oferta y veo su tipo, título, calificación, distancia,
descripción y teléfono, y puedo llamar o escribir por WhatsApp al anunciante.

## Alcance
- Incluye: `OfferDetailScreen` con carga, error y reintento; botones «Llamar» y «WhatsApp» con `openContact` (T02.2); mensaje si el contacto no se puede abrir; aviso si la oferta está retirada.
- Excluye: calificar (siguiente tarea), editar y retirar, botón de volver y registro en la navegación (Persona 5).
- Archivo: `src/features/services/screens/OfferDetailScreen.tsx`.

## Decisiones técnicas
- Reutiliza los estados del listado (T02.4) con un único elemento, para no duplicar carga, error y reintento.
- Una oferta retirada (visible solo para su autor) no muestra contacto.
- Abrir el contacto no guarda nada (issue: «No registrar contratación o servicio completado por abrir un enlace de contacto»).
- La oferta se carga al montar la pantalla; la navegación debe montar una pantalla por oferta.

## Aceptación
- El contacto corresponde al anunciante (criterio del issue).
- Si el contacto no se puede abrir, se muestra un mensaje con un siguiente paso.
- Una oferta inexistente o no visible muestra un mensaje y «Reintentar».

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Detalle | Expo web en el puerto 8082, `App.tsx` temporal no versionado con **datos simulados** | Tipo, título, «★ 4.8 (32)», «0.8 km», descripción y «+51987654321»; botones `button "Llamar"` y `button "WhatsApp"` | Datos simulados. |
| Contacto correcto | Pulsar «Llamar» y «WhatsApp» con contacto simulado | Ambos recibieron `+51987654321`, el teléfono de la oferta | No se abrió el marcador ni WhatsApp reales. |
| App no disponible | WhatsApp simulado como no disponible | «No se pudo abrir la aplicación en este teléfono…» | — |
| Oferta retirada | Cambiar a una oferta con estado `retirada` | «Esta oferta fue retirada y no está disponible.», sin botones de contacto | — |
| Oferta inexistente | Cambiar a un id sin oferta | «Esta oferta ya no está disponible.» con «Reintentar» | — |
| Tipos | `npx tsc --noEmit` | Salida 0 | — |
| Volver a la app | — | No ejecutado | Requiere teléfono y navegación (issue, bloque 3). |

## Cierre y continuación
- Cambios realizados: pantalla de detalle con contacto.
- Fallos y pendientes: probar en teléfono que se abre el marcador o WhatsApp y que al volver se conserva la pantalla; datos reales.
- Siguiente paso: calificar con estrellas en el detalle (issue, bloque 4).
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
