# Tarea T02.1: Acordar el contrato de ofertas y sus campos mínimos

- Grupo: G02, servicios, productos, contacto y calificaciones.
- Issue: [#2](https://github.com/Fabrizio7S/Hackthon-2026/issues/2).
- Rama: feature/servicios-productos.
- Responsable humano y agente: Persona 2 (nombre y usuario de GitHub pendientes) con agente asignado.
- Estado: en curso. La propuesta está redactada y falta la revisión del equipo.
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

## Propuesta de contrato (sin aprobar)
Todo este apartado es una propuesta. No es un requisito hasta que el equipo lo
registre en decisiones.md.

### Oferta
| Campo | Tipo propuesto | Regla propuesta | Depende de |
| --- | --- | --- | --- |
| id | uuid | Lo genera el backend. | — |
| client_request_id | uuid | Lo genera el dispositivo para evitar duplicados por doble pulsación o reintento; único por autor. | Q07 |
| community_id | uuid | Comunidad del autor al publicar. | Contrato de comunidad, Q01 |
| author_id | uuid | Usuario de la sesión; no editable. | Contrato de sesión |
| kind | texto | servicio o producto. | Q09 |
| title | texto | Obligatorio, de 3 a 80 caracteres. | — |
| description | texto | Opcional, hasta 500 caracteres. | — |
| contact_phone | texto | Número para llamada y WhatsApp. ¿De la oferta o del perfil? | Q03 |
| location | referencia | Opcional; sin ubicación válida no se muestra distancia. | Contrato de ubicación, Q03 |
| status | texto | activa o retirada. Solo el autor la retira. | Acuerdo de edición y retiro |
| created_at / updated_at | fecha y hora | Los asigna el backend. | — |

### Permisos propuestos (RLS)
- Leer: integrantes de la misma comunidad, y solo ofertas activas salvo las propias.
- Crear: usuario con sesión, como autor y en su propia comunidad.
- Editar y retirar: solo el autor.
- Borrado físico: no se ofrece en la app; retirar cambia el estado.

### Calificaciones
Pendientes de Q04. No se propone esquema hasta conocer escala, quién califica y cuántas veces.

## Preguntas para el equipo
1. Q09: ¿productos y servicios comparten formulario y campos, o los productos necesitan algo más (precio, cantidad, foto)?
2. ¿Hay categorías en la primera entrega? Si las hay, ¿cuál es la lista cerrada?
3. ¿Se muestra un precio o referencia de costo? Los pagos siguen fuera de alcance.
4. Q03: ¿el contacto sale del perfil o se escribe en cada oferta? ¿Se muestra el número completo?
5. ¿Qué campos se pueden editar después de publicar? ¿Una oferta retirada se puede reactivar?
6. Q04: escala de estrellas, quién puede calificar y cuántas veces.
7. Persona 1: nombres de las tablas o vistas de perfil y membresía a las que referenciar.
8. Persona 5: forma del dato de ubicación y del registro de mapa.

## Aceptación
- El equipo revisa la propuesta y registra en decisiones.md los acuerdos y las preguntas que siguen abiertas.
- Personas 1 y 5 confirman las referencias a sesión, comunidad y ubicación.
- Esta ficha queda actualizada con el contrato aprobado o con las diferencias pendientes.

## Verificación observada
| Criterio | Pasos o comando real | Resultado | Límites |
| --- | --- | --- | --- |
| Revisión del equipo | — | No ejecutado | Requiere reunión o comentarios en el issue. |

## Cierre y continuación
- Cambios realizados: ficha creada con propuesta de contrato y preguntas; issue enlazado en el índice.
- Fallos y pendientes: contrato sin aprobar; dependencias de Personas 1 y 5 sin confirmar.
- Siguiente paso: llevar las preguntas al equipo o al issue #2 y registrar las respuestas.
- Propuesta de Git: la indica el agente en el chat; la ejecuta el integrante.
