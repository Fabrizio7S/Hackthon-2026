import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as Clipboard from 'expo-clipboard';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { normalizeCommunityName } from './communityService';
import { useCommunity } from './useCommunity';
import { InvitationPanel } from './InvitationPanel';
import { MembersPanel } from './MembersPanel';
import { CommunityIdentityProvider } from '../../shared/IdentityContext';
import { colors, fonts } from '../../shared/theme';
import { SkeletonPanel } from '../../shared/Skeleton';

export function CommunityPanel({ client, userId, refreshVersion, onMembershipResolved }: {
  client: SupabaseClient;
  userId: string;
  refreshVersion: number;
  onMembershipResolved?: (isMember: boolean, communityName: string | null) => void;
}) {
  const community = useCommunity(client, userId, refreshVersion);
  const identity = community.identity;
  const [name, setName] = useState('');
  const [newName, setNewName] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [communityCode, setCommunityCode] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const [membersVersion, setMembersVersion] = useState(0);
  const refreshMembers = useCallback(() => setMembersVersion(value => value + 1), []);

  useEffect(() => {
    if (identity.status === 'member') {
      onMembershipResolved?.(true, identity.community.name);
    } else if (identity.status === 'withoutCommunity') {
      onMembershipResolved?.(false, null);
    }
  }, [identity, onMembershipResolved]);

  async function create() {
    try {
      const normalized = normalizeCommunityName(name);
      setValidation(null);
      await community.create(normalized);
    } catch (failure) {
      setValidation(failure instanceof Error ? failure.message : 'Revisa el nombre de la comunidad.');
    }
  }

  async function saveName() {
    if (newName === null) return;
    try {
      const normalized = normalizeCommunityName(newName);
      setValidation(null);
      if (await community.rename(normalized)) setNewName(null);
    } catch (failure) {
      setValidation(failure instanceof Error ? failure.message : 'Revisa el nombre de la comunidad.');
    }
  }

  return (
    <CommunityIdentityProvider value={community.identity} actions={{ refresh: community.refresh }}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text accessibilityRole="header" style={styles.title}>Mi comunidad</Text>
          {identity.status === 'member' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {identity.membership.role === 'representative' ? 'REPRESENTANTE' : 'INTEGRANTE'}
              </Text>
            </View>
          )}
        </View>

        {identity.status === 'loading' ? (
          <SkeletonPanel lines={3} accessibilityLabel="Consultando comunidad" />
        ) : (
          <>
            {(community.error || identity.error) && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {community.error ?? identity.error}
              </Text>
            )}

            {identity.status === 'member' ? (
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

                {identity.canInviteNeighbors && (newName === null ? (
                  <Pressable accessibilityRole="button" style={styles.buttonSecondary} onPress={() => {
                    setValidation(null);
                    setNewName(identity.community.name);
                  }}>
                    <Text style={styles.buttonSecondaryText}>Editar nombre</Text>
                  </Pressable>
                ) : (
                  <View style={styles.joinBox}>
                    <Text style={styles.label}>Nombre de la comunidad</Text>
                    <TextInput accessibilityLabel="Nombre de la comunidad" style={styles.input}
                      value={newName} editable={!community.creating} onChangeText={setNewName} />
                    {validation && <Text accessibilityRole="alert" style={styles.errorText}>{validation}</Text>}
                    <Pressable accessibilityRole="button" style={styles.buttonPrimary}
                      disabled={community.creating} onPress={() => void saveName()}>
                      <Text style={styles.buttonPrimaryText}>Guardar nombre</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" style={styles.buttonSecondary}
                      disabled={community.creating} onPress={() => { setNewName(null); setValidation(null); }}>
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
                      Comparte este código con tus vecinos para que se unan a la comunidad ingresándolo en su aplicación.
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
                      <Text style={styles.buttonCopyText}>{copiedInvite ? '¡Código copiado!' : 'Copiar código de comunidad'}</Text>
                    </Pressable>
                  </View>
                )}

                <MembersPanel key={`${userId}:${identity.community.id}`} client={client} refreshVersion={membersVersion} />
                {identity.membership.role === 'member' && (
                  <View style={styles.joinBox}>
                    {confirmLeave && <Text style={styles.helpText}>¿Quieres abandonar {identity.community.name}?</Text>}
                    <Pressable accessibilityRole="button" style={styles.buttonSecondary} disabled={community.creating}
                      onPress={async () => {
                        if (!confirmLeave) setConfirmLeave(true);
                        else if (await community.leave()) setConfirmLeave(false);
                      }}>
                      <Text style={styles.buttonSecondaryText}>{confirmLeave ? 'Confirmar salida' : 'Abandonar comunidad'}</Text>
                    </Pressable>
                    {confirmLeave && (
                      <Pressable accessibilityRole="button" style={styles.buttonSecondary}
                        disabled={community.creating} onPress={() => setConfirmLeave(false)}>
                        <Text style={styles.buttonSecondaryText}>Cancelar</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ) : identity.status === 'withoutCommunity' && (
              <View style={styles.withoutBox}>
                <Text style={styles.withoutTitle}>Todavía no perteneces a una comunidad.</Text>
                {!identity.hasProfile ? (
                  <Text style={styles.helpText}>Completa y guarda tu perfil para continuar.</Text>
                ) : (
                  <>
                    <View style={styles.joinBox}>
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
                        onChangeText={val => setCommunityCode(val.toUpperCase().trim())}
                        onSubmitEditing={() => {
                          if (communityCode.trim()) {
                            void community.joinByCode(communityCode.trim());
                          }
                        }}
                      />
                      <Pressable
                        style={[styles.buttonPrimary, (!communityCode.trim() || community.creating) && styles.buttonDisabled]}
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
                    </View>

                    {!identity.canCreateCommunity ? (
                      <View style={styles.infoBanner}>
                        <Text style={styles.infoText}>
                          También puedes compartir tu código personal con tu representante vecinal para que te envíe una invitación directa.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.createBox}>
                        <Text style={styles.label}>O crear una nueva comunidad vecinal</Text>
                        <TextInput
                          accessibilityLabel="Nombre de la comunidad"
                          style={styles.input}
                          value={name}
                          editable={!community.creating}
                          placeholder="Ej. Vecinos Los Álamos"
                          placeholderTextColor={colors.textMuted}
                          onChangeText={value => {
                            setName(value);
                            setValidation(null);
                          }}
                          onSubmitEditing={() => { void create(); }}
                        />
                        {validation && <Text style={styles.errorText} accessibilityRole="alert">{validation}</Text>}
                        <Pressable
                          style={[styles.buttonSecondary, community.creating && styles.buttonDisabled]}
                          disabled={community.creating}
                          onPress={() => { void create(); }}
                        >
                          <Text style={styles.buttonSecondaryText}>
                            {community.creating ? 'Creando…' : 'Crear comunidad vecinal'}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            <Pressable
              style={styles.buttonOutline}
              disabled={community.creating}
              onPress={community.refresh}
            >
              <Text style={styles.buttonOutlineText}>Actualizar estado de comunidad</Text>
            </Pressable>

            {(identity.status === 'member' || identity.status === 'withoutCommunity') && (
              <InvitationPanel
                key={userId}
                client={client}
                canInvite={identity.canInviteNeighbors}
                onMembershipChanged={community.refresh}
                onAcceptedListChanged={refreshMembers}
              />
            )}
          </>
        )}
      </View>
    </CommunityIdentityProvider>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 18, gap: 14 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  badge: { backgroundColor: colors.lime, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.mono, fontSize: 10.5, fontWeight: '600', letterSpacing: 0.6, color: colors.primaryDeep },
  loadingBox: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  memberBox: {
    gap: 12,
  },
  communityName: { fontSize: 26, lineHeight: 29, fontWeight: '800', letterSpacing: -0.8, color: colors.onDeep },
  roleDescription: { fontSize: 14, color: colors.onDeepMuted, lineHeight: 20 },
  inviteCodeBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  inviteCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 11,
    fontFamily: fonts.mono,
    fontWeight: '700',
    color: colors.primaryDeep,
    letterSpacing: 0.8,
  },
  inviteCodeBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inviteCodeBadgeText: {
    fontSize: 10,
    fontFamily: fonts.mono,
    fontWeight: '700',
    color: colors.primary,
  },
  inviteCodeText: {
    fontSize: 24,
    fontFamily: fonts.mono,
    fontWeight: '800',
    letterSpacing: 3,
    color: colors.text,
  },
  inviteCodeDescription: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  buttonCopy: {
    backgroundColor: colors.primarySurface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  buttonCopyText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  withoutBox: {
    gap: 12,
  },
  withoutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  helpText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  infoBanner: { backgroundColor: colors.primarySurface, borderRadius: 14, padding: 12 },
  infoText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  joinBox: {
    gap: 8,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createBox: { gap: 10, backgroundColor: colors.surface, padding: 14, borderRadius: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: { minHeight: 48, borderWidth: 1.5, borderColor: colors.borderStrong, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.background },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  mutedText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  buttonPrimary: { backgroundColor: colors.primary, borderRadius: 14, minHeight: 48, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonPrimaryText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonSecondary: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
    borderRadius: 14,
    minHeight: 46,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonOutline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.background, borderRadius: 14, minHeight: 46, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonOutlineText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  plaque: { backgroundColor: colors.primaryDeep, borderRadius: 20, padding: 5 },
  plaqueInner: { borderWidth: 1.5, borderColor: 'rgba(244,241,232,0.42)', borderRadius: 16, padding: 16, gap: 6 },
  plaqueEyebrow: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.4, color: '#C9DCA8' },
  buttonDisabled: {
    opacity: 0.6,
  },
});
