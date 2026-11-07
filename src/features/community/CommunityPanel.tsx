import { useCallback, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { normalizeCommunityName } from './communityService';
import { useCommunity } from './useCommunity';
import { InvitationPanel } from './InvitationPanel';
import { MembersPanel } from './MembersPanel';

export function CommunityPanel({ client, userId, refreshVersion }: {
  client: SupabaseClient;
  userId: string;
  refreshVersion: number;
}) {
  const community = useCommunity(client, userId, refreshVersion);
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

  return <View style={styles.section}>
    <Text accessibilityRole="header" style={styles.title}>Mi comunidad</Text>
    {community.loading ? <><ActivityIndicator accessibilityLabel="Consultando comunidad" /><Text>Consultando comunidad…</Text></> : <>
      {community.error && <Text accessibilityRole="alert">{community.error}</Text>}
      {community.data?.membership ? <>
        <Text>{community.data.membership.community_name}</Text>
        <Text>{community.data.membership.role === 'representative' ? 'Eres el representante de esta comunidad.' : 'Eres integrante de esta comunidad.'}</Text>
        <MembersPanel key={`${userId}:${community.data.membership.community_id}`} client={client}
          communityId={community.data.membership.community_id} refreshVersion={membersVersion} />
      </> : community.data && <>
        <Text>Todavía no perteneces a una comunidad.</Text>
        {!community.data.has_profile ? <Text>Completa y guarda tu perfil para continuar.</Text>
          : !community.data.can_create ? <Text>Comparte tu código personal con el representante para recibir una invitación.</Text>
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
      {community.data && <InvitationPanel key={userId} client={client}
        canInvite={community.data.can_create && community.data.membership?.role === 'representative'}
        onMembershipChanged={community.refresh} onAcceptedListChanged={refreshMembers} />}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { fontSize: 22, fontWeight: '600', color: '#111' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#666', borderRadius: 6, padding: 12, color: '#111' },
});
