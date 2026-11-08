import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { colors } from '../../../shared/theme';
import { GROUP_OPTIONS, type GroupType } from '../model/types';
import { Button, Chip, shared } from './ui';

export function GroupForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (input: { type: GroupType; name: string; description: string }) => Promise<boolean>;
}) {
  const [type, setType] = useState<GroupType>('brigada');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (name.trim().length < 2) {
      setError('Escribe el nombre del grupo.');
      return;
    }
    setError(null);
    const ok = await onSubmit({ type, name: name.trim(), description: description.trim() });
    if (ok) {
      setName('');
      setDescription('');
    }
  }

  return (
    <View style={shared.card}>
      <Text style={shared.label}>Registrar un grupo (representante)</Text>
      <View style={shared.row}>
        {GROUP_OPTIONS.map((o) => (
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
        placeholder="Nombre del grupo"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Nombre del grupo"
        maxLength={80}
      />
      <TextInput
        style={shared.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Descripción"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Descripción del grupo"
        maxLength={200}
      />
      {error ? (
        <Text style={shared.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <Button label="Registrar grupo" onPress={() => void submit()} busy={busy} />
    </View>
  );
}
