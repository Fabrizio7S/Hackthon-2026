import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../../shared/theme';
import type { EmergenciesApi } from './emergenciesApi';
import type { Result } from './errors';
import type { ResourceState } from './hooks';
import { formatRelative } from './logic';
import {
  GROUP_OPTIONS,
  RESOURCE_OPTIONS,
  type GroupType,
  type Resource,
  type ResourceType,
  type SupportDirectory,
  type SupportGroup,
} from './types';
import { Badge, Banner, Button, Chip, StateView, shared } from './ui';

type Props = {
  api: EmergenciesApi;
  directory: ResourceState<SupportDirectory>;
  onReload: () => void;
  onOpenServices?: () => void;
  onGoToCommunity?: () => void;
};

export function SupportScreen({ api, directory, onReload, onOpenServices, onGoToCommunity }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  // Una acción a la vez; el resultado se confirma releyendo del servidor.
  async function run(id: string, action: () => Promise<Result<void>>, success: string): Promise<boolean> {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusyId(id);
    setMessage(null);
    const result = await action();
    setMessage(result.ok ? { tone: 'success', text: success } : { tone: 'danger', text: result.error.message });
    onReload();
    busyRef.current = false;
    setBusyId(null);
    return result.ok;
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.content} keyboardShouldPersistTaps="handled">
      <StateView
        state={directory}
        onRetry={onReload}
        onGoToCommunity={onGoToCommunity}
        emptyMessage="No hay información de apoyo para tu comunidad."
      >
        {data => (
          <>
            <Text style={shared.title}>Recursos y grupos de apoyo</Text>
            <Text style={shared.subtitle}>
              Solo aparece lo que el representante de tu comunidad registró. Si algo dice «demostración», es un ejemplo y no
              está realmente disponible.
            </Text>

            {message ? <Banner tone={message.tone} text={message.text} /> : null}

            {onOpenServices ? (
              <Button label="Ver servicios vecinales" kind="outline" onPress={onOpenServices} />
            ) : null}

            <ResourcesSection
              resources={data.resources}
              canManage={data.isRepresentative}
              busyId={busyId}
              onToggle={(r) => void run(r.id, () => api.setResourceAvailable(r.id, !r.available),
                r.available ? 'Marcaste el recurso como no disponible.' : 'Marcaste el recurso como disponible.')}
            />
            {data.isRepresentative ? (
              <ResourceForm busy={busyId === 'new-resource'} onSubmit={input =>
                run('new-resource', () => api.registerResource(input), 'Recurso registrado.')} />
            ) : null}

            <GroupsSection
              groups={data.groups}
              canManage={data.isRepresentative}
              busyId={busyId}
              onJoin={g => void run(g.id, () => (g.joined ? api.leaveGroup(g.id) : api.joinGroup(g.id)),
                g.joined ? 'Saliste del grupo.' : 'Te uniste al grupo.')}
              onToggleActive={g => void run(g.id, () => api.setGroupActive(g.id, !g.active),
                g.active ? 'Grupo pausado.' : 'Grupo activado.')}
            />
            {data.isRepresentative ? (
              <GroupForm busy={busyId === 'new-group'} onSubmit={input =>
                run('new-group', () => api.registerGroup(input), 'Grupo registrado.')} />
            ) : null}

            {!data.isRepresentative ? (
              <Text style={shared.subtitle}>Solo el representante de la comunidad puede registrar recursos y grupos.</Text>
            ) : null}
          </>
        )}
      </StateView>
    </ScrollView>
  );
}

