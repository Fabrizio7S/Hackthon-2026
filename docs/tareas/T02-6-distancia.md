# Tarea T02.6: Calcular y mostrar la distancia a una oferta sin inventarla

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2), criterio de aceptación «No se muestran distancias inventadas si falta ubicación válida».
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: implementada; verificada con pruebas de lógica, sin pantalla ni teléfono.
- Dependencias y decisiones: contrato de ubicación de Persona 5 (aún no publicado) y Q03 (qué ubicación se muestra a otros).

## Resultado
Como vecino que consulta ofertas, veo a qué distancia está cada una («0.4 km»)
solo cuando tanto mi ubicación como la de la oferta son válidas; si falta
alguna, no se muestra ninguna distancia.

## Alcance
- Incluye: validación de coordenadas, distancia en línea recta (haversine) y texto de distancia o `null`.
- Excluye: obtener la ubicación del teléfono y sus permisos, mapa, ordenar o filtrar por cercanía, distancia por calles.
- Archivo: `src/features/services/distance/distance.ts`. No modifica archivos compartidos ni dependencias.

## Decisiones técnicas
- Tipo `Coordinates` con `latitude` y `longitude`, igual que `expo-location`. Provisional: se sustituirá por el contrato de ubicación de Persona 5.
- Se rechazan coordenadas ausentes, no numéricas, fuera de rango y (0, 0), que suele ser un valor por defecto.
- Formato: «A menos de 100 m»; un decimal por debajo de 10 km («0.8 km»); sin decimales desde 10 km («12 km»). El redondeo evita «10.0 km».
- Es distancia en línea recta, no por calles; la pantalla debe presentarla como aproximada si el equipo lo considera necesario.

## Aceptación
- Con dos ubicaciones válidas se obtiene un texto de distancia correcto.
- Si falta alguna ubicación válida se obtiene `null` y la pantalla no muestra distancia.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Cálculo | Script con Node 22.18 fuera del repositorio: Plaza de Armas–Plaza San Martín (Lima) y Lima–Arequipa | 0.780 km y 765.2 km, dentro de los rangos esperados en línea recta | Rangos comprobados frente a valores aproximados conocidos, no con un servicio de mapas. |
| Formato | Mismo script: < 100 m, < 10 km, ≥ 10 km y 9.96 km | «A menos de 100 m», «0.8 km», «765 km» y «10 km» | — |
| Sin ubicación válida | Mismo script: `null`, `undefined`, (0, 0), NaN, Infinity y fuera de rango, en ambos extremos | Siempre `null` | — |
| Tipos | `npx tsc --noEmit` | Salida 0 | — |
| Pantalla y teléfono | — | No ejecutado | No hay pantalla que la use; falta la ubicación real del teléfono (Persona 5). |

## Cierre y continuación
- Cambios realizados: cálculo y formato de distancia que nunca inventa un valor.
- Fallos y pendientes: adaptar al contrato de ubicación de Persona 5; definir con Q03 la precisión de la ubicación pública de las ofertas.
- Siguiente paso: usar `formatDistance` en la tarjeta y el detalle de la oferta, junto a «Zona», cuando exista la ubicación del vecino.
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
