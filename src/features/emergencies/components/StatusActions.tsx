import { Text, View } from 'react-native';
import { nextStatuses, type StatusAction } from '../model/logic';
import { type EmergencyDetail } from '../model/types';
import { Banner, Button, shared } from './ui';

export function StatusActions({
  detail,
  busy,
  pendingConfirm,
  onChoose,
  onConfirm,
  onCancel,
}: {
  detail: EmergencyDetail;
  busy: boolean;
  pendingConfirm: StatusAction | null;
  onChoose: (action: StatusAction) => void;
  onConfirm: (action: StatusAction) => void;
  onCancel: () => void;
}) {
  const actions = nextStatuses(detail.status, detail.canManage);
  if (actions.length === 0) {
    return <Banner tone="success" text="Este reporte está cerrado. No se puede reabrir." />;
  }
  return (
    <View style={shared.card}>
      <Text style={shared.label}>Atender o cerrar</Text>
      <Text style={shared.subtitle}>
        Puedes hacerlo porque reportaste esto o representas a la comunidad.
      </Text>
      {pendingConfirm ? (
        <View style={shared.card}>
          <Text style={shared.body}>{pendingConfirm.confirm}</Text>
          <View style={shared.row}>
            <Button label="Sí, confirmar" onPress={() => onConfirm(pendingConfirm)} busy={busy} />
            <Button label="Cancelar" kind="outline" onPress={onCancel} disabled={busy} />
          </View>
        </View>
      ) : (
        <View style={shared.row}>
          {actions.map((action) => (
            <Button
              key={action.to}
              label={action.label}
              kind={action.to === 'solucionado' ? 'primary' : 'outline'}
              onPress={() => onChoose(action)}
              disabled={busy}
            />
          ))}
        </View>
      )}
    </View>
  );
}
