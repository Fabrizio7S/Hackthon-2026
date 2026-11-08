import { Pressable, Text, TextInput } from 'react-native';
import { colors } from '../../../shared/theme';
import { TourTarget } from '../../../shared/ui/tour/TourTargets';
import { styles } from '../styles/community.styles';
import type { CommunityPanelModel } from '../hooks/useCommunityPanel';

export function CommunityCreateForm({ model }: { model: CommunityPanelModel }) {
  const { community, name, setName, validation, setValidation, create } = model;

  return (
    <TourTarget id="community-create" style={styles.createBox}>
      <Text style={styles.label}>O crear una nueva comunidad vecinal</Text>
      <TextInput
        accessibilityLabel="Nombre de la comunidad"
        style={styles.input}
        value={name}
        editable={!community.creating}
        placeholder="Ej. Vecinos Los Álamos"
        placeholderTextColor={colors.textMuted}
        onChangeText={(value) => {
          setName(value);
          setValidation(null);
        }}
        onSubmitEditing={() => {
          void create();
        }}
      />
      {validation && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {validation}
        </Text>
      )}
      <Pressable
        style={[styles.buttonSecondary, community.creating && styles.buttonDisabled]}
        disabled={community.creating}
        onPress={() => {
          void create();
        }}
      >
        <Text style={styles.buttonSecondaryText}>
          {community.creating ? 'Creando…' : 'Crear comunidad vecinal'}
        </Text>
      </Pressable>
    </TourTarget>
  );
}
