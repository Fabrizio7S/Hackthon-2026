# Aplicación vecinal

Reto de El Comercio y UTP: conectar vecinos con productos y servicios cercanos, recomendaciones, ayuda sin dinero y coordinación durante emergencias. Nombre definitivo pendiente. La funcionalidad precede al acabado visual.

## Estado
- Stack acordado: React Native con Expo, TypeScript y Supabase.
- Base técnica con una pantalla inicial en español, sin funciones de producto ni conexión a Supabase.
- Entrada: index.ts registra App.tsx. Configuración: app.json. Nombre provisional.
- Inicialización autorizada; las funciones del producto requieren asignación posterior.

## Instalación y ejecución
Requisitos: Node.js compatible con Expo SDK 58 y npm. Entorno usado: Node 24.17.0 y npm 12.0.1.

```powershell
npm ci
npm start
```

Abre el QR en Expo Go compatible con SDK 58, con el teléfono y el equipo en la misma red. El proyecto se actualizó a SDK 58 para coincidir con la versión instalada por el usuario.

Después de actualizar el SDK, detén Metro con Ctrl+C y reinícialo limpiando la caché:

```powershell
npm start -- --clear
```

| Comando | Resultado |
| --- | --- |
| npm start | Inicia Metro para abrir la app en un dispositivo. |
| npm run android | Inicia y abre en Android; requiere emulador configurado o dispositivo conectado. |
| npm run ios | Abre el simulador iOS; requiere macOS y Xcode. En Windows se puede usar un iPhone con Expo Go compatible. |
| npm run web | Abre la versión web de desarrollo. |
| npm run typecheck | Comprueba TypeScript sin emitir archivos. |
| npm run export | Genera bundles Android, iOS y web en dist/. No publica ni despliega. |

Los iconos son los de la plantilla oficial. No se requieren credenciales para iniciar esta base. No hay todavía pruebas automatizadas de funciones del producto.

## Retomar con cualquier agente
Entrega este mensaje al iniciar una sesión con cualquier agente:

> Lee AGENTS.md, README.md, docs/decisiones.md y docs/tareas/README.md. Identifica la etapa y el grupo activo. Informa acuerdos y bloqueos de la tarea asignada antes de editar. Respeta su alcance, las restricciones de Git y trabaja en una sola tarea.

No supongas que todas las herramientas cargan automáticamente los mismos archivos. Esta entrada explícita permite compartir contexto; no se ha configurado ni probado la carga automática en cada herramienta.

## Contexto
- [Reglas](AGENTS.md)
- [Producto](docs/producto.md)
- [Recorridos](docs/recorridos.md)
- [Diseño](docs/diseno.md)
- [Decisiones y preguntas](docs/decisiones.md)
- [Tecnología](docs/tecnologia.md)
- [Flujo de trabajo](docs/flujo-trabajo.md)
- [Validación](docs/validacion.md)
- [Tareas](docs/tareas/README.md)

