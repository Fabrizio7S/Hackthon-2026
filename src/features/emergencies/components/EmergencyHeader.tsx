import { Text, View } from 'react-native';
import {
  CATEGORY_OPTIONS,
  LEVEL_OPTIONS,
  STATUS_LABELS,
  type EmergencyDetail,
} from '../model/types';
import { ArchIcon, Badge, shared } from './ui';
import { STATUS_TONE } from '../model/presentation';
import { styles } from '../styles/detail.styles';

export function locationNote(detail: EmergencyDetail): string {
  if (detail.restricted) return 'Ubicación aproximada por privacidad.';
  if (detail.locationOrigin === 'zona_comunidad')
    return 'Aproximada: se usó el centro de la zona de la comunidad.';
  if (detail.locationOrigin === 'dispositivo') return 'Tomada del dispositivo de quien reportó.';
  return 'No se sabe cómo se obtuvo esta ubicación.';
}

export function Header({ detail }: { detail: EmergencyDetail }) {
  const category = CATEGORY_OPTIONS.find((c) => c.value === detail.category);
  const level = LEVEL_OPTIONS.find((l) => l.value === detail.level);
  return (
    <View style={shared.card}>
      <View style={[shared.row, { gap: 12 }]}>
        <ArchIcon icon={category?.icon} />
        <Text style={styles.heading}>{category?.label}</Text>
      </View>
      <View style={shared.row}>
        <Badge text={STATUS_LABELS[detail.status]} tone={STATUS_TONE[detail.status]} />
        <Badge
          text={`Urgencia ${level?.label.toLowerCase()}`}
          tone={
            detail.level === 'critica' ? 'danger' : detail.level === 'alta' ? 'warning' : 'neutral'
          }
        />
        {detail.vulnerable ? <Badge text="Persona vulnerable" tone="warning" /> : null}
        {detail.mine ? <Badge text="Tu reporte" tone="neutral" /> : null}
        {detail.isDemo ? <Badge text="Datos de demostración" tone="demo" /> : null}
      </View>
      {detail.isDemo ? (
        <Text style={shared.subtitle}>Es un ejemplo de demostración, no una emergencia real.</Text>
      ) : null}
    </View>
  );
}
