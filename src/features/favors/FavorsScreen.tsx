import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  Animated, BackHandler, Linking, PanResponder, Platform, Pressable, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';

import {
  neighborReviews, neighbors, publications, publicationStatus, requestLabels, updateRequests,
  type Neighbor, type Publication,
} from './demo';

const tabs = ['Explorar', 'Guardadas', 'Mi actividad'] as const;
type Tab = (typeof tabs)[number];
const actor: Neighbor = 'ana';
const webSwipeStyle = { position: 'relative', touchAction: 'pan-y' } as const;
const ratingFormat = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Button({ label, onPress, primary = false, selected, disabled = false }: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  selected?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, (primary || selected) && styles.buttonActive, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={[styles.buttonText, (primary || selected) && styles.buttonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Badge({ label }: { label: string }) {
  return <Text style={styles.badge}>{label}</Text>;
}

function ResourceArt({ item, compact = false, inset = false }: { item: Publication; compact?: boolean; inset?: boolean }) {
  return (
    <View accessible={false} style={[styles.art, { backgroundColor: item.color }, compact && styles.artCompact, inset && styles.deckArt]}>
      <Text aria-hidden style={[styles.symbol, compact && styles.symbolCompact]}>{item.symbol}</Text>
    </View>
  );
}

export function FavorsScreen() {
  const [tab, setTab] = useState<Tab>('Explorar');
  const [detail, setDetail] = useState<Publication | null>(null);
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<'Tarjetas' | 'Lista'>('Tarjetas');
  const [cardIndex, setCardIndex] = useState(0);
  const [cardOffset] = useState(() => new Animated.Value(0));
  const [saved, setSaved] = useState<string[]>([]);
  const [requests, dispatch] = useReducer(updateRequests, []);
  const [contactError, setContactError] = useState(false);

  useEffect(() => {
    if (!detail) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      setDetail(null);
      return true;
    });
    return () => listener.remove();
  }, [detail]);

  function chooseTab(next: Tab) {
    setTab(next);
    setDetail(null);
  }

  function openDetail(item: Publication) {
    setContactError(false);
    setDetail(item);
  }

  function toggleSaved(id: string) {
    setSaved((previous) => previous.includes(id)
      ? previous.filter((savedId) => savedId !== id)
      : [...previous, id]);
  }

  function openWhatsApp(item: Publication) {
    const message = encodeURIComponent(`Hola, ${neighbors[item.owner]}. Me interesa tu publicación «${item.title}». ¿Podemos coordinar?`);
    setContactError(false);
    void Linking.openURL(`https://wa.me/?text=${message}`).catch(() => setContactError(true));
  }

  const search = query.trim().toLocaleLowerCase('es');
  const visible = publications.filter((item) => {
    if (tab === 'Guardadas') return saved.includes(item.id);
    return item.owner !== actor && `${item.title} ${item.kind} ${item.description}`.toLocaleLowerCase('es').includes(search);
  });
  const isDeck = tab === 'Explorar' && layout === 'Tarjetas';
  const currentCard = visible[cardIndex];
  const lastCardIndex = visible.length - 1;
  const cardSwipe = useMemo(() => {
    function resetOffset() {
      Animated.spring(cardOffset, { toValue: 0, useNativeDriver: false }).start();
    }

    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, { dx, dy, numberActiveTouches }) =>
        lastCardIndex > 0 && numberActiveTouches === 1 && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3,
      onPanResponderGrant: () => cardOffset.setValue(0),
      onPanResponderMove: (_, { dx }) => cardOffset.setValue(dx),
      onPanResponderRelease: (_, { dx }) => {
        if (Math.abs(dx) < 64) {
          resetOffset();
          return;
        }
        const step = dx < 0 ? 1 : -1;
        setCardIndex((index) => Math.max(0, Math.min(lastCardIndex, index + step)));
        cardOffset.setValue(0);
      },
      onPanResponderTerminate: resetOffset,
    });
  }, [cardOffset, lastCardIndex]);
  const cardRotation = useMemo(() => cardOffset.interpolate({
    inputRange: [-160, 0, 160],
    outputRange: ['-9deg', '0deg', '9deg'],
    extrapolate: 'clamp',
  }), [cardOffset]);
  const detailRequest = requests.find((request) => request.publicationId === detail?.id && request.requester === actor);
  const detailStatus = detail && publicationStatus(requests, detail.id);
  const reviews = detail ? neighborReviews[detail.owner] : [];
  const averageRating = reviews.length > 0
    ? ratingFormat.format(reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length)
    : null;

  const activity = requests.flatMap((request) => {
    const item = publications.find((publication) => publication.id === request.publicationId);
    if (!item || (item.owner !== actor && request.requester !== actor)) return [];
    return [{ request, item, received: item.owner === actor }];
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        key={detail?.id ?? tab}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.title}>Cadena de favores</Text>
            {!detail && tab === 'Explorar' && (
              <Text style={styles.body}>Descubre préstamos e intercambios de tu comunidad.</Text>
            )}
          </View>
          {!detail && (
            <View style={styles.row}>
              {tabs.map((name) => (
                <Button key={name} label={name} selected={tab === name} onPress={() => chooseTab(name)} />
              ))}
            </View>
          )}

          {detail ? (
            <View style={styles.section}>
              <View style={styles.row}>
                <Button label="‹ Volver" onPress={() => setDetail(null)} />
              </View>
              <View style={styles.card}>
                <View>
                  <ResourceArt item={detail} />
                  {detailStatus && (
                    <View style={styles.detailBadge}>
                      <Badge label={detailStatus} />
                    </View>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.eyebrow}>{detail.kind.toUpperCase()}</Text>
                  <Text accessibilityRole="header" style={styles.cardTitle}>{detail.title}</Text>
                  <View style={styles.publisher}>
                    <Text style={styles.publisherName}>Publicado por {neighbors[detail.owner]}</Text>
                    <View style={styles.row}>
                      {averageRating && <Text aria-hidden style={styles.stars}>★</Text>}
                      <Text style={styles.muted}>
                        {averageRating ? `${averageRating} de 5 · ${reviews.length} reseñas` : 'Sin calificaciones'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.muted}>{detail.location}</Text>
                  <Text style={styles.body}>{detail.description}</Text>
                  <Text style={styles.notice}>{detail.terms}</Text>
                  {detailRequest && <Badge label={requestLabels[detailRequest.status]} />}
                  <View style={styles.row}>
                    {detail.owner !== actor && detailStatus === 'Disponible' && !detailRequest && (
                      <Button primary label={`Solicitar ${detail.kind.toLowerCase()}`} onPress={() => {
                        dispatch({ type: 'request', publicationId: detail.id, actor, requester: actor });
                        chooseTab('Mi actividad');
                      }} />
                    )}
                    {detail.owner !== actor && (detailStatus === 'Disponible' || detailRequest?.status === 'accepted') && (
                      <Button label="Abrir WhatsApp" onPress={() => openWhatsApp(detail)} />
                    )}
                    {detail.owner !== actor && (
                      <Button label={saved.includes(detail.id) ? 'Quitar de guardadas' : 'Guardar publicación'}
                        onPress={() => toggleSaved(detail.id)} />
                    )}
                  </View>
                  {detail.owner !== actor && (detailStatus === 'Disponible' || detailRequest?.status === 'accepted') && (
                    <Text style={styles.muted}>En esta demo eliges el contacto en WhatsApp. El mensaje queda listo para revisar.</Text>
                  )}
                  {contactError && <Text accessibilityRole="alert" style={styles.notice}>No se pudo abrir WhatsApp. Vuelve a intentarlo.</Text>}
                </View>
              </View>
              <View style={[styles.card, styles.cardBody]}>
                <Text accessibilityRole="header" style={styles.cardTitle}>Reseñas sobre {neighbors[detail.owner]}</Text>
                {reviews.length > 0 ? (
                  <>
                    <Text style={styles.muted}>Calificaciones y reseñas de ejemplo</Text>
                    {reviews.map((review) => (
                      <View key={review.author} style={styles.review}>
                        <View style={styles.row}>
                          <Text style={styles.publisherName}>{review.author}</Text>
                          <Text accessibilityLabel={`${review.stars} de 5 estrellas`} style={styles.stars}>
                            {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
                          </Text>
                        </View>
                        <Text style={styles.body}>{review.comment}</Text>
                      </View>
                    ))}
                  </>
                ) : <Text style={styles.muted}>Aún no hay reseñas.</Text>}
              </View>
            </View>
          ) : tab === 'Mi actividad' ? (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.cardTitle}>Mi actividad</Text>
              <Text style={styles.body}>Revisa tus solicitudes enviadas y recibidas.</Text>
              {activity.length === 0 && <Text style={styles.notice}>Aún no tienes solicitudes.</Text>}
              {activity.map(({ request, item, received }) => (
                <View key={`${item.id}-${request.requester}`} style={[styles.card, styles.cardBody]}>
                  <Text style={styles.eyebrow}>{received ? 'RECIBIDA' : 'ENVIADA'}</Text>
                  <Text accessibilityRole="header" style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.muted}>
                    {received ? `De ${neighbors[request.requester]}` : `Para ${neighbors[item.owner]}`}
                  </Text>
                  <Badge label={requestLabels[request.status]} />
                  {request.status === 'pending' && !received && (
                    <Text style={styles.notice}>Solicitud registrada en esta demo.</Text>
                  )}
                  <View style={styles.row}>
                    <Button label="Ver publicación" onPress={() => openDetail(item)} />
                    {received && request.status === 'pending' && (
                      <Button primary label="Aceptar solicitud" onPress={() => dispatch({
                        type: 'accept', publicationId: item.id, actor, requester: request.requester,
                      })} />
                    )}
                    {!received && request.status === 'accepted' && (
                      <Button primary label="Marcar como terminada" onPress={() => dispatch({
                        type: 'finish', publicationId: item.id, actor, requester: request.requester,
                      })} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.section}>
              {tab === 'Guardadas' && (
                <>
                  <Text accessibilityRole="header" style={styles.cardTitle}>Publicaciones guardadas</Text>
                  <Text style={styles.body}>Vuelve a las publicaciones que te interesan.</Text>
                </>
              )}
              {tab === 'Explorar' && (
                <>
                  <TextInput
                    accessibilityLabel="Buscar publicaciones"
                    placeholder="¿Qué necesitas? Ej. taladro"
                    placeholderTextColor="#52645d"
                    value={query}
                    onChangeText={(value) => {
                      setQuery(value);
                      setCardIndex(0);
                    }}
                    style={styles.search}
                  />
                  <View style={styles.row}>
                    <Button label="Tarjetas" selected={layout === 'Tarjetas'} onPress={() => setLayout('Tarjetas')} />
                    <Button label="Lista" selected={layout === 'Lista'} onPress={() => setLayout('Lista')} />
                  </View>
                </>
              )}
              {visible.length === 0 && (
                <Text style={styles.notice}>{tab === 'Guardadas' ? 'Aún no tienes publicaciones guardadas.' : 'No hay publicaciones que coincidan con la búsqueda.'}</Text>
              )}
              {isDeck && currentCard && (
                <View style={styles.section}>
                  <Text accessibilityLiveRegion="polite" style={styles.muted}>
                    {`Publicación ${cardIndex + 1} de ${visible.length}`}
                  </Text>
                  <View style={cardIndex < visible.length - 1 && styles.deckStack}>
                    {cardIndex < visible.length - 1 && <View aria-hidden style={styles.deckLayer} />}
                    <Animated.View
                      {...cardSwipe.panHandlers}
                      style={[
                        styles.card,
                        styles.deckCard,
                        Platform.OS === 'web' && webSwipeStyle,
                        { transform: [{ translateX: cardOffset }, { rotate: cardRotation }] },
                      ]}
                    >
                      <View style={styles.deckMeta}>
                        <Text style={styles.eyebrow}>{currentCard.kind.toUpperCase()}</Text>
                        <Badge label={publicationStatus(requests, currentCard.id)} />
                      </View>
                      <Text accessibilityRole="header" style={styles.cardTitle}>{currentCard.title}</Text>
                      <Text style={styles.muted}>{neighbors[currentCard.owner]} · {currentCard.location}</Text>
                      <ResourceArt item={currentCard} inset />
                      <Text style={styles.body}>{currentCard.description}</Text>
                      <View style={[styles.row, styles.deckActions]}>
                        <Button label="Ver detalle" onPress={() => openDetail(currentCard)} />
                        <Button
                          label={saved.includes(currentCard.id) ? 'Quitar de guardadas' : 'Guardar publicación'}
                          onPress={() => toggleSaved(currentCard.id)}
                        />
                      </View>
                    </Animated.View>
                  </View>
                  <View style={[styles.row, styles.deckControls]}>
                    <Button label="‹ Anterior" disabled={cardIndex === 0} onPress={() => setCardIndex(cardIndex - 1)} />
                    <Button label="Pasar ›" primary disabled={cardIndex === visible.length - 1} onPress={() => setCardIndex(cardIndex + 1)} />
                  </View>
                </View>
              )}
              {!isDeck && visible.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Ver ${item.title}`}
                    onPress={() => openDetail(item)}
                    style={({ pressed }) => [layout === 'Lista' && styles.listItem, pressed && styles.pressed]}
                  >
                    <ResourceArt item={item} compact={layout === 'Lista'} />
                    <View style={[styles.cardBody, layout === 'Lista' && styles.listContent]}>
                      <View style={styles.row}>
                        <Text style={styles.eyebrow}>{item.kind.toUpperCase()}</Text>
                        <Badge label={publicationStatus(requests, item.id)} />
                      </View>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.muted}>{neighbors[item.owner]} · {item.location}</Text>
                      <Text style={styles.body}>{item.description}</Text>
                    </View>
                  </Pressable>
                  <View style={styles.cardFooter}>
                    <Button label={saved.includes(item.id) ? 'Quitar de guardadas' : 'Guardar publicación'}
                      onPress={() => toggleSaved(item.id)} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7f3', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },
  container: { alignSelf: 'center', width: '100%', maxWidth: 680, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  section: { gap: 14 },
  title: { color: '#112b22', fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  cardTitle: { color: '#112b22', fontSize: 21, fontWeight: '700' },
  publisher: { backgroundColor: '#eef4f2', borderRadius: 10, padding: 12, gap: 4 },
  publisherName: { color: '#112b22', fontSize: 15, fontWeight: '700' },
  stars: { color: '#805700', fontSize: 16, letterSpacing: 1 },
  review: { borderTopWidth: 1, borderTopColor: '#d9e4dc', paddingTop: 10, gap: 4 },
  body: { color: '#253e34', fontSize: 16, lineHeight: 23 },
  muted: { color: '#52645d', fontSize: 14, lineHeight: 20 },
  eyebrow: { color: '#216142', fontSize: 12, fontWeight: '800', letterSpacing: 0.9 },
  badge: { alignSelf: 'flex-start', color: '#154a32', backgroundColor: '#e2efe3', fontSize: 12, fontWeight: '700', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  button: { minHeight: 44, justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#cddbd1', backgroundColor: '#fff' },
  buttonActive: { backgroundColor: '#17613e', borderColor: '#17613e' },
  buttonText: { color: '#194832', fontSize: 14, fontWeight: '700' },
  buttonTextActive: { color: '#fff' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
  search: { minHeight: 48, color: '#112b22', fontSize: 16, borderWidth: 1, borderColor: '#cddbd1', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d9e4dc', borderRadius: 18, overflow: 'hidden' },
  cardBody: { padding: 16, gap: 9 },
  cardFooter: { paddingHorizontal: 16, paddingBottom: 14, alignItems: 'flex-start' },
  deckStack: { paddingBottom: 8 },
  deckLayer: { position: 'absolute', bottom: 0, left: 9, right: 9, height: 26, borderRadius: 16, borderWidth: 1, borderColor: '#cddbd1', backgroundColor: '#e2efe3' },
  deckCard: { padding: 16, gap: 10 },
  deckActions: { marginTop: 10 },
  deckMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  deckArt: { height: 132, borderRadius: 14 },
  deckControls: { justifyContent: 'center' },
  notice: { backgroundColor: '#eef4f2', color: '#334f43', fontSize: 14, lineHeight: 21, padding: 12, borderRadius: 10 },
  art: { height: 168, alignItems: 'center', justifyContent: 'center' },
  detailBadge: { position: 'absolute', top: 12, right: 12 },
  artCompact: { width: 86, height: 86, borderRadius: 14, margin: 12 },
  symbol: { fontSize: 66 },
  symbolCompact: { fontSize: 35 },
  listItem: { flexDirection: 'row', alignItems: 'center' },
  listContent: { flex: 1, paddingLeft: 0 },
});