function ResourcesSection({ resources, canManage, busyId, onToggle }: {
  resources: Resource[]; canManage: boolean; busyId: string | null; onToggle: (r: Resource) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={shared.title}>Recursos críticos</Text>
      {resources.length === 0 ? (
        <View style={shared.card}>
          <Text style={shared.body}>Tu comunidad todavía no registró recursos (agua, botiquines, zonas seguras…).</Text>
        </View>
      ) : null}
      {resources.map(resource => {
        const option = RESOURCE_OPTIONS.find(o => o.value === resource.type);
        return (
          <View key={resource.id} style={shared.card}>
            <View style={shared.row}>
              <Text style={styles.name}>{option?.symbol} {resource.name}</Text>
              {resource.isDemo ? (
                <Badge text="Datos de demostración" tone="demo" />
              ) : (
                <Badge text={resource.available ? 'Disponible' : 'No disponible'} tone={resource.available ? 'success' : 'neutral'} />
              )}
            </View>
            <Text style={shared.subtitle}>{option?.label}{resource.place ? ` · ${resource.place}` : ''}</Text>
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
    </View>
  );
}

function GroupsSection({ groups, canManage, busyId, onJoin, onToggleActive }: {
  groups: SupportGroup[]; canManage: boolean; busyId: string | null;
  onJoin: (g: SupportGroup) => void; onToggleActive: (g: SupportGroup) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={shared.title}>Grupos de apoyo</Text>
      {groups.length === 0 ? (
        <View style={shared.card}>
          <Text style={shared.body}>Tu comunidad todavía no registró grupos (brigadas, ollas comunes, oficios).</Text>
        </View>
      ) : null}
      {groups.map(group => {
        const option = GROUP_OPTIONS.find(o => o.value === group.type);
        return (
          <View key={group.id} style={shared.card}>
            <View style={shared.row}>
              <Text style={styles.name}>{option?.symbol} {group.name}</Text>
              <Badge text={group.active ? 'Activo' : 'Pausado'} tone={group.active ? 'success' : 'neutral'} />
              {group.isDemo ? <Badge text="Datos de demostración" tone="demo" /> : null}
            </View>
            <Text style={shared.subtitle}>{option?.label} · {group.members} integrante{group.members === 1 ? '' : 's'}</Text>
            {group.description ? <Text style={shared.body}>{group.description}</Text> : null}
            {!group.isDemo ? (
              <Text style={shared.subtitle}>Registrado por {group.registeredBy ?? 'el representante'}</Text>
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
    </View>
  );
}

function ResourceForm({ busy, onSubmit }: { busy: boolean; onSubmit: (input: { type: ResourceType; name: string; place: string; detail: string; lat: null; lng: null }) => Promise<boolean> }) {
  const [type, setType] = useState<ResourceType>('agua');
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (name.trim().length < 2) { setError('Escribe el nombre del recurso.'); return; }
    setError(null);
    const ok = await onSubmit({ type, name: name.trim(), place: place.trim(), detail: detail.trim(), lat: null, lng: null });
    if (ok) { setName(''); setPlace(''); setDetail(''); }
  }

  return (
    <View style={shared.card}>
      <Text style={shared.label}>Registrar un recurso (representante)</Text>
      <View style={shared.row}>
        {RESOURCE_OPTIONS.map(o => (
          <Chip key={o.value} label={`${o.symbol} ${o.label}`} selected={type === o.value} onPress={() => setType(o.value)} />
        ))}
      </View>
      <TextInput style={shared.input} value={name} onChangeText={setName} placeholder="Nombre" placeholderTextColor={colors.textMuted} accessibilityLabel="Nombre del recurso" maxLength={80} />
      <TextInput style={shared.input} value={place} onChangeText={setPlace} placeholder="Lugar (referencia)" placeholderTextColor={colors.textMuted} accessibilityLabel="Lugar del recurso" maxLength={120} />
      <TextInput style={shared.input} value={detail} onChangeText={setDetail} placeholder="Detalle (horario, cantidad…)" placeholderTextColor={colors.textMuted} accessibilityLabel="Detalle del recurso" maxLength={200} />
      {error ? <Text style={shared.errorText} accessibilityRole="alert">{error}</Text> : null}
      <Button label="Registrar recurso" onPress={() => void submit()} busy={busy} />
    </View>
  );
}

function GroupForm({ busy, onSubmit }: { busy: boolean; onSubmit: (input: { type: GroupType; name: string; description: string }) => Promise<boolean> }) {
  const [type, setType] = useState<GroupType>('brigada');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (name.trim().length < 2) { setError('Escribe el nombre del grupo.'); return; }
    setError(null);
    const ok = await onSubmit({ type, name: name.trim(), description: description.trim() });
    if (ok) { setName(''); setDescription(''); }
  }

  return (
    <View style={shared.card}>
      <Text style={shared.label}>Registrar un grupo (representante)</Text>
      <View style={shared.row}>
        {GROUP_OPTIONS.map(o => (
          <Chip key={o.value} label={`${o.symbol} ${o.label}`} selected={type === o.value} onPress={() => setType(o.value)} />
        ))}
      </View>
      <TextInput style={shared.input} value={name} onChangeText={setName} placeholder="Nombre del grupo" placeholderTextColor={colors.textMuted} accessibilityLabel="Nombre del grupo" maxLength={80} />
      <TextInput style={shared.input} value={description} onChangeText={setDescription} placeholder="Descripción" placeholderTextColor={colors.textMuted} accessibilityLabel="Descripción del grupo" maxLength={200} />
      {error ? <Text style={shared.errorText} accessibilityRole="alert">{error}</Text> : null}
      <Button label="Registrar grupo" onPress={() => void submit()} busy={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
});
