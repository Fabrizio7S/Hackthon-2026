import { TourTarget } from '../../../shared/ui/tour/TourTargets';
import { Text, View } from 'react-native';
import { GROUP_OPTIONS, type SupportGroup } from '../model/types';
import { ArchIcon, Badge, Button, shared } from './ui';
import { styles } from '../styles/support.styles';

export function GroupsSection({
  groups,
  canManage,
  busyId,
  onJoin,
  onToggleActive,
}: {
  groups: SupportGroup[];
  canManage: boolean;
  busyId: string | null;
  onJoin: (g: SupportGroup) => void;
  onToggleActive: (g: SupportGroup) => void;
}) {
  return (
    <TourTarget id="support-groups" style={styles.section}>
      <Text style={shared.title}>Grupos de apoyo</Text>
      {groups.length === 0 ? (
        <View style={shared.card}>
          <Text style={shared.body}>
            Tu comunidad todavía no registró grupos (brigadas, ollas comunes, oficios).
          </Text>
        </View>
      ) : null}
      {groups.map((group) => {
        const option = GROUP_OPTIONS.find((o) => o.value === group.type);
        return (
          <View key={group.id} style={shared.card}>
            <View style={shared.row}>
              <ArchIcon icon={option?.icon} tone="danger" size={40} />
              <Text style={styles.name}>{group.name}</Text>
              <Badge
                text={group.active ? 'Activo' : 'Pausado'}
                tone={group.active ? 'success' : 'neutral'}
              />
              {group.isDemo ? <Badge text="Datos de demostración" tone="demo" /> : null}
            </View>
            <Text style={shared.subtitle}>
              {option?.label} · {group.members} integrante{group.members === 1 ? '' : 's'}
            </Text>
            {group.description ? <Text style={shared.body}>{group.description}</Text> : null}
            {!group.isDemo ? (
              <Text style={shared.subtitle}>
                Registrado por {group.registeredBy ?? 'el representante'}
              </Text>
            ) : null}
            <View style={shared.row}>
              {group.active || group.joined ? (
                <Button
                  label={group.joined ? 'Salir del grupo' : 'Unirme'}
                  kind={group.joined ? 'outline' : 'primary'}
                  busy={busyId === group.id}
                  disabled={busyId !== null}
                  onPress={() => onJoin(group)}
                />
              ) : null}
              {canManage ? (
                <Button
                  label={group.active ? 'Pausar grupo' : 'Activar grupo'}
                  kind="outline"
                  disabled={busyId !== null}
                  onPress={() => onToggleActive(group)}
                />
              ) : null}
            </View>
          </View>
        );
      })}
    </TourTarget>
  );
}
