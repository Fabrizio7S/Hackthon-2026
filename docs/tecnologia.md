# Tecnología

## Stack y estado

Stack acordado:
- React Native con Expo.
- TypeScript.
- Supabase para autenticación, datos y archivos cuando corresponda.
- npm con package-lock.json.

Base técnica documentada:
- Expo SDK 58.
- React Native 0.88.1.
- React 19.3.0.
- TypeScript ~6.0.3.

Las versiones instaladas y sus resoluciones se consultan en package.json y
package-lock.json. No actualizar dependencias por iniciativa individual
cuando afecten al equipo.

Entrada: index.ts registra App.tsx.
Configuración de la aplicación: app.json.

App.tsx monta src/app/AppRoot.tsx, que coordina sesión y funcionalidades con el cliente único
de src/lib/supabase.ts. La sesión se persiste en AsyncStorage 2.2.0 en nativo
y mediante el almacenamiento del SDK en web. AppState coordina renovación
en primer plano. La identidad se consulta al servidor antes de mostrar la
vista de sesión; no se implementa acceso privado offline. AsyncStorage no
cifra en reposo. Evidencia y pruebas nativas pendientes en T01.1.

El estado vigente de implementación se registra en tareas/README.md.

## Organización del código

La estructura vigente está documentada en [arquitectura.md](arquitectura.md).

- `src/app/` compone sesión, navegación, pantallas globales e integración entre funcionalidades.
- `src/features/` separa presentación, hooks, modelos y acceso a datos por funcionalidad.
- `src/shared/` contiene interfaz reutilizable, identidad, ubicación, navegación compartida y tema.
- `src/lib/` conserva el cliente único de Supabase.
- `scripts/` contiene comprobaciones de pruebas y arquitectura.

Crear carpetas cuando exista una responsabilidad real. No introducir archivos vacíos ni duplicar clientes, estado o reglas de permisos. La reorganización de T05.2 conserva el comportamiento y las dependencias de ejecución.

## Responsabilidades

- Persona 1 mantiene los contratos de identidad, sesión, perfil y comunidad.
- Personas 2–4 mantienen interfaz, datos, permisos y estados de sus módulos.
- Persona 5 coordina navegación, mapas, offline y contratos compartidos.
- Cambios de contratos requieren coordinación con sus consumidores.
- Cada migración tiene un responsable y un alcance identificable.

## Contratos compartidos

Los contratos de identidad de G01 están en `src/shared/identity/contracts.ts` y
`src/shared/identity/IdentityContext.tsx`, documentados en [contratos-identidad.md](contratos-identidad.md).
Ya los consumen los paneles de acceso/comunidad/integrantes. La revisión y
montaje en los módulos 2–5 sigue pendiente; no crear otra fuente de sesión.

Aspectos que deben coordinar los módulos al integrar:

| Contrato | Aspectos que deben acordarse |
| --- | --- |
| Sesión | Cómo consultar usuario, carga inicial, ausencia y cierre de sesión |
| Comunidad | Identificador, membresía, rol y visibilidad |
| Ubicación | Coordenadas, precisión, origen y datos públicos |
| Registros de mapa | Identificador, tipo, ubicación y destino del detalle |
| Estados | Valores permitidos, actores y transiciones |
| Errores | Validación, permisos, conexión y reintento |
| Offline | Identificador local, pendiente de envío, confirmación y conflicto |

No fijar aquí respuestas de negocio todavía pendientes.
Registrar sus acuerdos en decisiones.md y documentar el contrato junto al código.

## Navegación

- Mantener un registro central coordinado.
- Cada módulo entrega sus pantallas y parámetros.
- Restringir rutas según sesión y permisos.
- Comprobar navegación atrás y retorno desde aplicaciones externas.
- No asumir que ocultar una pantalla protege los datos.
- Elegir la biblioteca de navegación de forma coordinada.

## Supabase y permisos

- Usar el proyecto compartido acordado por el equipo.
- Configurar variables públicas mediante el archivo local de entorno.
- Mantener ejemplos sin credenciales reales.
- No incluir claves secretas o service_role en la app.
- Implementar políticas RLS en tablas expuestas.
- Comprobar acceso con cuentas autorizadas y no autorizadas.
- Validar actores y transiciones en backend.
- Evitar estados incompatibles por operaciones simultáneas.

## Migraciones

- Versionar cambios de esquema mediante migraciones.
- Coordinar nombres y orden antes de aplicarlas.
- No modificar migraciones ya aplicadas por otros integrantes.
- Añadir migraciones nuevas para cambios posteriores.
- No aplicar cambios destructivos sobre datos compartidos sin autorización.
- Documentar configuración adicional que no esté cubierta por migraciones.

Una rama de Git no crea un entorno de Supabase independiente.
Los cambios remotos pueden afectar inmediatamente a todo el equipo.

## Ubicación y mapas

- Elegir la solución compatible con Expo y los dispositivos de prueba.
- Manejar permisos denegados y ubicación no disponible.
- Respetar la privacidad acordada en Q03.
- Compartir registros entre lista, mapa y detalle.
- No inventar distancias cuando falten coordenadas válidas.
- No deducir zonas confirmadas a partir de reportes sin reglas y fuente.

PostGIS es una propuesta pendiente, no una dependencia aprobada.

## Offline y sincronización

Resolver Q07 antes de consolidar modelos dependientes.

Definir:
- Datos consultables sin conexión.
- Operaciones permitidas sin conexión.
- Duración y aislamiento de la caché.
- Identificadores y prevención de duplicados.
- Reintentos y resolución de conflictos.
- Comportamiento al cerrar sesión o cambiar comunidad.

Mostrar la diferencia entre:
- Guardado en el dispositivo.
- Pendiente de envío.
- Enviado y confirmado.
- Error que requiere intervención.

Verificar sincronización desde otra cuenta o dispositivo.
Guardar localmente no demuestra que otro vecino recibió la información.

SQLite es una propuesta pendiente, no una decisión aprobada.

## Dependencias y configuración

Coordinar previamente cambios en:
- package.json y package-lock.json.
- app.json.
- Cliente de Supabase.
- Configuración de navegación.
- Bibliotecas de ubicación, mapas y persistencia.

Seguir la documentación compatible con las versiones elegidas.
No introducir chat, pagos, SMS o IA fuera del alcance aprobado.

## Comprobaciones

Usar los comandos de README.md.

Comprobaciones existentes:
- npm run typecheck
- npm run export

La exportación correcta no sustituye las pruebas de uso.
La versión web no sustituye la verificación nativa.

Registrar:
- Entorno y dispositivo.
- Recorrido comprobado.
- Resultado.
- Errores y limitaciones.
- Evidencia de ambos participantes cuando corresponda.

## Referencias oficiales

- Expo: https://docs.expo.dev/
- Supabase con Expo: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
- Ubicación: https://docs.expo.dev/versions/latest/sdk/location/
- SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- PostGIS: https://supabase.com/docs/guides/database/extensions/postgis
