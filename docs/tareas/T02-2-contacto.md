# Tarea T02.2: Abrir llamada o WhatsApp con el contacto del anunciante

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), bloque 3 «Contacto».
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: implementada sin verificar en teléfono.
- Dependencias y decisiones: D06 (contacto directo). Q03 decide de dónde sale el número y si se muestra completo; no bloquea esta lógica.

## Resultado
Como vecino que consulta una oferta, puedo abrir el marcador o WhatsApp con el
número del anunciante y, si falta o no se puede abrir, recibo un mensaje con un
siguiente paso, sin que la app registre una contratación.

## Alcance
- Incluye: normalización del número, enlaces `tel:` y `https://wa.me/`, apertura con `Linking` y resultados con mensajes en español.
- Excluye: botones y pantalla de detalle (requieren el contrato de oferta, T02.1, y la navegación de Persona 5), mensaje prellenado y cualquier registro de contacto.
- Archivos: `src/features/services/contact/phone.ts` y `src/features/services/contact/openContact.ts`. No modifica archivos compartidos ni dependencias.

## Decisiones técnicas
- Se usa `https://wa.me/<número>` en lugar de `whatsapp://`. Abre la app si está instalada y el navegador si no lo está, y no requiere declarar esquemas en `app.json`.
- No se usa `canOpenURL`, porque en Android 11+ e iOS exige configurar `app.json`, que es compartido. Se intenta abrir y, si falla, se devuelve `no_disponible`.
- Supuesto pendiente de Q03: si el número llega sin código de país se añade `+51`. Se quita el `0` de larga distancia (p. ej. `01` de Lima) y se acepta el prefijo internacional `00`.
- `abierto` solo indica que el sistema aceptó el enlace; no se guarda nada.

## Aceptación
- Un número local o internacional válido abre el marcador o WhatsApp con el número correcto.
- Sin número, con número inválido o sin app disponible se devuelve un estado con mensaje claro.
- Al volver desde el marcador o WhatsApp la app conserva la pantalla (se comprobará al existir la pantalla de detalle).
- Abrir un contacto no crea registros.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Normalización y enlaces | Script con 18 aserciones ejecutado con Node 22.18 fuera del repositorio | Todas pasan: formatos locales, `+51`, `00`, `01`, otro país, vacío, letras, longitud y doble `+` | El script no se versionó porque el proyecto no tiene marco de pruebas y añadirlo requiere coordinación. |
| Tipos | `npm run typecheck` | Sin errores, salida 0 | — |
| Mensajes de error en pantalla | Pantalla temporal no versionada en navegador (Expo web): campo vacío y `abc123` | Se mostraron `sin_contacto` y `contacto_invalido` con su mensaje | Prueba de una versión anterior idéntica de este código; la web no sustituye al teléfono. |
| Apertura en teléfono | — | No ejecutado | Aún no hay pantalla que llame a `openContact`; requiere Expo Go. |
| Volver a la app | — | No ejecutado | Depende de la pantalla de detalle y de la navegación. |

## Cierre y continuación
- Cambios realizados: utilidades de contacto puras y con `Linking`, sin cambios en archivos compartidos.
- Fallos y pendientes: falta verificar en teléfono; el código de país por defecto depende de Q03; los números fijos de provincia sin prefijo no se distinguen.
- Siguiente paso: conectar `openContact` a los botones del detalle de la oferta cuando T02.1 y la navegación estén acordadas, y verificar en Android con Expo Go, con y sin WhatsApp instalado.
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
