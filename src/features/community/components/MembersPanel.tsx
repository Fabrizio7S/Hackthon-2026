import { useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';
import {
  createMembersService,
  observeMembers,
  type CommunityMember,
  type MembersState,
} from '../data/membersService';
import {
  useCommunityActions,
  useCommunityIdentity,
} from '../../../shared/identity/IdentityContext';
import { colors } from '../../../shared/theme';
import { SkeletonPanel } from '../../../shared/ui/Skeleton';
import { styles } from '../styles/members.styles';

export function MembersPanel({
  client,
  refreshVersion,
}: {
  client: SupabaseClient;
  refreshVersion: number;
}) {
  const identity = useCommunityIdentity();
  const communityActions = useCommunityActions();
  const communityId = identity.status === 'member' ? identity.community.id : null;
  const canManage = identity.status === 'member' && identity.canInviteNeighbors;
  const service = useMemo(
    () => (communityId ? createMembersService(client, communityId, canManage) : null),
    [client, communityId, canManage],
  );
  const [state, setState] = useState<MembersState>({ status: 'loading', members: [], error: null });
  const [attempt, setAttempt] = useState(0);
  const loading = useRef(true);
  const removing = useRef(false);
  const [target, setTarget] = useState<CommunityMember | null>(null);
  const [pending, setPending] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(
    () =>
      service
        ? observeMembers(service, (next) => {
            loading.current = next.status === 'loading';
            setState(next);
          })
        : undefined,
    [service, attempt, refreshVersion],
  );

  if (identity.status !== 'member') return null;

  async function remove() {
    const id = target?.user_id;
    if (!service || !canManage || !id || removing.current) return;
    removing.current = true;
    setPending(true);
    setRemoveError(null);
    try {
      await service.remove(id);
      setState((current) =>
        current.status === 'ready'
          ? { ...current, members: current.members.filter((member) => member.user_id !== id) }
          : current,
      );
      setTarget(null);
    } catch {
      setRemoveError(
        'No pudimos dar de baja al integrante. Vuelve a intentar o actualiza la lista.',
      );
    } finally {
      removing.current = false;
      setPending(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.title}>
          Integrantes del sector
        </Text>
        {state.status === 'ready' && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{state.members.length} vecinos</Text>
          </View>
        )}
      </View>

      {state.status === 'loading' ? (
        <SkeletonPanel lines={3} accessibilityLabel="Consultando integrantes" />
      ) : (
        <>
          {state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} accessibilityRole="alert">
                {state.error}
              </Text>
              <Pressable style={styles.buttonOutline} onPress={communityActions.refresh}>
                <Text style={styles.buttonOutlineText}>Volver a consultar mi comunidad</Text>
              </Pressable>
            </View>
          )}

          {state.status === 'ready' && (
            <View style={styles.list}>
              {!state.members.length && (
                <Text style={styles.emptyText}>
                  No hay integrantes registrados en la comunidad.
                </Text>
              )}
              {state.members.map((member, index) => {
                const initial = (member.display_name.trim().charAt(0) || 'V').toUpperCase();
                return (
                  <View key={member.user_id ?? index} style={styles.memberRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {member.display_name}
                        {member.is_current_user && <Text style={styles.currentUserTag}> (tú)</Text>}
                      </Text>
                      <View
                        style={[
                          styles.roleBadge,
                          member.role === 'representative' ? styles.repBadge : styles.normalBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleBadgeText,
                            member.role === 'representative'
                              ? styles.repBadgeText
                              : styles.normalBadgeText,
                          ]}
                        >
                          {member.role === 'representative' ? 'Representante' : 'Vecino'}
                        </Text>
                      </View>
                    </View>
                    {canManage && member.user_id && !member.is_current_user && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Dar de baja a ${member.display_name}`}
                        style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                        onPress={() => {
                          setRemoveError(null);
                          setTarget(member);
                        }}
                      >
                        <Feather name="trash-2" size={18} color={colors.danger} />
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <Pressable
            style={styles.buttonOutline}
            onPress={() => {
              if (!loading.current) {
                loading.current = true;
                setAttempt((value) => value + 1);
              }
            }}
          >
            <Text style={styles.buttonOutlineText}>Actualizar integrantes</Text>
          </Pressable>
        </>
      )}
      <Modal
        visible={canManage && target !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!pending) setTarget(null);
        }}
      >
        <View style={styles.overlay}>
          <View accessibilityViewIsModal style={[styles.card, styles.dialog]}>
            <Text accessibilityRole="header" style={styles.title}>
              Dar de baja
            </Text>
            <Text style={styles.mutedText}>
              ¿Quieres dar de baja a {target?.display_name} de la comunidad?
            </Text>
            {removeError && (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {removeError}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              style={styles.buttonOutline}
              disabled={pending}
              onPress={() => void remove()}
            >
              <Text style={styles.errorText}>{pending ? 'Dando de baja…' : 'Confirmar baja'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={styles.buttonOutline}
              disabled={pending}
              onPress={() => setTarget(null)}
            >
              <Text style={styles.buttonOutlineText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
