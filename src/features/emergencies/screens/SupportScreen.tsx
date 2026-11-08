import { TourTarget, TourScrollView, useTourTargets } from '../../../shared/ui/tour/TourTargets';
import { useRef, useState } from 'react';
import { Text } from 'react-native';
import type { EmergenciesApi } from '../data/emergenciesApi';
import type { Result } from '../model/errors';
import type { ResourceState } from '../hooks/useResource';
import { type SupportDirectory } from '../model/types';
import { Banner, Button, StateView, shared } from '../components/ui';
import { ResourcesSection } from '../components/ResourcesSection';
import { GroupsSection } from '../components/GroupsSection';
import { ResourceForm } from '../components/ResourceForm';
import { GroupForm } from '../components/GroupForm';

type Props = {
  api: EmergenciesApi;
  directory: ResourceState<SupportDirectory>;
  onReload: () => void;
  onOpenServices?: () => void;
  onGoToCommunity?: () => void;
};

export function SupportScreen({
  api,
  directory,
  onReload,
  onOpenServices,
  onGoToCommunity,
}: Props) {
  const highlighted = useTourTargets();
  const [busyId, setBusyId] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  // Una acción a la vez; el resultado se confirma releyendo del servidor.
  async function run(
    id: string,
    action: () => Promise<Result<void>>,
    success: string,
  ): Promise<boolean> {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusyId(id);
    setMessage(null);
    const result = await action();
    setMessage(
      result.ok
        ? { tone: 'success', text: success }
        : { tone: 'danger', text: result.error.message },
    );
    onReload();
    busyRef.current = false;
    setBusyId(null);
    return result.ok;
  }

  return (
    <TourScrollView
      style={shared.screen}
      contentContainerStyle={shared.content}
      keyboardShouldPersistTaps="handled"
    >
      {!directory.data &&
        (['support-resources', 'support-groups'] as const).filter(highlighted).map((id) => (
          <TourTarget key={id} id={id} style={shared.card}>
            <Text style={shared.body}>
              Aquí aparecerá el apoyo registrado por tu comunidad cuando la información esté
              disponible. Revisa el estado que se muestra abajo.
            </Text>
          </TourTarget>
        ))}
      <StateView
        state={directory}
        onRetry={onReload}
        onGoToCommunity={onGoToCommunity}
        emptyMessage="No hay información de apoyo para tu comunidad."
      >
        {(data) => (
          <>
            <Text style={shared.title}>Recursos y grupos de apoyo</Text>
            <Text style={shared.subtitle}>
              Solo aparece lo que el representante de tu comunidad registró. Si algo dice
              «demostración», es un ejemplo y no está realmente disponible.
            </Text>

            {message ? <Banner tone={message.tone} text={message.text} /> : null}

            {onOpenServices ? (
              <Button label="Ver servicios vecinales" kind="outline" onPress={onOpenServices} />
            ) : null}

            <ResourcesSection
              resources={data.resources}
              canManage={data.isRepresentative}
              busyId={busyId}
              onToggle={(r) =>
                void run(
                  r.id,
                  () => api.setResourceAvailable(r.id, !r.available),
                  r.available
                    ? 'Marcaste el recurso como no disponible.'
                    : 'Marcaste el recurso como disponible.',
                )
              }
            />
            {data.isRepresentative ? (
              <ResourceForm
                busy={busyId === 'new-resource'}
                onSubmit={(input) =>
                  run('new-resource', () => api.registerResource(input), 'Recurso registrado.')
                }
              />
            ) : null}

            <GroupsSection
              groups={data.groups}
              canManage={data.isRepresentative}
              busyId={busyId}
              onJoin={(g) =>
                void run(
                  g.id,
                  () => (g.joined ? api.leaveGroup(g.id) : api.joinGroup(g.id)),
                  g.joined ? 'Saliste del grupo.' : 'Te uniste al grupo.',
                )
              }
              onToggleActive={(g) =>
                void run(
                  g.id,
                  () => api.setGroupActive(g.id, !g.active),
                  g.active ? 'Grupo pausado.' : 'Grupo activado.',
                )
              }
            />
            {data.isRepresentative ? (
              <GroupForm
                busy={busyId === 'new-group'}
                onSubmit={(input) =>
                  run('new-group', () => api.registerGroup(input), 'Grupo registrado.')
                }
              />
            ) : null}

            {!data.isRepresentative ? (
              <Text style={shared.subtitle}>
                Solo el representante de la comunidad puede registrar recursos y grupos.
              </Text>
            ) : null}
          </>
        )}
      </StateView>
    </TourScrollView>
  );
}
