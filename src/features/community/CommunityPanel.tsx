import { useCallback, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { normalizeCommunityName } from './communityService';
import { useCommunity } from './useCommunity';
import { InvitationPanel } from './InvitationPanel';
import { MembersPanel } from './MembersPanel';
import { CommunityIdentityProvider } from '../../shared/IdentityContext';

export function CommunityPanel({ client, userId, refreshVersion }: {
  client: SupabaseClient;
  userId: string;
  refreshVersion: number;
}) {
  const community = useCommunity(client, userId, refreshVersion);
  const identity = community.identity;
  const [name, setName] = useState('');
  const [validation, setValidation] = useState<string | null>(null);
  const [membersVersion, setMembersVersion] = useState(0);
  const refreshMembers = useCallback(() => setMembersVersion(value => value + 1), []);

  async function create() {
    try {
      const normalized = normalizeCommunityName(name);
      setValidation(null);
      await community.create(normalized);
    } catch (failure) {
      setValidation(failure instanceof Error ? failure.message : 'Revisa el nombre de la comunidad.');
    }
  }

  return <CommunityIdentityProvider value={community.identity} actions={{ refresh: community.refresh }}><View style={styles.section}>
    <Text accessibilityRole="header" style={styles.title}>Mi comunidad</Text>
    {identity.status === 'loading' ? <><ActivityIndicator accessibilityLabel="Consultando comunidad" /><Text>Consultando comunidad…</Text></> : <>
      {(community.error || identity.error) && <Text accessibilityRole="alert">{community.error ?? identity.error}</Text>}
      {identity.status === 'member' ? <>
        <Text>{identity.community.name}</Text>
        <Text>{identity.membership.role === 'representative' ? 'Eres el representante de esta comunidad.' : 'Eres integrante de esta comunidad.'}</Text>
        <MembersPanel key={`${userId}:${identity.community.id}`} client={client} refreshVersion={membersVersion} />
      </> : identity.status === 'withoutCommunity' && <>
        <Text>Todavía no perteneces a una comunidad.</Text>
        {!identity.hasProfile ? <Text>Completa y guarda tu perfil para continuar.</Text>
          : !identity.canCreateCommunity ? <Text>Comparte tu código personal con el representante para recibir una invitación.</Text>
            : <>
              <Text>Nombre de la comunidad</Text>
              <TextInput accessibilityLabel="Nombre de la comunidad" style={styles.input} value={name} editable={!community.creating} onChangeText={value => {
                setName(value); setValidation(null);
              }} onSubmitEditing={() => { void create(); }} />
              {validation && <Text accessibilityRole="alert">{validation}</Text>}
              <Button title={community.creating ? 'Creando…' : 'Crear comunidad'} disabled={community.creating} onPress={() => { void create(); }} />
            </>}
      </>}
      <Button title="Actualizar comunidad" disabled={community.creating} onPress={community.refresh} />
      {(identity.status === 'member' || identity.status === 'withoutCommunity') && <InvitationPanel key={userId} client={client}
        canInvite={identity.canInviteNeighbors}
        onMembershipChanged={community.refresh} onAcceptedListChanged={refreshMembers} />}
    </>}
  </View></CommunityIdentityProvider>;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { fontSize: 22, fontWeight: '600', color: '#111' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#666', borderRadius: 6, padding: 12, color: '#111' },
});
