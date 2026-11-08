import { CommunityMembership } from './CommunityMembership';
import { CommunityCreateForm } from './CommunityCreateForm';
import { CommunityJoinForm } from './CommunityJoinForm';
import { useCommunityPanel } from '../hooks/useCommunityPanel';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Pressable, Text, View } from 'react-native';
import { InvitationPanel } from './InvitationPanel';
import { CommunityIdentityProvider } from '../../../shared/identity/IdentityContext';
import type { CommunityRole } from '../../../shared/identity/contracts';
import { SkeletonPanel } from '../../../shared/ui/Skeleton';
import { TourTarget } from '../../../shared/ui/tour/TourTargets';
import { styles } from '../styles/community.styles';

export function CommunityPanel({
  client,
  userId,
  refreshVersion,
  onMembershipResolved,
}: {
  client: SupabaseClient;
  userId: string;
  refreshVersion: number;
  onMembershipResolved?: (
    isMember: boolean,
    communityName: string | null,
    role?: CommunityRole | null,
  ) => void;
}) {
  const model = useCommunityPanel({ client, userId, refreshVersion, onMembershipResolved });
  const { community, highlighted, identity, refreshMembers } = model;
  return (
    <CommunityIdentityProvider value={community.identity} actions={{ refresh: community.refresh }}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text accessibilityRole="header" style={styles.title}>
            Mi comunidad
          </Text>
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
            {highlighted('community-join') &&
              (identity.status !== 'withoutCommunity' || !identity.hasProfile) && (
                <TourTarget id="community-join" style={styles.infoBanner}>
                  <Text style={styles.infoText}>
                    {identity.status === 'member'
                      ? 'Ya perteneces a una comunidad. El campo para unirte con código solo aparece cuando todavía no eres integrante de ninguna.'
                      : 'Primero guarda tu perfil. Después aparecerá aquí el campo para escribir el código de tu comunidad.'}
                  </Text>
                </TourTarget>
              )}
            {highlighted('community-create') &&
              (identity.status !== 'withoutCommunity' ||
                !identity.hasProfile ||
                !identity.canCreateCommunity) && (
                <TourTarget id="community-create" style={styles.infoBanner}>
                  <Text style={styles.infoText}>
                    {identity.status === 'member'
                      ? 'Ya perteneces a una comunidad. No puedes crear otra mientras sigas siendo integrante de esta.'
                      : 'Para ver el formulario de creación debes guardar tu perfil, no pertenecer a ninguna comunidad y tener autorización de representante del equipo de la aplicación.'}
                  </Text>
                </TourTarget>
              )}
            {(community.error || identity.error) && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {community.error ?? identity.error}
              </Text>
            )}

            {identity.status === 'member' ? (
              <CommunityMembership model={model} />
            ) : (
              identity.status === 'withoutCommunity' && (
                <View style={styles.withoutBox}>
                  <Text style={styles.withoutTitle}>Todavía no perteneces a una comunidad.</Text>
                  {!identity.hasProfile ? (
                    <Text style={styles.helpText}>Completa y guarda tu perfil para continuar.</Text>
                  ) : (
                    <>
                      <CommunityJoinForm model={model} />

                      {!identity.canCreateCommunity ? (
                        <View style={styles.infoBanner}>
                          <Text style={styles.infoText}>
                            También puedes compartir tu código personal con tu representante vecinal
                            para que te envíe una invitación directa.
                          </Text>
                        </View>
                      ) : (
                        <CommunityCreateForm model={model} />
                      )}
                    </>
                  )}
                </View>
              )
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
