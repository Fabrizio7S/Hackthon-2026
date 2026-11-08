import { FavorActivity } from '../components/FavorActivity';
import { FavorDetail } from '../components/FavorDetail';
import { useFavorsController } from '../hooks/useFavorsController';
import { TourTarget } from '../../../shared/ui/tour/TourTargets';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppIcon } from '../../../shared/ui/AppIcon';
import { SkeletonCardList } from '../../../shared/ui/Skeleton';
import { colors } from '../../../shared/theme';
import { publicationStatus } from '../model/requests';
import { webSwipeStyle, getOwnerDisplayName } from '../model/presentation';
import { Button } from '../components/FavorButton';
import { Badge } from '../components/FavorBadge';
import { ResourceArt } from '../components/ResourceArt';
import { PublicationForm } from '../components/PublicationForm';
import { styles } from '../styles/favors.styles';
import { tabs } from '../model/navigation';

export function FavorsScreen({
  client = null,
  initialCreating = false,
}: {
  client?: SupabaseClient | null;
  initialCreating?: boolean;
}) {
  const model = useFavorsController({ client, initialCreating });
  const {
    userId,
    remoteMode,
    tab,
    detail,
    query,
    setQuery,
    layout,
    setLayout,
    cardIndex,
    setCardIndex,
    cardOffset,
    saved,
    requests,
    creating,
    setCreating,
    submitting,
    loadingRemote,
    syncError,
    initialLoading,
    loadRemoteData,
    chooseTab,
    openDetail,
    publish,
    toggleSaved,
    visible,
    isDeck,
    canCreate,
    currentCard,
    currentCardSaved,
    cardSwipe,
    cardRotation,
  } = model;
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          key={creating ? 'crear' : (detail?.id ?? tab)}
          contentContainerStyle={[styles.scroll, canCreate && styles.scrollWithCreate]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={creating}
        >
          {creating ? (
            <PublicationForm
              onCancel={() => setCreating(false)}
              onPublish={(draft) => void publish(draft)}
              submitting={submitting}
            />
          ) : (
            <View style={styles.container}>
              <View style={styles.section}>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>HOY POR TI, MAÑANA POR MÍ</Text>
                    <Text accessibilityRole="header" style={styles.title}>
                      Favores
                    </Text>
                  </View>
                  {client && userId && (
                    <Button
                      label={loadingRemote ? 'Actualizando…' : 'Actualizar'}
                      disabled={loadingRemote}
                      onPress={() => void loadRemoteData()}
                    />
                  )}
                </View>
                {!detail && tab === 'Explorar' && (
                  <Text style={styles.body}>
                    Descubre préstamos e intercambios de tu comunidad.
                  </Text>
                )}
                {syncError && (
                  <Text accessibilityRole="alert" style={styles.notice}>
                    {syncError}
                  </Text>
                )}
                {!remoteMode && (
                  <Text style={styles.notice}>
                    Datos de demostración: estas publicaciones son ejemplos y no pertenecen a tu
                    comunidad.
                  </Text>
                )}
                {initialLoading && (
                  <SkeletonCardList count={2} accessibilityLabel="Cargando favores" />
                )}
              </View>
              {!detail && !initialLoading && (
                <TourTarget id="favors-tabs" accessibilityRole="tablist" style={styles.segment}>
                  {tabs.map((name) => (
                    <Pressable
                      key={name}
                      accessibilityRole="tab"
                      aria-selected={tab === name}
                      onPress={() => chooseTab(name)}
                      style={({ pressed }) => [
                        styles.segmentItem,
                        tab === name && styles.segmentItemActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.segmentText, tab === name && styles.segmentTextActive]}>
                        {name}
                      </Text>
                    </Pressable>
                  ))}
                </TourTarget>
              )}

              {initialLoading ? null : detail ? (
                <FavorDetail model={model} />
              ) : tab === 'Mi actividad' ? (
                <FavorActivity model={model} />
              ) : (
                <View style={styles.section}>
                  {tab === 'Guardadas' && (
                    <>
                      <Text accessibilityRole="header" style={styles.cardTitle}>
                        Publicaciones guardadas
                      </Text>
                      <Text style={styles.body}>Vuelve a las publicaciones que te interesan.</Text>
                    </>
                  )}
                  {tab === 'Explorar' && (
                    <>
                      <View style={styles.searchBox}>
                        <AppIcon name="search" size={20} color={colors.textMuted} />
                        <TextInput
                          accessibilityLabel="Buscar publicaciones"
                          placeholder="¿Qué necesitas? Ej. taladro"
                          placeholderTextColor={colors.textMuted}
                          value={query}
                          onChangeText={(value) => {
                            setQuery(value);
                            setCardIndex(0);
                          }}
                          style={styles.searchInput}
                        />
                      </View>
                      <View style={styles.row}>
                        <Button
                          label="Tarjetas"
                          selected={layout === 'Tarjetas'}
                          onPress={() => setLayout('Tarjetas')}
                        />
                        <Button
                          label="Lista"
                          selected={layout === 'Lista'}
                          onPress={() => setLayout('Lista')}
                        />
                      </View>
                    </>
                  )}
                  {visible.length === 0 && (
                    <Text style={styles.notice}>
                      {tab === 'Guardadas'
                        ? 'Aún no tienes publicaciones guardadas.'
                        : 'No hay publicaciones que coincidan con la búsqueda.'}
                    </Text>
                  )}
                  {isDeck && currentCard && (
                    <View style={styles.section}>
                      <Text accessibilityLiveRegion="polite" style={styles.muted}>
                        {`Publicación ${cardIndex + 1} de ${visible.length}`}
                      </Text>
                      <View style={cardIndex < visible.length - 1 && styles.deckStack}>
                        {cardIndex < visible.length - 1 && (
                          <View aria-hidden style={styles.deckLayer} />
                        )}
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
                          <Text accessibilityRole="header" style={styles.cardTitle}>
                            {currentCard.title}
                          </Text>
                          <Text style={styles.muted}>
                            {getOwnerDisplayName(currentCard)} · {currentCard.location}
                          </Text>
                          <ResourceArt item={currentCard} inset />
                          <Text style={styles.body}>{currentCard.description}</Text>
                          <View style={[styles.row, styles.deckActions]}>
                            <Button label="Ver detalle" onPress={() => openDetail(currentCard)} />
                          </View>
                        </Animated.View>
                      </View>
                      <View style={[styles.row, styles.deckControls]}>
                        <Button
                          icon="back"
                          label="Anterior"
                          disabled={cardIndex === 0}
                          onPress={() => setCardIndex(cardIndex - 1)}
                        />
                        <Button
                          icon="chevron"
                          iconAfter
                          label="Pasar"
                          primary
                          disabled={cardIndex === visible.length - 1}
                          onPress={() => setCardIndex(cardIndex + 1)}
                        />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            currentCardSaved ? 'Quitar de guardadas' : 'Guardar publicación'
                          }
                          aria-pressed={currentCardSaved}
                          onPress={() => toggleSaved(currentCard.id)}
                          style={({ pressed }) => [
                            styles.button,
                            styles.heartButton,
                            currentCardSaved && styles.buttonActive,
                            pressed && styles.pressed,
                          ]}
                        >
                          <AppIcon
                            name="heart"
                            size={22}
                            color={currentCardSaved ? colors.onPrimary : colors.primary}
                            weight={2}
                          />
                        </Pressable>
                      </View>
                    </View>
                  )}
                  {!isDeck &&
                    visible.map((item) => (
                      <View key={item.id} style={styles.card}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Ver ${item.title}`}
                          onPress={() => openDetail(item)}
                          style={({ pressed }) => [
                            layout === 'Lista' && styles.listItem,
                            pressed && styles.pressed,
                          ]}
                        >
                          <ResourceArt item={item} compact={layout === 'Lista'} />
                          <View style={[styles.cardBody, layout === 'Lista' && styles.listContent]}>
                            <View style={styles.row}>
                              <Text style={styles.eyebrow}>{item.kind.toUpperCase()}</Text>
                              <Badge label={publicationStatus(requests, item.id)} />
                            </View>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.muted}>
                              {getOwnerDisplayName(item)} · {item.location}
                            </Text>
                            <Text style={styles.body}>{item.description}</Text>
                          </View>
                        </Pressable>
                        <View style={styles.cardFooter}>
                          <Button
                            label={
                              saved.includes(item.id)
                                ? 'Quitar de guardadas'
                                : 'Guardar publicación'
                            }
                            onPress={() => toggleSaved(item.id)}
                          />
                        </View>
                      </View>
                    ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
        {canCreate && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crear publicación"
            onPress={() => setCreating(true)}
            style={({ pressed }) => [
              styles.button,
              styles.buttonActive,
              styles.createButton,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon name="plus" size={26} color={colors.lime} weight={2.4} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
