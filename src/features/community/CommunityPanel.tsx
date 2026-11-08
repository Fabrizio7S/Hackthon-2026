import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { normalizeCommunityName } from './communityService';
import { useCommunity } from './useCommunity';
import { InvitationPanel } from './InvitationPanel';
import { MembersPanel } from './MembersPanel';
import { CommunityIdentityProvider } from '../../shared/IdentityContext';
import { colors, fonts } from '../../shared/theme';

export function CommunityPanel({ client, userId, refreshVersion, onMembershipResolved }: {
  client: SupabaseClient;
  userId: string;
  refreshVersion: number;
  onMembershipResolved?: (isMember: boolean, communityName: string | null) => void;
}) {
  const community = useCommunity(client, userId, refreshVersion);
  const identity = community.identity;
  const [name, setName] = useState('');
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
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} accessibilityLabel="Consultando comunidad" />
            <Text style={styles.mutedText}>Consultando comunidad…</Text>
          </View>
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
                        ? 'Eres el representante vecinal de este sector. Puedes invitar a otros vecinos por su código personal.'
                        : 'Eres integrante activo de esta comunidad.'}
                    </Text>
                  </View>
                </View>
                <MembersPanel key={`${userId}:${identity.community.id}`} client={client} refreshVersion={membersVersion} />
              </View>
            ) : identity.status === 'withoutCommunity' && (
              <View style={styles.withoutBox}>
                <Text style={styles.withoutTitle}>Todavía no perteneces a una comunidad.</Text>
                {!identity.hasProfile ? (
                  <Text style={styles.helpText}>Completa y guarda tu perfil para continuar.</Text>
                ) : !identity.canCreateCommunity ? (
                  <View style={styles.infoBanner}>
                    <Text style={styles.infoText}>
                      Comparte tu código personal con tu representante vecinal para que te envíe una invitación de acceso.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.createBox}>
                    <Text style={styles.label}>Nombre de la comunidad a crear</Text>
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
                      style={[styles.buttonPrimary, community.creating && styles.buttonDisabled]}
                      disabled={community.creating}
                      onPress={() => { void create(); }}
                    >
                      <Text style={styles.buttonPrimaryText}>
                        {community.creating ? 'Creando…' : 'Crear comunidad vecinal'}
                      </Text>
                    </Pressable>
                  </View>
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
    gap: 10,
  },
  communityName: { fontSize: 26, lineHeight: 29, fontWeight: '800', letterSpacing: -0.8, color: colors.onDeep },
  roleDescription: { fontSize: 14, color: colors.onDeepMuted, lineHeight: 20 },
  withoutBox: {
    gap: 10,
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
  buttonOutline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.background, borderRadius: 14, minHeight: 46, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonOutlineText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  plaque: { backgroundColor: colors.primaryDeep, borderRadius: 20, padding: 5 },
  plaqueInner: { borderWidth: 1.5, borderColor: 'rgba(244,241,232,0.42)', borderRadius: 16, padding: 16, gap: 6 },
  plaqueEyebrow: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.4, color: '#C9DCA8' },
  buttonDisabled: {
    opacity: 0.6,
  },
});

