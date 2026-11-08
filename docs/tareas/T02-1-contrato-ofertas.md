# Tarea T02.1: Acordar el contrato de ofertas y sus campos mínimos

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2).
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: verificada para campos, teléfono, estrellas y edición (D16–D19, decididos por Persona 2 el 2026-11-07). Siguen abiertos comunidad (Persona 1), ubicación (Persona 5) y offline (Q07).
- Dependencias y decisiones: Q03, Q04, Q07 y Q09 en [decisiones](../decisiones.md). Contratos de sesión y comunidad (Persona 1). Contrato de ubicación y registros de mapa (Persona 5).

## Resultado
Como Persona 2, puedo presentar al equipo un contrato de oferta revisable para
que Personas 1 y 5 confirmen las referencias compartidas y G02 pueda implementar
la publicación sin suponer reglas pendientes.

## Alcance
- Incluye: propuesta de campos, estados y referencias de una oferta; preguntas que la bloquean.
- Excluye: código, migraciones, tablas en Supabase, pantallas y calificaciones implementadas.
- Archivos previstos: esta ficha y la fila G02 de [tareas/README.md](README.md).
- Decisiones bloqueantes: las preguntas listadas abajo.

## Contrato de oferta
Campos, teléfono, estrellas y edición acordados en D16–D19 de
[decisiones](../decisiones.md). Las filas que dependen de Persona 1, Persona 5
o Q07 siguen siendo propuestas. Los límites de longitud son una decisión técnica
de G02 que puede ajustarse.

### Oferta
| Campo | Tipo propuesto | Regla propuesta | Depende de |
| --- | --- | --- | --- |
| id | uuid | Lo genera el backend. | — |
| client_request_id | uuid | Lo genera el dispositivo para evitar duplicados por doble pulsación o reintento; único por autor. | Q07 |
| community_id | uuid | Comunidad del autor al publicar. | Contrato de comunidad, Q01 |
| author_id | uuid | Usuario de la sesión; no editable. | Contrato de sesión |
| kind | texto | servicio o producto, mismos campos; no editable. | D16, D19 |
| title | texto | Obligatorio, de 3 a 80 caracteres. | D16 |
| description | texto | Opcional, hasta 500 caracteres. | D16 |
| contact_phone | texto | Obligatorio; se escribe en la oferta y se muestra completo. | D17 |
| location | referencia | Opcional; sin ubicación válida no se muestra distancia. | D16; forma pendiente de Persona 5 |
| status | texto | activa o retirada. Solo el autor la retira y reactiva. | D19 |
| created_at / updated_at | fecha y hora | Los asigna el backend. | — |

### Permisos (RLS)
- Leer: integrantes de la misma comunidad, y solo ofertas activas salvo las propias. Hasta tener el contrato de comunidad de Persona 1, cualquier usuario con sesión (provisional).
- Crear: usuario con sesión, como autor y en su propia comunidad.
- Editar, retirar y reactivar: solo el autor (D19).
- Borrado físico: no se ofrece en la app; retirar cambia el estado.

### Calificaciones (D18)
- Estrellas enteras de 1 a 5.
- Una calificación por vecino y oferta; puede cambiarla.
- No se califica la propia oferta. Se valida en backend.

## Preguntas abiertas
1. Persona 1: nombres de las tablas o vistas de perfil y membresía a las que referenciar.
2. Persona 5: forma del dato de ubicación y del registro de mapa.
3. Q07: reintentos sin conexión y uso de `client_request_id`.

Resueltas el 2026-11-07 por Persona 2: campos y productos (D16), teléfono (D17), estrellas (D18) y edición/retiro (D19). Precio, categorías y foto quedan fuera de la primera entrega.

## Aceptación
- El equipo revisa la propuesta y registra en decisiones.md los acuerdos y las preguntas que siguen abiertas.
- Personas 1 y 5 confirman las referencias a sesión, comunidad y ubicación.
- Esta ficha queda actualizada con el contrato aprobado o con las diferencias pendientes.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Decisiones del módulo | Respuestas de Persona 2 en la sesión del 2026-11-07 | Registradas como D16–D19 | El resto del equipo aún debe ser informado. |
| Referencias de Personas 1 y 5 | — | No ejecutado | Pendiente de sus contratos. |

## Cierre y continuación
- Cambios realizados: propuesta de contrato; después, decisiones D16–D19 registradas.
- Fallos y pendientes: comunidad, ubicación y Q07 sin confirmar.
- Siguiente paso: crear la migración de ofertas y calificaciones con RLS (T02.7).
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
