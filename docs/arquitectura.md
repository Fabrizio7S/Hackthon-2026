# Arquitectura de la aplicación

Esta estructura organiza la base `f5264b5` de `refactor/organizacion-proyecto` sin cambiar sus funciones ni su diseño. Se mantiene React Native con componentes funcionales y hooks; no se introduce otro sistema de navegación ni una capa de clases artificial.

## Capas y dependencias

```text
App.tsx
  └─ app/AppRoot
       ├─ autenticación y proveedor de identidad
       └─ app/navigation/SessionRouter
            ├─ formulario de acceso
            └─ app/AuthenticatedApp
                 ├─ layout y pantallas globales
                 ├─ integración de servicios/mapa
                 └─ funcionalidades

app → features → shared
app → shared
app / features → lib
```

`shared` no importa `features` ni `app`. Una funcionalidad no importa la implementación de `app`. Las integraciones que reúnen varias funcionalidades se ubican en `app`. `npm run check:architecture` controla estos límites y detecta ciclos e importaciones locales sin destino.

## Estructura principal

```text
src/
  app/
    AppRoot.tsx
    AuthenticatedApp.tsx
    flows/ServicesFlowScreen.tsx
    hooks/useNeighborhoodMapPoints.ts
    layout/
      NeighborhoodShell.tsx
      CreatePublicationSheet.tsx
      navigationItems.ts
    navigation/
      SessionRouter.tsx
      useNeighborhoodNavigation.ts
      services.routes.ts
      services.tabs.ts
    screens/
      HomeScreen.tsx
      AccountScreen.tsx
  features/
    auth/
      components/   # formulario y bienvenida
      data/         # operaciones de acceso y pruebas
      hooks/        # sesión y estado del formulario
      model/        # observación de sesión y pruebas
      styles/
    profile/
      components/   # panel, formulario de nombre, tarjeta de código y aviso inicial
      data/
      hooks/
      styles/
    community/
      components/   # paneles, formularios, pertenencia y tarjeta de invitación
      data/
      hooks/
      styles/
    services/
      components/   # tarjeta y contenido del detalle
      screens/      # explorar, publicar, editar, propias y detalle
      data/         # API, validación y contratos de ofertas
      model/
      styles/
      contact/      # teléfono y apertura de contacto
      distance/
      form/
      list/
      map/          # adaptación de ofertas al mapa
      rating/
      submit/
    favors/
      actions/      # publicaciones, solicitudes, reseñas y contacto
      components/   # formulario, detalle, actividad y piezas visuales
      data/         # consultas, mapeos, imágenes y operaciones Supabase
      hooks/        # coordinación, carga y gestos de tarjetas
      model/        # tipos, reglas, etiquetas y presentación
      screens/
      styles/
      tests/
    emergencies/
      components/   # SOS, pendientes, ayuda, recursos, grupos y formularios
      screens/      # módulo, alertas, reporte, detalle y apoyo
      data/         # API, mapeos, cola y envío
      hooks/        # carga de recursos y coordinación de cola
      model/        # contratos, errores, reglas y puntos de mapa
      styles/
      tests/
    mapa/
      components/
        web/        # iconos Leaflet y control de cámara web
      screens/      # variantes .native.tsx y .web.tsx
      hooks/
      model/        # sesión de cámara, filtros y selección
      constants/
      data/         # ejemplos
      styles/       # paleta propia conservada y estilos
      utils/
    onboarding/
      components/   # tarjeta del recorrido
      data/         # persistencia por cuenta y pruebas
      hooks/
      model/        # definición de los 18 pasos
  shared/
    identity/       # contratos, contextos y pruebas
    location/       # GPS, permisos y caché de posición de sesión
    navigation/     # nombres de destinos y acciones compartidas
    theme/          # paleta y estilos compartidos
    ui/
      tour/         # marcos, contexto y desplazamiento del recorrido
  lib/supabase.ts
```

No todas las funcionalidades necesitan las mismas subcarpetas. Se conserva la división por tareas que ya funcionaba en Servicios; no se crean directorios vacíos ni un `utils` global donde mezclar lógica de dominios distintos.

## Responsabilidades

- `AppRoot` conserva una única fuente de sesión y el montaje por identidad de usuario.
- `SessionRouter` elige feedback de sesión, acceso o aplicación autenticada. `useAccessForm` conserva el estado del formulario; `useNeighborhoodNavigation` conserva destinos, comunidad activa y coordinación del tutorial.
- `AuthenticatedApp` compone módulos. `AccountScreen` compone perfil y comunidad; `HomeScreen` muestra Inicio. No implementan consultas nuevas ni permisos alternativos.
- `ServicesFlowScreen` está en `app/flows` porque coordina ofertas, mapas, emergencias y recursos. `useNeighborhoodMapPoints` conserva las mismas fuentes de datos y la cancelación de cargas anteriores.
- `useFavorsController` coordina la interacción. `useFavorsData` mantiene carga y datos; `useFavorDeck` conserva animaciones y gestos. Las acciones se agrupan por publicación, solicitudes, reseñas y contacto. Las vistas reciben un modelo tipado, sin crear otra fuente de estado.
- Los paneles de perfil y comunidad presentan datos de sus hooks. Los formularios y tarjetas tienen componentes propios. Las políticas y roles continúan validándose en Supabase.
- Emergencias separa API, cola persistente, coordinación de reintentos y presentación. El SOS conserva su temporizador, origen de ubicación y confirmaciones.
- `shared/location` es usado por mapa y emergencias, evitando que Emergencias dependa de la implementación del mapa.
- El recorrido pertenece a `features/onboarding`. Sus marcos y contenedores genéricos permanecen en `shared/ui/tour` para que las pantallas puedan señalarlos sin importar la implementación del recorrido.
- Los tipos y reglas de Favores están separados de sus ejemplos. Se conservan las claves y estructuras históricas para no alterar solicitudes o mapeos.

## Reglas para próximos cambios

1. Un componente pequeño puede conservar sus estilos locales. Extrae estilos o subcomponentes cuando faciliten lectura o mantenimiento; no fragmentes solo por superar un número de líneas.
2. Mantén el estado en un dueño claro. Mover JSX no debe cambiar las claves, el montaje de pantallas, dependencias de efectos o la identidad de objetos de sesión del mapa.
3. Coloca contratos compartidos en una ubicación neutral; usa `import type` cuando el vínculo solo sirve para TypeScript.
4. No importes pantallas para obtener constantes o tipos. Colócalos en `model`, `data`, `constants` o contratos compartidos, según su responsabilidad.
5. Mantén `.native.tsx` y `.web.tsx` para código de plataforma. Leaflet y sus iconos no se importan desde una variante nativa.
6. No dupliques clientes Supabase ni reemplaces las fuentes de datos al extraer un hook.
7. Conserva las claves de AsyncStorage y los contratos de RPC/tablas. Una reorganización de carpetas no es una migración de datos.
8. Actualiza las pruebas y documentación en el mismo cambio que sus rutas. No retires aserciones para hacer pasar una reorganización.
9. No iguales las dos paletas por apariencia de duplicación: mapas tiene valores y una forma de objeto propios. Se conservaron sus colores.
10. Antes de integrar, ejecuta tipos, pruebas y arquitectura; comprueba web y teléfono en los recorridos afectados.

Las migraciones y los SQL de Supabase no se movieron ni modificaron. Las pruebas de base de datos siguen aisladas mediante PGlite.
