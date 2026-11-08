import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../shared/theme';
import { AppIcon } from '../../../shared/ui/AppIcon';
import { TourTarget } from '../../../shared/ui/tour/TourTargets';
import { styles } from '../styles/profile.styles';
import type { ProfilePanelModel } from '../hooks/useProfileForm';

export function PersonalCodeCard({ model }: { model: ProfilePanelModel }) {
  const { profile, name, copyMessage, copying, displayCode, copyCode } = model;

  return (
    <TourTarget id="profile-code" style={styles.codeWrap}>
      {profile.profile ? (
        <>
          <View style={styles.codeTag}>
            <View style={styles.codeStub}>
              <View style={styles.codeHole} />
              <AppIcon name="key" size={22} color={colors.primaryDeep} />
            </View>
            <View style={styles.codeBody}>
              <Text style={styles.codeLabel}>Tu código vecinal corto</Text>
              <Text selectable style={styles.codeValue}>
                {displayCode}
              </Text>
              <Text style={styles.codeHelp}>
                Fácil de dictar o copiar. Compártelo con tu representante vecinal para unirte a la
                comunidad.
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={[styles.buttonOutline, copying && styles.buttonDisabled]}
            disabled={copying}
            onPress={() => {
              void copyCode();
            }}
          >
            <AppIcon name="copy" size={18} color={colors.primary} weight={2} />
            <Text style={styles.buttonOutlineText}>
              {copying ? 'Copiando…' : 'Copiar código personal'}
            </Text>
          </Pressable>
          {copyMessage && (
            <Text style={styles.copyHelpText} accessibilityLiveRegion="polite">
              {copyMessage}
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.mutedText}>
          Tu código personal aparecerá aquí después de guardar tu perfil.
        </Text>
      )}
    </TourTarget>
  );
}
