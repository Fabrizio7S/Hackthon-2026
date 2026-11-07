# T00.1 — Inicializar la aplicación

- Grupo: G00, base técnica.
- Responsable: usuario y agente asignado.
- Estado: base técnica verificada por tipos, bundles y navegador; ejecución nativa pendiente.
- Autorización: solicitud explícita del usuario para inicializar React Native.

## Resultado y alcance
Al abrir la aplicación se muestra una pantalla inicial en español sin configurar servicios externos.
Incluye Expo, React Native, TypeScript, scripts, archivo de bloqueo y documentación de ejecución.
Excluye funciones del producto, navegación, Supabase, mapas y persistencia.

## Decisiones técnicas
Registro histórico de la inicialización: las versiones actuales y el ajuste al teléfono están en [T00.2](T00-2-sdk58.md).

- npm como gestor de paquetes; conservar package-lock.json.
- Plantilla oficial blank-typescript 57.0.34. SDK 57 por compatibilidad actual indicada con Expo Go en la documentación oficial.
- Extracción de plantilla sin ejecutar inicialización ni automatizaciones de Git.
- Identificador provisional app-vecinal; nombre definitivo pendiente.

## Aceptación
- Dependencias instaladas y versiones compatibles.
- TypeScript sin errores.
- Bundles de Android, iOS y web generados.
- Pantalla inicial comprobada en navegador; comprobación nativa según dispositivos disponibles.
- Instrucciones actualizadas y sin modificaciones de staging.

## Evidencia observada
| Comprobación | Resultado |
| --- | --- |
| npm install e instalación web compatible con Expo | Dependencias instaladas; package-lock.json generado. |
| npm run typecheck | Sin errores, salida 0. |
| npm exec -- expo install --check | Dependencias al día; ejecutado offline, por lo que se complementó con el comprobador online siguiente. |
| npm exec --yes --package=expo-doctor -- expo-doctor | 21/21 comprobaciones aprobadas con acceso de red. |
| npm run export | Bundles Android e iOS (Hermes) y web generados en dist/. |
| npm start -- --localhost --port 8082 | Metro inicia. En navegador se observa el encabezado “Aplicación vecinal” y “Tu comunidad, más cerca.” |
| npm audit --json | Cuatro avisos moderados en la cadena expo → @expo/fingerprint → glob/minimatch; sin avisos altos o críticos. |

El primer export falló al escribir bytecode en la carpeta temporal restringida del entorno.
Pasó al establecer TEMP y TMP para ese proceso en .expo-bootstrap/tmp dentro del proyecto.
No se cambió la configuración permanente del sistema. El servidor local también requirió
salir del entorno de red restringido para comprobarlo desde el navegador.

Los avisos de npm afectan dependencias de la herramienta. La solución automática propuesta
por npm cambia Expo a otra versión mayor; no se aplicó esa sustitución incompatible.
Queda pendiente revisar la actualización compatible de esa cadena de dependencias.

## Límites y siguiente paso
- No hubo emulador ni herramientas Android accesibles desde PATH. Falta abrir en un dispositivo con Expo Go compatible y comprobar renderizado nativo.
- Los bundles no equivalen a compilar un APK/IPA ni a probar un dispositivo.
- Pantalla de arranque provisional, sin autenticación, navegación, funcionalidades ni conexión a Supabase.
- Antes de G01, resolver las decisiones del modelo inicial; no comenzar ese grupo automáticamente.

## Revisión humana de Git
Revisar los cambios previos del repositorio por separado. Archivos nuevos de inicialización sugeridos para git add: .gitignore, App.tsx, app.json, index.ts, tsconfig.json, package.json, package-lock.json, LICENSE y los seis iconos de assets/.
Revisar también los cambios documentales pertinentes en AGENTS.md, README.md, docs/tecnologia.md, docs/decisiones.md, docs/validacion.md, docs/tareas/README.md y esta ficha.
Mensaje sugerido: `chore: inicializar base React Native con Expo y TypeScript`.
El agente no ejecuta git add, git commit ni git push. La eliminación previa de doc/diseno no pertenece a esta tarea.
