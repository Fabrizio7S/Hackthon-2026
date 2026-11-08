import { Text, View } from 'react-native';
import { publicationStatus, requestLabels } from '../model/requests';
import { getOwnerDisplayName, getRequesterDisplayName } from '../model/presentation';
import { Button } from './FavorButton';
import { Badge } from './FavorBadge';
import { ResourceArt } from './ResourceArt';
import { styles } from '../styles/favors.styles';
import type { FavorsModel } from '../hooks/useFavorsController';

export function FavorActivity({ model }: { model: FavorsModel }) {
  const {
    userId,
    requests,
    myPublications,
    openDetail,
    handleDeletePublication,
    handleAcceptRequest,
    handleCancelRequest,
    handleFinishRequest,
    activity,
    client,
  } = model;

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.cardTitle}>
        Mi actividad
      </Text>
      <Text style={styles.body}>Revisa tus publicaciones y solicitudes.</Text>
      {myPublications.length > 0 && (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.publisherName}>
            Mis publicaciones
          </Text>
          <Text style={styles.muted}>
            {client && userId
              ? 'Publicaciones guardadas en tu cuenta de Supabase.'
              : 'Publicaciones creadas en esta sesión.'}
          </Text>
          {myPublications.map((item) => (
            <View key={item.id} style={[styles.card, styles.cardBody]}>
              <View style={styles.deckMeta}>
                <Text style={styles.eyebrow}>{item.kind.toUpperCase()}</Text>
                <Badge label={publicationStatus(requests, item.id)} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.body}>{item.description}</Text>
              {item.imageUri && <ResourceArt item={item} inset />}
              <View style={styles.row}>
                <Button label="Ver publicación" onPress={() => openDetail(item)} />
                {publicationStatus(requests, item.id) === 'Disponible' && (
                  <Button
                    label="Retirar publicación"
                    onPress={() => handleDeletePublication(item)}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      )}
      {activity.length === 0 && <Text style={styles.notice}>Aún no tienes solicitudes.</Text>}
      {activity.map(({ request, item, received }) => (
        <View
          key={`${item.id}-${request.requesterId ?? request.requester}`}
          style={[styles.card, styles.cardBody]}
        >
          <Text style={styles.eyebrow}>{received ? 'RECIBIDA' : 'ENVIADA'}</Text>
          <Text accessibilityRole="header" style={styles.cardTitle}>
            {item.title}
          </Text>
          <Text style={styles.muted}>
            {received
              ? `De ${getRequesterDisplayName(request)}`
              : `Para ${getOwnerDisplayName(item)}`}
          </Text>
          <Badge label={requestLabels[request.status]} />
          {request.status === 'pending' && !received && (
            <Text style={styles.notice}>
              {client && userId
                ? 'Solicitud enviada y sincronizada en Supabase.'
                : 'Solicitud registrada en esta sesión.'}
            </Text>
          )}
          <View style={styles.row}>
            <Button label="Ver publicación" onPress={() => openDetail(item)} />
            {received && request.status === 'pending' && (
              <Button
                primary
                label="Aceptar solicitud"
                onPress={() => handleAcceptRequest(item, request)}
              />
            )}
            {!received && request.status === 'pending' && (
              <Button
                label="Cancelar solicitud"
                onPress={() => handleCancelRequest(item, request)}
              />
            )}
            {request.status === 'accepted' && (
              <Button
                label="Cancelar coordinación"
                onPress={() => handleCancelRequest(item, request)}
              />
            )}
            {!received && request.status === 'accepted' && (
              <Button
                primary
                label="Marcar como terminada"
                onPress={() => handleFinishRequest(item, request)}
              />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
