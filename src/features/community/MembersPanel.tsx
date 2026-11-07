import { useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

import { createMembersService, observeMembers, type MembersState } from './membersService';

export function MembersPanel({ client, communityId, refreshVersion }: {
  client: SupabaseClient;
  communityId: string;
  refreshVersion: number;
}) {
  const service = useMemo(() => createMembersService(client, communityId), [client, communityId]);
  const [state, setState] = useState<MembersState>({ status: 'loading', members: [], error: null });
  const [attempt, setAttempt] = useState(0);
  const loading = useRef(true);

  useEffect(() => observeMembers(service, next => {
    loading.current = next.status === 'loading';
    setState(next);
  }), [service, attempt, refreshVersion]);

  return <View style={styles.section}>
    <Text accessibilityRole="header" style={styles.title}>Integrantes</Text>
    {state.status === 'loading' ? <><ActivityIndicator accessibilityLabel="Consultando integrantes" /><Text>Consultando integrantes…</Text></> : <>
      {state.error && <Text accessibilityRole="alert">{state.error}</Text>}
      {state.status === 'ready' && <>
        <Text>{state.members.length} integrantes</Text>
        {!state.members.length && <Text>No hay integrantes para mostrar.</Text>}
        {state.members.map((member, index) => <View key={index} style={styles.row}>
          <Text>{member.display_name}{member.is_current_user ? ' (tú)' : ''}</Text>
          <Text>{member.role === 'representative' ? 'Representante' : 'Integrante'}</Text>
        </View>)}
      </>}
      <Button title="Actualizar integrantes" onPress={() => {
        if (!loading.current) { loading.current = true; setAttempt(value => value + 1); }
      }} />
    </>}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { fontSize: 22, fontWeight: '600', color: '#111' },
  row: { gap: 4, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#ccc' },
});
