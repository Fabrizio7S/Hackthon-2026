import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../../../shared/theme';
import { TourTarget } from '../../../shared/ui/tour/TourTargets';
import { styles } from '../styles/profile.styles';
import type { ProfilePanelModel } from '../hooks/useProfileForm';

export function ProfileNameForm({ model }: { model: ProfilePanelModel }) {
  const { profile, name, setName, validation, setValidation, needsName, save } = model;

  return (
    <TourTarget id="profile-name" style={{ gap: 16 }}>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nombre visible para los vecinos</Text>
        {needsName && (
          <Text style={styles.needsName} accessibilityRole="alert">
            Todavía apareces como «Vecino». Escribe tu nombre para que tus vecinos te reconozcan.
          </Text>
        )}
        <TextInput
          accessibilityLabel="Nombre visible"
          value={name}
          style={[styles.input, needsName && styles.inputAttention]}
          editable={!profile.saving}
          autoComplete="name"
          placeholder="Tu nombre completo o de confianza"
          placeholderTextColor={colors.textMuted}
          onChangeText={(value) => {
            setName(value);
            setValidation(null);
            profile.clearSaved();
          }}
          onSubmitEditing={() => {
            void save();
          }}
        />
        {validation && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {validation}
          </Text>
        )}
        {profile.error && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {profile.error}
          </Text>
        )}
        {profile.saved && (
          <View style={styles.successBox}>
            <Text style={styles.successText} accessibilityLiveRegion="polite">
              Perfil guardado con éxito.
            </Text>
          </View>
        )}
      </View>

      <Pressable
        style={[styles.buttonPrimary, profile.saving && styles.buttonDisabled]}
        disabled={profile.saving}
        onPress={() => {
          void save();
        }}
      >
        <Text style={styles.buttonPrimaryText}>
          {profile.saving ? 'Guardando…' : 'Guardar perfil'}
        </Text>
      </Pressable>
    </TourTarget>
  );
}
