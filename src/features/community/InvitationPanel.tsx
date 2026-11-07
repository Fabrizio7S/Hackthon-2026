import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { normalizePersonalCode } from './invitationService';
import { useInvitations } from './useInvitations';

export function InvitationPanel({ client, canInvite, onMembershipChanged }: {
  client: SupabaseClient;
  canInvite: boolean;
  onMembershipChanged: () => void;
}) {
  const invitations = useInvitations(client);
  const [code, setCode] = useState('');
  const [validation, setValidation] = useState<string | null>(null);

  async function find() {
    try {
      const normalized = normalizePersonalCode(code);
      setValidation(null);
      await invitations.find(normalized);
    } catch (failure) {
      setValidation(failure instanceof Error ? failure.message : 'Revisa el código.');
    }
  }

  return <View style={styles.section}>
    <Text accessibilityRole="header" style={styles.title}>Invitaciones</Text>
    {invitations.loading ? <><ActivityIndicator accessibilityLabel="Consultando invitaciones" /><Text>Consultando invitaciones…</Text></> : <>
      {invitations.error && <Text accessibilityRole="alert">{invitations.error}</Text>}
      {invitations.message && <Text accessibilityLiveRegion="polite">{invitations.message}</Text>}
      {canInvite && <>
        <Text>Código personal del vecino</Text>
        <TextInput accessibilityLabel="Código personal del vecino" style={styles.input} value={code} editable={!invitations.pending}
          autoCapitalize="none" autoCorrect={false} onChangeText={value => {
            setCode(value); setValidation(null); invitations.clearNeighbor();
          }} onSubmitEditing={() => { void find(); }} />
        {validation && <Text accessibilityRole="alert">{validation}</Text>}
        <Button title="Buscar vecino" disabled={invitations.pending} onPress={() => { void find(); }} />
        {invitations.neighbor && <View style={styles.section}>
          <Text>{invitations.neighbor.display_name}</Text>
          <Text selectable>{invitations.neighbor.personal_code}</Text>
          <Button title="Enviar invitación" disabled={invitations.pending} onPress={() => {
            if (invitations.neighbor) void invitations.send(invitations.neighbor.personal_code);
          }} />
        </View>}
      </>}
      {invitations.pending && <ActivityIndicator accessibilityLabel="Procesando invitación" />}
      {!invitations.error && !invitations.items.length && <Text>No tienes invitaciones.</Text>}
      {invitations.items.map(item => <View key={item.id} style={styles.card}>
        <Text>{item.direction === 'incoming' ? 'Recibida' : 'Enviada'} · {item.community_name}</Text>
        {item.recipient_name && <Text>Para: {item.recipient_name}</Text>}
        <Text>Estado: {item.status === 'pending' ? 'pendiente' : item.status === 'accepted' ? 'aceptada' : 'rechazada'}</Text>
        {item.direction === 'incoming' && item.status === 'pending' && <>
          <Button title="Aceptar invitación" disabled={invitations.pending} onPress={() => {
            void invitations.process(item.id, true).then(result => {
              if (result?.status === 'accepted') onMembershipChanged();
            });
          }} />
          <Button title="Rechazar invitación" disabled={invitations.pending} onPress={() => {
            void invitations.process(item.id, false).then(result => {
              if (result?.status === 'accepted') onMembershipChanged();
            });
          }} />
        </>}
      </View>)}
      <Button title="Actualizar invitaciones" disabled={invitations.pending} onPress={invitations.refresh} />
    </>}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { fontSize: 22, fontWeight: '600', color: '#111' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#666', borderRadius: 6, padding: 12, color: '#111' },
  card: { gap: 10, borderWidth: 1, borderColor: '#aaa', borderRadius: 6, padding: 12 },
});
