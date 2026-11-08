import * as Clipboard from 'expo-clipboard';
import { Pressable, Text, TextInput, View } from 'react-native';
import { MembersPanel } from './MembersPanel';
import { styles } from '../styles/community.styles';
import type { CommunityPanelModel } from '../hooks/useCommunityPanel';

export function CommunityMembership({ model }: { model: CommunityPanelModel }) {
  const {
    community,
    identity,
    name,
    newName,
    setNewName,
    confirmLeave,
    setConfirmLeave,
    copiedInvite,
    setCopiedInvite,
    validation,
    setValidation,
    membersVersion,
    saveName,
    client,
    userId,
    refreshVersion,
  } = model;
  if (identity.status !== 'member') return null;
  return (
    <View style={styles.memberBox}>
      <View style={styles.plaque}>
        <View style={styles.plaqueInner}>
          <Text style={styles.plaqueEyebrow}>COMUNIDAD VECINAL</Text>
          <Text style={styles.communityName}>{identity.community.name}</Text>
          <Text style={styles.roleDescription}>
            {identity.membership.role === 'representative'
              ? 'Eres el representante vecinal de este sector. Puedes invitar a otros vecinos por su código personal o compartir el código de la comunidad.'
              : 'Eres integrante activo de esta comunidad.'}
          </Text>
        </View>
      </View>

      {identity.canInviteNeighbors &&
        (newName === null ? (
          <Pressable
            accessibilityRole="button"
            style={styles.buttonSecondary}
            onPress={() => {
              setValidation(null);
              setNewName(identity.community.name);
            }}
          >
            <Text style={styles.buttonSecondaryText}>Editar nombre</Text>
          </Pressable>
        ) : (
          <View style={styles.joinBox}>
            <Text style={styles.label}>Nombre de la comunidad</Text>
            <TextInput
              accessibilityLabel="Nombre de la comunidad"
              style={styles.input}
              value={newName}
              editable={!community.creating}
              onChangeText={setNewName}
            />
            {validation && (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {validation}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              style={styles.buttonPrimary}
              disabled={community.creating}
              onPress={() => void saveName()}
            >
              <Text style={styles.buttonPrimaryText}>Guardar nombre</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={styles.buttonSecondary}
              disabled={community.creating}
              onPress={() => {
                setNewName(null);
                setValidation(null);
              }}
            >
              <Text style={styles.buttonSecondaryText}>Cancelar</Text>
            </Pressable>
          </View>
        ))}

      {identity.membership.role === 'representative' && identity.membership.invite_code && (
        <View style={styles.inviteCodeBox}>
          <View style={styles.inviteCodeHeader}>
            <Text style={styles.inviteCodeLabel}>CÓDIGO DE INVITACIÓN DIRECTA</Text>
            <View style={styles.inviteCodeBadge}>
              <Text style={styles.inviteCodeBadgeText}>COMUNIDAD</Text>
            </View>
          </View>
          <Text style={styles.inviteCodeText}>{identity.membership.invite_code}</Text>
          <Text style={styles.inviteCodeDescription}>
            Comparte este código con tus vecinos para que se unan a la comunidad ingresándolo en su
            aplicación.
          </Text>
          <Pressable
            style={styles.buttonCopy}
            onPress={async () => {
              if (!identity.membership.invite_code) return;
              await Clipboard.setStringAsync(identity.membership.invite_code);
              setCopiedInvite(true);
              setTimeout(() => setCopiedInvite(false), 2000);
            }}
          >
            <Text style={styles.buttonCopyText}>
              {copiedInvite ? '¡Código copiado!' : 'Copiar código de comunidad'}
            </Text>
          </Pressable>
        </View>
      )}

      <MembersPanel
        key={`${userId}:${identity.community.id}`}
        client={client}
        refreshVersion={membersVersion}
      />
      {identity.membership.role === 'member' && (
        <View style={styles.joinBox}>
          {confirmLeave && (
            <Text style={styles.helpText}>¿Quieres abandonar {identity.community.name}?</Text>
          )}
          <Pressable
            accessibilityRole="button"
            style={styles.buttonSecondary}
            disabled={community.creating}
            onPress={async () => {
              if (!confirmLeave) setConfirmLeave(true);
              else if (await community.leave()) setConfirmLeave(false);
            }}
          >
            <Text style={styles.buttonSecondaryText}>
              {confirmLeave ? 'Confirmar salida' : 'Abandonar comunidad'}
            </Text>
          </Pressable>
          {confirmLeave && (
            <Pressable
              accessibilityRole="button"
              style={styles.buttonSecondary}
              disabled={community.creating}
              onPress={() => setConfirmLeave(false)}
            >
              <Text style={styles.buttonSecondaryText}>Cancelar</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
