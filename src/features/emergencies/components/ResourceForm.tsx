import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { colors } from '../../../shared/theme';
import { RESOURCE_OPTIONS, type ResourceType } from '../model/types';
import { Button, Chip, shared } from './ui';

export function ResourceForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (input: {
    type: ResourceType;
    name: string;
    place: string;
    detail: string;
    lat: null;
    lng: null;
  }) => Promise<boolean>;
}) {
  const [type, setType] = useState<ResourceType>('agua');
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (name.trim().length < 2) {
      setError('Escribe el nombre del recurso.');
      return;
    }
    setError(null);
    const ok = await onSubmit({
      type,
      name: name.trim(),
      place: place.trim(),
      detail: detail.trim(),
      lat: null,
      lng: null,
    });
    if (ok) {
      setName('');
      setPlace('');
      setDetail('');
    }
  }

  return (
    <View style={shared.card}>
      <Text style={shared.label}>Registrar un recurso (representante)</Text>
      <View style={shared.row}>
        {RESOURCE_OPTIONS.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            icon={o.icon}
            selected={type === o.value}
            onPress={() => setType(o.value)}
          />
        ))}
      </View>
      <TextInput
        style={shared.input}
        value={name}
        onChangeText={setName}
        placeholder="Nombre"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Nombre del recurso"
        maxLength={80}
      />
      <TextInput
        style={shared.input}
        value={place}
        onChangeText={setPlace}
        placeholder="Lugar (referencia)"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Lugar del recurso"
        maxLength={120}
      />
      <TextInput
        style={shared.input}
        value={detail}
        onChangeText={setDetail}
        placeholder="Detalle (horario, cantidad…)"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Detalle del recurso"
        maxLength={200}
      />
      {error ? (
        <Text style={shared.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <Button label="Registrar recurso" onPress={() => void submit()} busy={busy} />
    </View>
  );
}
