# Tarea: T05.1 — Tutorial guiado de bienvenida e inicio (onboarding en recorrido)

- Grupo: G05 (Integración, navegación, mapas, offline y entrega)
- Responsable humano y agente: Integración G05 / Codex; implementación solicitada por el usuario en el issue #6.
- Estado: implementado en `feature/tutorial-onboarding`; verificación en teléfono físico pendiente.
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
  - `src/features/onboarding/components/OnboardingTour.tsx` (nuevo componente del recorrido guiado)
  - `src/app/layout/NeighborhoodShell.tsx` (integración en cabecera/inicio y disparo del recorrido)
  - `src/app/AppRoot.tsx` (coordinación de sección activa durante el recorrido)
  - `src/features/profile/components/ProfilePanel.tsx` (opción para volver a ver el tutorial)

## Recorrido vigente (18 pasos)

Ampliación solicitada por el usuario después de revisar la primera entrega. La definición compartida vive en `src/features/onboarding/model/steps.ts`.

1. Perfil: nombre visible y guardar.
2. Código personal y copiar.
3. Unirse con código de comunidad.
4. Recibir y aceptar invitaciones.
5. Crear comunidad: perfil, ausencia de otra pertenencia y autorización de representante.
6. Servicios y productos.
7. Mapa y filtros.
8. Cadena de favores y sus pestañas.
9. Botón de publicación.
10. Acceso a Emergencias.
11. Alertas y filtros por estado.
12. Reportar: tipo de problema.
13. Reportar: urgencia.
14. Reportar: descripción.
15. Reportar: privacidad de personas vulnerables.
16. Reportar: ubicación, envío y diferencia entre guardado local y envío confirmado.
17. Apoyo: recursos críticos y disponibilidad.
18. Apoyo: grupos, participación y repetición del recorrido.

Cada paso enmarca en rojo el acceso de navegación y el bloque real explicado. `TourTargets.tsx` comparte el paso activo con las pantallas y acerca automáticamente el bloque dentro de su panel desplazable. Los marcos no interceptan pulsaciones ni cambian los permisos del usuario.

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
| Tipado e integración | `npm run typecheck` | Correcto. | No equivale a ejecución en dispositivo. |
| Bundles de entrega | `npx expo export --platform all --output-dir .expo-bootstrap/export-v2`, con `TEMP` y `TMP` apuntando a `.expo-bootstrap/tmp` | Exportación correcta para Android, iOS y web. | Se usaron carpetas locales nuevas para evitar permisos del temporal y del `dist` anterior. La prueba se ejecutó sin cargar `.env`. |
| Persistencia, cuentas y lecturas atrasadas | `node --test src/features/onboarding/data/onboardingState.test.cjs` | Cuatro pruebas aprobadas: primera vez, reapertura, aislamiento de cuentas, repetición, lectura tardía y reintento de escritura. | Almacenamiento simulado en estas pruebas. |
| Regresión | `node --test` con los archivos `*.test.cjs` de `src` y `supabase/tests` | 143 pruebas aprobadas, cero fallos; PGlite instalado en una carpeta de herramientas externa al proyecto y resuelto mediante `NODE_PATH`. | No contacta Supabase remoto; no se añadieron dependencias al proyecto. |
| Recorrido en navegador | Chrome headless + Playwright, vista aislada con `AuthPanel` y las pantallas reales, usando un adaptador de Supabase de prueba | Aprobados: 18 pasos, marcos rojos, desplazamiento, anterior, finalizar, saltar, repetir, persistencia después de recargar, cuentas distintas, tres pestañas de Emergencias y conservación del formulario al retroceder. Sin errores de ejecución. | Sesión y datos simulados por el adaptador de pruebas; sin conexión al backend real ni envíos de reportes. |
| Adaptación visual | Inspección de capturas en 1440×1000 y 390×844; comprobaciones de viewport en 320×568 y 844×390 | Sin desbordamiento horizontal. Saltar tutorial y la cabecera de Emergencias permanecen accesibles. | Falta comprobar lector de pantalla y escalado de texto en teléfono. |
| Android Atrás | Suscripción a `BackHandler` durante el recorrido; se retira al desmontarlo | Implementado para salir y guardar el recorrido como visto. | Pendiente de ejecución en Android físico. |

## Implementación y límites

- La ayuda usa una tarjeta integrada, con explicación desplazable y controles Anterior/Siguiente siempre visibles. No añade dependencias ni un modal que bloquee la cabecera. Los marcos rojos señalan iconos, campos y bloques de información; el paso de publicación resalta `+` / «Crear publicación». En horizontal la explicación y el contenido se distribuyen en dos columnas.
- «Saltar tutorial» y los controles de avance permanecen fuera del contenido desplazable. Inicio ofrece «Ver recorrido de ayuda». La navegación manual abandona el recorrido; Emergencias tiene además un acceso directo dentro de la tarjeta.
- Se guarda `seen` en `AsyncStorage`, clave `onboarding.v1:<userId>`. Completar y saltar comparten el mismo cierre. Otra cuenta utiliza una clave independiente; una lectura atrasada no reabre un recorrido cerrado.
- Se eligió la alternativa local permitida por el issue. No se modifica `public.perfiles.tutorial_visto`, ni se aplican migraciones. El estado no se sincroniza entre dispositivos; al borrar los datos de la app/navegador el recorrido volverá a aparecer.
- Los fallos de lectura permiten abrirlo manualmente. Los fallos al guardar muestran un aviso con reintento y no bloquean Emergencias.
- El estado de navegación y comunidad se reinicia al cambiar de cuenta para evitar reutilizar el contexto visual de otro usuario.

## Cierre y continuación
- Cambios realizados: recorrido de 18 pasos, marcos rojos y desplazamiento automático, integración con las tres pestañas de Emergencias, explicaciones de comunidad por permisos, persistencia por cuenta, repetición y pruebas.
- Fallos y pendientes: verificar primera sesión real con dos cuentas y el botón físico Atrás en teléfono; comprobar lector de pantalla y tamaño de texto ampliado. No se cierra el issue desde el agente.
- Siguiente paso: abrir esta copia en Expo Go, completar la comprobación física y revisar los archivos antes del commit y push humanos.

## Casos de la ampliación

- Código personal: se enmarca el código real y «Copiar código personal». Si aún no hay perfil guardado, se explica dónde aparecerá, sin inventar un código.
- Unirse/crear: se enmarca el formulario real cuando corresponde. Si la cuenta ya pertenece a una comunidad, no tiene perfil o no tiene autorización, se enmarca una explicación de ese requisito. Nunca se habilita una acción por estar dentro del tutorial.
- Emergencias: el paso controla la pestaña y conserva el formulario de Reportar entre pasos del mismo módulo. Cambiar de pestaña manualmente abandona el recorrido para permitir actuar libremente.
- Ir a Emergencias sale del recorrido y abre Alertas. El acceso de la cabecera sigue disponible durante todos los pasos.
- La explicación no ejecuta acciones de negocio: no crea comunidades, acepta invitaciones, envía reportes ni incorpora a grupos automáticamente.
- Se mantiene la clave local `onboarding.v1:<userId>` para respetar a quienes ya completaron la primera entrega. Pueden abrir la versión ampliada desde Inicio.
