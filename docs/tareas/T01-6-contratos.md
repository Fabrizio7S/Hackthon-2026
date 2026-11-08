# T01.6 — Contratos de identidad, sesión y comunidad

- Grupo G01; Persona 1 (nombre/GitHub pendientes), agente Codex.
- Issue: https://github.com/Fabrizio7S/Hackthon-2026/issues/1
- Rama: `feature/accesos-perfiles-comunidades`.
- Estado: contratos preparados y usados en G01; revisión/recepción de consumidores e integración real pendientes.
- Dependencias: T01.1–T01.5, D17–D19.

## Resultado y alcance

Los módulos 2–5 pueden reutilizar tipos y consultar la sesión/identidad y pertenencia desde las fuentes existentes, sin crear clientes ni copias incompatibles de estado. La entrega incluye API de lectura y documentación de integración; no implica aprobación de consumidores ni envío de mensajes a otros integrantes.

G01 modifica `src/shared/identity/contracts.ts`, `src/shared/identity/IdentityContext.tsx`, hooks/paneles de auth y comunidad, y los consumidores existentes de esos contratos. No cambia dependencias, navegación, cliente, backend ni migraciones. La incorporación por personas 2–5 y revisión con Persona 5 quedan pendientes; el usuario autorizó continuar con esta tarea tras identificarla como siguiente paso.

## Aceptación

- Contratos únicos de usuario autenticado, estado de sesión, comunidad, membresía y rol; lectura sin tokens o metadatos de autorización editables.
- Estados explícitos de carga, ausencia y error; durante carga/error no se exponen identidades o membresías anteriores.
- Comunidad y membresía deben corresponder al usuario de la sesión; un dato de otra identidad se rechaza.
- Los paneles existentes consumen los contratos y contextos; no hay nuevas solicitudes independientes ni una segunda fuente de sesión.
- Documentar dónde montar consumidores, cómo reintentar y cómo manejar cierre/cambio de sesión y futuras cachés.
- Una identidad de frontend no sustituye autorización del backend ni concede privilegios de representante.

## Implementación y evidencia

- `identity.ts`: tipos de lectura sin tokens, estados discriminados, rol único, pertenencia y capacidades de interfaz. Se rechazan pertenencias de otra identidad o inconsistentes. Copias mínimas de los datos, sin alias de objetos del SDK.
- `IdentityContext.tsx`: lectura y acciones de las fuentes existentes. No crea solicitudes, suscripciones o clientes; un consumidor sin provider obtiene error de integración y no datos ficticios.
- `useAuth` conserva sesión del SDK interna y publica la proyección de identidad; AuthContent la consume. Las acciones compartidas delegan al cierre/reintento existentes.
- `useCommunity` publica su proyección. CommunityPanel usa ese contrato para mostrar estado/capacidades; MembersPanel obtiene la comunidad y su actualización desde el contexto. Servicios reutilizan tipos únicos de membresía y rol.
- Guía para consumidores, montaje, cierre/cambio de cuenta y futuras cachés en `docs/contratos-identidad.md`. No afirma limpieza de almacenes futuros ni fija Q07.

| Comprobación | Pasos/comando | Resultado | Límite |
| --- | --- | --- | --- |
| Contratos y contextos | `node --test src/shared/identity/contracts.test.cjs src/shared/identity/IdentityContext.test.cjs` | 12 correctas: nueve de proyecciones, tres de contexto | Contextos probados con React/React DOM Server reales; no ciclo de vida nativo ni navegación completa. |
| Regresión de servicios y contratos | `node --test src/features/auth/data/authService.test.cjs src/features/auth/model/observeSession.test.cjs src/features/profile/data/profileService.test.cjs src/features/community/data/communityService.test.cjs src/features/community/data/invitationService.test.cjs src/features/community/data/membersService.test.cjs src/shared/identity/contracts.test.cjs src/shared/identity/IdentityContext.test.cjs` | 58 correctas, código 0 | Servicios con clientes simulados; no Supabase remoto. |
| TypeScript | `npm run typecheck` | Código 0 | Incluye proveedores, consumidores y aliases de tipos. |
| Exportación | `npm run export` fuera del sandbox | Android, iOS y web; código 0 | No demuestra funcionamiento en teléfono. |
| SQL | Sin cambios de esquema en esta tarea | No repetido | Evidencia de 38 casos SQL en T01.5. No se añadieron migraciones. |
| Otros consumidores | No se enviaron mensajes ni se integraron módulos ajenos | Revisión pendiente | No se atribuye aprobación a personas 2–5. |
| Acceso al proyecto compartido | Nueva consulta de proyectos accesibles mediante el conector Supabase | El proyecto configurado en .env sigue sin estar accesible | No se cambió de proyecto ni se ejecutaron consultas de datos o migraciones remotas. |

## Cierre y continuación

La entrega de contratos está disponible en repositorio y usada por G01. Persisten recepción/revisión de los otros responsables, aplicación de las cuatro migraciones, asesores, pruebas remotas con cuentas reales y teléfono. No cerrar el issue principal. No se requieren más decisiones de Q01–Q03 para el flujo implementado.

Para continuar con validación real se necesita acceso al proyecto Supabase exacto de .env. El conector actual no lo tiene; antes de cualquier aplicación hay que inspeccionar esquema/políticas y coordinar cambios compartidos. No pedir ni guardar claves administrativas en código o documentación.

Archivos propuestos para revisión y git add humano:

- `src/shared/identity/contracts.ts`, `src/shared/identity/contracts.test.cjs`, `src/shared/identity/IdentityContext.tsx`, `src/shared/identity/IdentityContext.test.cjs`.
- `src/features/auth/hooks/useAuth.ts`, `src/app/AppRoot.tsx`, `src/features/auth/README.md`.
- `src/features/community/data/communityService.ts`, `src/features/community/hooks/useCommunity.ts`, `src/features/community/components/CommunityPanel.tsx`, `src/features/community/components/MembersPanel.tsx`, `src/features/community/data/membersService.ts`, `src/features/community/README.md`, `src/features/community/MEMBERS.md`.
- `README.md`, `docs/tecnologia.md`, `docs/tareas/README.md`, `docs/tareas/T01-6-contratos.md`, `docs/contratos-identidad.md`.

Mensaje sugerido: `feat(identity): compartir contratos y contextos de sesión y comunidad`.

No se ejecutaron git add, commit, push, despliegues ni cambios remotos. Sin dependencias nuevas.
