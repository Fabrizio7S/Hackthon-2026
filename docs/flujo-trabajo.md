# Flujo de trabajo

## Organización propuesta
Una copia del repositorio por integrante, rama por tarea y una persona integradora; falta confirmar responsables (Q10). Evitar varios agentes editando simultáneamente la misma carpeta.

Solo un grupo funcional activo para el equipo y una tarea por agente. Tareas paralelas dentro del grupo requieren asignación expresa y archivos/responsabilidades separados. Cambios de navegación, dependencias, esquema y contratos compartidos se coordinan primero. No se delega por iniciativa del agente.

## Arranque
1. Leer entrada y estado; revisar git status --short y archivos pertinentes sin alterar staging.
2. Identificar grupo, tarea asignada, responsable y dependencias.
3. Acordar acción del usuario, resultado, archivos, exclusiones y aceptación.
4. Resolver decisiones bloqueantes; avanzar solo partes independientes autorizadas.
5. Implementar únicamente cuando la etapa y la instrucción del equipo lo permitan.

## Cierre
1. Ejecutar comprobaciones pertinentes existentes y el recorrido con ambos participantes cuando aplique.
2. Revisar diff sin alterar trabajo ajeno.
3. Registrar cambios, evidencia, límites y siguiente paso en la ficha.
4. Sugerir al humano archivos concretos para git add y mensaje de git commit. No ejecutarlos ni ejecutar git push.
5. La persona integradora combina y verifica el grupo antes de activar otro.

## Continuidad
Las fichas guardan progreso; decisiones.md guarda acuerdos y AGENTS.md reglas globales. No mantener copias contradictorias por herramienta. Otra sesión debe retomar sin el historial del chat.

Un grupo se cierra al verificar sus tareas y recorrido conjunto, o al aprobar el equipo un alcance menor registrando pendientes. No ocultar fallos ni presentar éxito de compilación como prueba del recorrido.

## Referencias metodológicas
- [Learn Harness Engineering](https://walkinglabs.github.io/learn-harness-engineering/es/): contexto local, instrucciones breves y continuidad.
- [Anthropic: Effective harnesses](https://www.anthropic.com/research/effective-harnesses-for-long-running-agents): trabajo incremental y evidencia.

Sugerencias externas de commits automáticos o ciclos autónomos no sustituyen las restricciones de Git ni la asignación acordada del proyecto.
