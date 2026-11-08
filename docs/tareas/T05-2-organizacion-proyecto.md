# T05.2 — Organización del proyecto

- Rama: `refactor/organizacion-proyecto`.
- Base: `f5264b54e6d39ca60872c4b6de9eb46e4bfa3ba2`.
- Alcance: separar responsabilidades, actualizar rutas y documentar la estructura, conservando funcionalidades y apariencia.
- Estado: estructura implementada y comprobada mediante tipos, arquitectura, 153 pruebas, comparación de recorridos y exportación de las tres plataformas. Verificación física pendiente.

## Cambios

Separación de raíz y navegación respecto a autenticación; extracción de marca, Inicio, cuenta y menú de publicación; división de Favores en vistas, controladores, datos y acciones; separación de formularios y tarjetas de perfil/comunidades; separación de componentes y hooks de Emergencias; traslado de ubicación a shared; agrupación de identidad, tema y tutorial; extracción de cámara e iconos web del mapa e integración de sus puntos.

Se conservaron los contratos, consultas, RPC, migraciones, claves de almacenamiento, colores, recorridos y los 18 pasos del tutorial. Las dependencias de ejecución no cambiaron. Se declaró PGlite como dependencia de desarrollo para poder ejecutar las pruebas ya existentes y se añadieron comandos reproducibles de pruebas y arquitectura.

## Evidencia

- Suite original: 153 pruebas aprobadas antes y después de las extracciones. No se retiraron aserciones.
- Recorridos comparados en Chrome con la raíz real de ambas versiones y un adaptador de datos controlado: tutorial completo, retroceso, navegación, calificación, favores/guardados/solicitudes, perfil, menú de publicación, cierre/inicio de sesión y creación de comunidad.
- Misma secuencia de operaciones de datos en los recorridos comparados. Se normalizaron las marcas de tiempo generadas por cada ejecución para comparar su contenido.
- 15 capturas de la base y la versión reorganizada comparadas: idénticas píxel por píxel. Incluyen tamaños 390×844, 320×568, 844×390 y 1440×1000.
- Comprobación estática de capas, ciclos e importaciones locales implementada en `scripts/check-architecture.cjs`.

Las cuentas y datos del navegador fueron simulados. No se contactó el backend compartido ni se enviaron reportes reales. Estas comprobaciones no sustituyen probar Android/iOS físico, permisos reales de GPS, lector de pantalla, conectividad real ni dos cuentas reales en Supabase.

## Entrega

La arquitectura vigente está en `docs/arquitectura.md`. Se entrega carpeta de fuentes y parche para revisión, sin `.env`, credenciales, `node_modules`, `.git` ni material temporal de comprobación. No se crean commits ni se hace push desde el agente.

## Comprobaciones finales

| Comando o comprobación | Resultado | Límite |
| --- | --- | --- |
| `npm run typecheck` | Correcto. | No demuestra ejecución física. |
| `npm run check:architecture` | 175 módulos sin imports locales rotos, ciclos ni dependencias inversas entre capas. | Análisis estático de imports/reexports locales declarados. |
| `npm test` | 153 pruebas, 153 aprobadas, cero fallos. | Backend aislado, sin Supabase remoto. |
| `npx expo export --platform all --output-dir .expo-bootstrap/export-organized` | Bundles Android, iOS y web correctos. | `TEMP`/`TMP` dentro de `.expo-bootstrap/tmp`; ejecución sin cargar `.env`. Persisten avisos de recursos CSS de Leaflet heredados de la base. |
| Comparación de navegador | Mismos recorridos y operaciones de datos; 15 capturas idénticas. | Datos y sesión controlados; comparación web. |
| `git diff --check` | Correcto. | No sustituye las pruebas de comportamiento. |

No se modificaron SQL, migraciones, configuración nativa, credenciales ni dependencias de ejecución. El cambio de dependencias corresponde únicamente a declarar PGlite para las pruebas existentes.
