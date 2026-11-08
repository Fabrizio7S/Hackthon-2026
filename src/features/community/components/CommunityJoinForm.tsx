import { Pressable, Text, TextInput } from 'react-native';
import { colors } from '../../../shared/theme';
import { TourTarget } from '../../../shared/ui/tour/TourTargets';
import { styles } from '../styles/community.styles';
import type { CommunityPanelModel } from '../hooks/useCommunityPanel';

export function CommunityJoinForm({ model }: { model: CommunityPanelModel }) {
  const { community, communityCode, setCommunityCode } = model;

  return (
    <TourTarget id="community-join" style={styles.joinBox}>
      <Text style={styles.label}>Unirme con código de comunidad</Text>
      <Text style={styles.helpText}>
        Si tu representante te compartió el código de invitación de tu sector, ingrésalo aquí:
      </Text>
      <TextInput
        accessibilityLabel="Código de invitación de comunidad"
        style={styles.input}
        value={communityCode}
        maxLength={12}
        autoCapitalize="characters"
        editable={!community.creating}
        placeholder="Ej. B57C03"
        placeholderTextColor={colors.textMuted}
        onChangeText={(val) => setCommunityCode(val.toUpperCase().trim())}
        onSubmitEditing={() => {
          if (communityCode.trim()) {
            void community.joinByCode(communityCode.trim());
          }
        }}
      />
      <Pressable
        style={[
          styles.buttonPrimary,
          (!communityCode.trim() || community.creating) && styles.buttonDisabled,
        ]}
        disabled={!communityCode.trim() || community.creating}
        onPress={() => {
          if (communityCode.trim()) {
            void community.joinByCode(communityCode.trim());
          }
        }}
      >
        <Text style={styles.buttonPrimaryText}>
          {community.creating ? 'Uniéndome…' : 'Unirme a la comunidad'}
        </Text>
      </Pressable>
    </TourTarget>
  );
}
