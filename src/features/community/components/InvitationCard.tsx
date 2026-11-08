import { Pressable, Text, View } from 'react-native';
import { styles } from '../styles/invitation.styles';
import type { InvitationPanelModel } from '../hooks/useInvitationPanel';

export function InvitationCard({
  item,
  model,
}: {
  item: InvitationPanelModel['invitations']['items'][number];
  model: InvitationPanelModel;
}) {
  const { invitations, onMembershipChanged } = model;
  return (
    <View key={item.id} style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <View
          style={[
            styles.directionBadge,
            item.direction === 'incoming' ? styles.incomingBadge : styles.outgoingBadge,
          ]}
        >
          <Text
            style={[
              styles.directionBadgeText,
              item.direction === 'incoming' ? styles.incomingBadgeText : styles.outgoingBadgeText,
            ]}
          >
            {item.direction === 'incoming' ? 'Recibida' : 'Enviada'}
          </Text>
        </View>
        <Text style={styles.communityTag}>{item.community_name}</Text>
      </View>

      {item.recipient_name && (
        <Text style={styles.recipientText}>
          Destinatario: <Text style={styles.boldText}>{item.recipient_name}</Text>
        </Text>
      )}

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Estado: </Text>
        <Text
          style={[
            styles.statusValue,
            item.status === 'accepted'
              ? styles.statusAccepted
              : item.status === 'rejected'
                ? styles.statusRejected
                : styles.statusPending,
          ]}
        >
          {item.status === 'pending'
            ? 'Pendiente'
            : item.status === 'accepted'
              ? 'Aceptada'
              : 'Rechazada'}
        </Text>
      </View>

      {item.direction === 'incoming' && item.status === 'pending' && (
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.acceptButton, invitations.pending && styles.buttonDisabled]}
            disabled={invitations.pending}
            onPress={() => {
              void invitations.process(item.id, true).then((result) => {
                if (result?.status === 'accepted') onMembershipChanged();
              });
            }}
          >
            <Text style={styles.acceptButtonText}>Aceptar</Text>
          </Pressable>
          <Pressable
            style={[styles.rejectButton, invitations.pending && styles.buttonDisabled]}
            disabled={invitations.pending}
            onPress={() => {
              void invitations.process(item.id, false).then((result) => {
                if (result?.status === 'accepted') onMembershipChanged();
              });
            }}
          >
            <Text style={styles.rejectButtonText}>Rechazar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
