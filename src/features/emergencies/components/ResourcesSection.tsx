import { TourTarget } from '../../../shared/ui/tour/TourTargets';
import { Text, View } from 'react-native';
import { formatRelative } from '../model/logic';
import { RESOURCE_OPTIONS, type Resource } from '../model/types';
import { ArchIcon, Badge, Button, shared } from './ui';
import { styles } from '../styles/support.styles';

export function ResourcesSection({
  resources,
  canManage,
  busyId,
  onToggle,
}: {
  resources: Resource[];
  canManage: boolean;
  busyId: string | null;
  onToggle: (r: Resource) => void;
}) {
  return (
    <TourTarget id="support-resources" style={styles.section}>
      <Text style={shared.title}>Recursos críticos</Text>
      {resources.length === 0 ? (
        <View style={shared.card}>
          <Text style={shared.body}>
            Tu comunidad todavía no registró recursos (agua, botiquines, zonas seguras…).
          </Text>
        </View>
      ) : null}
      {resources.map((resource) => {
        const option = RESOURCE_OPTIONS.find((o) => o.value === resource.type);
        return (
          <View key={resource.id} style={shared.card}>
            <View style={shared.row}>
              <ArchIcon
                icon={option?.icon}
                tone={resource.available ? 'success' : 'neutral'}
                size={40}
              />
              <Text style={styles.name}>{resource.name}</Text>
              {resource.isDemo ? (
                <Badge text="Datos de demostración" tone="demo" />
              ) : (
                <Badge
                  text={resource.available ? 'Disponible' : 'No disponible'}
                  tone={resource.available ? 'success' : 'neutral'}
                />
              )}
            </View>
            <Text style={shared.subtitle}>
              {option?.label}
              {resource.place ? ` · ${resource.place}` : ''}
            </Text>
            {resource.detail ? <Text style={shared.body}>{resource.detail}</Text> : null}
            <Text style={shared.subtitle}>
              {resource.isDemo
                ? 'Ejemplo de demostración: no cuentes con este recurso.'
                : `Registrado por ${resource.registeredBy ?? 'el representante'} · actualizado ${formatRelative(resource.updatedAt)}`}
            </Text>
            {canManage ? (
              <Button
                label={resource.available ? 'Marcar no disponible' : 'Marcar disponible'}
                kind="outline"
                busy={busyId === resource.id}
                disabled={busyId !== null}
                onPress={() => onToggle(resource)}
              />
            ) : null}
          </View>
        );
      })}
    </TourTarget>
  );
}
