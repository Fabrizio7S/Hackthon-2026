# Tarea: T05.1 — Tutorial guiado de bienvenida e inicio (onboarding en recorrido)

- Grupo: G05 (Integración, navegación, mapas, offline y entrega)
- Responsable humano y agente: Pendiente de asignar
- Estado: pendiente
- Dependencias y decisiones: [producto.md](../producto.md), [recorridos.md](../recorridos.md), Q08 en [decisiones.md](../decisiones.md), columna existente `public.perfiles.tutorial_visto`

## Resultado
Como vecino que abre e inicia sesión en la aplicación por primera vez, puedo seguir un recorrido guiado paso a paso (o saltarlo en cualquier momento y volver a abrirlo desde mi perfil/inicio) para entender cómo unirme a mi comunidad con mi código corto, descubrir servicios/mapa, usar la cadena de favores, publicar con el botón `+` y actuar ante emergencias.

## Alcance
- Incluye:
  - Recorrido interactivo por pasos (tipo *spotlight* / tarjetas de seguimiento sobre las secciones principales de `NeighborhoodShell` y `NeighborhoodHome`).
  - Detección automática de primera vez por cuenta autenticada (respaldada en `AsyncStorage` por `userId` y/o sincronizada con `public.perfiles.tutorial_visto` en Supabase).
  - Controles accesibles en cada paso: «Siguiente», «Anterior», indicador de progreso (`Paso X de N`) y botón visible «Saltar tutorial» / «Entendido».
  - Botón «Ver tutorial de nuevo» accesible desde Inicio o Perfil/Comunidad para repetir el recorrido cuando el vecino lo necesite.
- Excluye:
  - Bloquear el acceso urgente a Emergencias (si ocurre una emergencia, el vecino puede saltar o ir directo al botón de Emergencias).
  - Nuevas dependencias pesadas de terceros si puede resolverse con componentes nativos (`Modal` / vistas superpuestas de React Native).
- Archivos y contratos previstos:
  - `src/shared/OnboardingTour.tsx` (nuevo componente del recorrido guiado)
  - `src/shared/NeighborhoodUI.tsx` (integración en cabecera/inicio y disparo del recorrido)
  - `src/features/auth/AuthPanel.tsx` (coordinación de sección activa durante el recorrido)
  - `src/features/profile/ProfilePanel.tsx` (opción para volver a ver el tutorial)

## Pasos propuestos del recorrido (5 pasos breves)
1. **Tu comunidad y código vecinal (`Perfil / Mi comunidad`):** Cómo compartir tu código corto (`VEC-XXXX-XXXX`) con el representante de tu cuadra para unirte o aceptar invitaciones.
2. **Servicios y productos cercanos (`Servicios`):** Cómo buscar oficios y productos de tus vecinos, ver quién los publicó, contactarlos por llamada/WhatsApp y dejar tu calificación.
3. **Mapa de tu sector (`Mapa`):** Cómo ubicar servicios y ofertas cuadra por cuadra cerca de tu ubicación.
4. **Cadena de favores (`Solidario`):** Cómo pedir prestado, intercambiar objetos o ayudar a un vecino sin dinero de por medio.
5. **Publicar en 3 toques (`+`) y Emergencias (`Emergencias`):** Cómo usar el botón central `+` para compartir algo rápidamente y dónde encontrar alertas, brigadas y recursos críticos en caso de emergencia.

## Aceptación
- Al iniciar sesión por primera vez con una cuenta que no ha completado el tutorial, el recorrido se muestra automáticamente.
- El usuario puede avanzar paso a paso (cambiando o resaltando la sección explicada), retroceder o pulsar «Saltar» en cualquier momento.
- Al finalizar o saltar el tutorial, se guarda el estado (`tutorial_visto` / `AsyncStorage` por usuario) y no vuelve a abrirse solo en futuros inicios de sesión de esa misma cuenta.
- Si inicia sesión otra cuenta distinta en el mismo teléfono que aún no vio el tutorial, sí se le muestra.
- Existe una acción clara («Ver recorrido de ayuda» / «Repetir tutorial») para volver a abrirlo manualmente.
- Botones con área táctil mínima de 44×44 px, textos claros para personas con poca experiencia digital y soporte para el botón físico «Atrás» en Android.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Por verificar | — | No ejecutado | — |

## Cierre y continuación
- Cambios realizados: Ficha de tarea creada.
- Fallos y pendientes: Implementación y verificación en móvil/web pendientes.
- Siguiente paso: Asignar responsable e implementar `OnboardingTour.tsx`.
