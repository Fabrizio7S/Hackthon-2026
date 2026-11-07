# Integrantes de mi comunidad — T01.5

El panel se muestra únicamente cuando hay pertenencia propia confirmada. Presenta nombre visible, rol y marca «tú». No expone identificadores de cuentas ajenas, correos, códigos personales, teléfono, dirección ni coordenadas.

## Acceso

La RPC `get_my_community_members()` no acepta argumentos. El backend resuelve la comunidad desde auth.uid y exige membresía. Un usuario sin comunidad, incluso con invitación pendiente, no consulta el listado. Un miembro de otra comunidad solo recibe su propia comunidad.

La implementación privilegiada se encuentra en `community_internal`, fuera de los esquemas expuestos, con SECURITY DEFINER, search_path vacío y validación del actor antes de consultar. La función pública es SECURITY INVOKER y no tiene permiso de ejecución para PUBLIC/anon. No se cambian las políticas SELECT de perfiles o membresías: siguen restringidas al dueño. La lectura adicional se limita a esta proyección autorizada.

La migración `supabase/migrations/20261107233955_community_members.sql` se aplica después de las tres anteriores, únicamente tras revisar el proyecto correcto. Fue generada con Supabase CLI 3.0.0; no se aplicó en remoto.

## Interfaz y estado

- `membersService.ts` comprueba que la respuesta sea de la comunidad esperada y entrega solo los campos permitidos. La comunidad esperada no se envía como parámetro al servidor.
- `observeMembers` limpia la vista durante carga/error y descarta respuestas o errores después de cancelar. No aborta la solicitud de red ni guarda datos offline.
- `MembersPanel` se monta con clave de usuario y comunidad; ofrece carga, vacío, error y actualización manual. Filas de solo texto, sin navegación al perfil de otra persona.
- Después de aceptar una invitación se consulta pertenencia de nuevo y se remonta la lista. Si el representante actualiza invitaciones y encuentra aceptaciones, se actualizan también los integrantes. No hay Realtime/push; el otro participante debe actualizar o volver a abrir para ver cambios de backend.
- Guardar el perfil ya actualiza la comunidad y su lista. Las lecturas siguientes reflejan nombres confirmados.

## Pruebas

```powershell
node --test src/features/community/membersService.test.cjs
```

Ocho pruebas de servicio/observación: RPC sin comunidad elegida por cliente, proyección mínima, rechazo de otra comunidad/datos malformados, vacío, cancelación de resultado/error, reintento y permisos. Cliente simulado, sin montaje de React.

Con PROFILE_SQL_RUNTIME configurado al PGlite 0.5.15 temporal descrito en `src/features/profile/README.md`:

```powershell
node --test supabase/tests/community_members.test.cjs
```

Ocho casos SQL: antes/después de aceptación, composición igual para ambos participantes, marca propia, privacidad, aislamiento entre comunidades, SELECT de tablas sin ampliar, cambio de nombre y denegación sin identidad/anon. Node cuenta también el contenedor del conjunto: nueve pruebas.

Regresión completa: 46 pruebas de servicio y 38 casos SQL (Node informa 42 contando los cuatro contenedores). Los fixtures de usuarios/Auth corren únicamente en PostgreSQL temporal; no equivalen a Supabase Auth/PostgREST ni teléfono.

## Pendiente de integración

Inspección del esquema, aplicación de las cuatro migraciones y asesores en el proyecto correcto. Verificar el recorrido con dos cuentas reales y una ajena, y en teléfono. No se ha comprobado visualmente esta pantalla privada con una cuenta real. Los contratos para los módulos 2–5 siguen en tarea posterior; los tipos actuales son internos de G01.
