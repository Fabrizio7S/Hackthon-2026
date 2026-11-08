import { useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { createMembersService, observeMembers, type MembersState } from './membersService';
import { useCommunityActions, useCommunityIdentity } from '../../shared/IdentityContext';
import { colors } from '../../shared/theme';

export function MembersPanel({ client, refreshVersion }: {
  client: SupabaseClient;
  refreshVersion: number;
}) {
  const identity = useCommunityIdentity();
  const communityActions = useCommunityActions();
  const communityId = identity.status === 'member' ? identity.community.id : null;
  const service = useMemo(() => communityId ? createMembersService(client, communityId) : null, [client, communityId]);
  const [state, setState] = useState<MembersState>({ status: 'loading', members: [], error: null });
  const [attempt, setAttempt] = useState(0);
  const loading = useRef(true);

  useEffect(() => service ? observeMembers(service, next => {
    loading.current = next.status === 'loading';
    setState(next);
  }) : undefined, [service, attempt, refreshVersion]);

  if (identity.status !== 'member') return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.title}>Integrantes del sector</Text>
        {state.status === 'ready' && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{state.members.length} vecinos</Text>
          </View>
        )}
      </View>

      {state.status === 'loading' ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Consultando integrantes" />
          <Text style={styles.mutedText}>Consultando lista de integrantes…</Text>
        </View>
      ) : (
        <>
          {state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} accessibilityRole="alert">{state.error}</Text>
              <Pressable style={styles.buttonOutline} onPress={communityActions.refresh}>
                <Text style={styles.buttonOutlineText}>Volver a consultar mi comunidad</Text>
              </Pressable>
            </View>
          )}

          {state.status === 'ready' && (
            <View style={styles.list}>
              {!state.members.length && (
                <Text style={styles.emptyText}>No hay integrantes registrados en la comunidad.</Text>
              )}
              {state.members.map((member, index) => {
                const initial = (member.display_name.trim().charAt(0) || 'V').toUpperCase();
                return (
                  <View key={index} style={styles.memberRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {member.display_name}
                        {member.is_current_user && <Text style={styles.currentUserTag}> (tú)</Text>}
                      </Text>
                      <View style={[styles.roleBadge, member.role === 'representative' ? styles.repBadge : styles.normalBadge]}>
                        <Text style={[styles.roleBadgeText, member.role === 'representative' ? styles.repBadgeText : styles.normalBadgeText]}>
                          {member.role === 'representative' ? 'Representante' : 'Vecino'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <Pressable
            style={styles.buttonOutline}
            onPress={() => {
              if (!loading.current) { loading.current = true; setAttempt(value => value + 1); }
            }}
          >
            <Text style={styles.buttonOutlineText}>Actualizar integrantes</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingBox: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  mutedText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  errorBox: {
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
  },
  list: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  currentUserTag: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  roleBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: 12,
  },
  repBadge: {
    backgroundColor: colors.primarySurface,
  },
  repBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  normalBadge: {
    backgroundColor: colors.surface,
  },
  normalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonOutlineText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});

