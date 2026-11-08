import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { offersApi as defaultApi } from '../data';
import type { OffersApi } from '../data/offersApi';
import type { Offer } from '../data/offerTypes';
import { ListLoadError } from '../list/listLoader';
import { ListStateView } from '../list/ListStateView';
import { useListLoader } from '../list/useListLoader';
import { useSubmitOnce } from '../submit/useSubmitOnce';
import { colors } from '../theme';

type Props = {
  /** Abre la edición de una oferta (navegación de Persona 5). */
  onEditOffer?: (offer: Offer) => void;
  /** Para pruebas; por defecto usa el Supabase compartido. */
  api?: Pick<OffersApi, 'listMine' | 'setStatus'>;
};

const KIND_LABEL = { servicio: 'Servicio', producto: 'Producto' } as const;

/** Ofertas propias con editar, retirar y reactivar (issue #2, bloque 1; D19). */
export function MyOffersScreen({ onEditOffer, api = defaultApi }: Props) {
  const { state, reload } = useListLoader(async () => {
    const result = await api.listMine();
    if (!result.ok) throw new ListLoadError(result.error.message);
    return result.data;
  });

  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={styles.header}>
        Mis ofertas
      </Text>
      <ListStateView emptyMessage="Todavía no publicaste ofertas." onRetry={() => void reload()} state={state}>
        {(offers) => (
          <FlatList
            contentContainerStyle={styles.list}
            data={offers}
            keyExtractor={(o) => o.id}
            renderItem={({ item }) => <MyOfferCard api={api} initial={item} onEdit={onEditOffer} />}
          />
        )}
      </ListStateView>
    </View>
  );
}

function MyOfferCard({
  initial,
  onEdit,
  api,
}: {
  initial: Offer;
  onEdit?: (offer: Offer) => void;
  api: NonNullable<Props['api']>;
}) {
  const [offer, setOffer] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const active = offer.status === 'activa';

  // El estado mostrado cambia solo cuando el servidor confirma.
  const { submit: toggle, submitting } = useSubmitOnce(async () => {
    setMessage(null);
    const result = await api.setStatus(offer.id, active ? 'retirada' : 'activa');
    if (result.ok) setOffer(result.data);
    else setMessage(result.error.message);
  });

  const toggleLabel = submitting ? 'Guardando…' : active ? 'Retirar' : 'Reactivar';

  return (
    <View style={styles.card}>
      <View style={styles.badges}>
        <Text style={styles.kind}>{KIND_LABEL[offer.kind]}</Text>
        <Text style={[styles.status, active ? styles.statusActive : styles.statusRetired]}>
          {active ? 'Activa' : 'Retirada'}
        </Text>
      </View>
      <Text numberOfLines={2} style={styles.title}>
        {offer.title}
      </Text>
      {!active && <Text style={styles.muted}>Los vecinos no la ven mientras esté retirada.</Text>}

      <View style={styles.actions}>
        {onEdit && (
          <Pressable
            accessibilityLabel={`Editar ${offer.title}`}
            accessibilityRole="button"
            onPress={() => onEdit(offer)}
            style={[styles.button, styles.secondary]}
          >
            <Text style={styles.secondaryText}>Editar</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityLabel={`${toggleLabel} ${offer.title}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting, busy: submitting }}
          disabled={submitting}
          onPress={() => void toggle()}
          style={[styles.button, active ? styles.danger : styles.primary, submitting && styles.disabled]}
        >
          <Text style={styles.buttonText}>{toggleLabel}</Text>
        </Pressable>
      </View>
      {message && (
        <Text accessibilityRole="alert" style={styles.error}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: { color: colors.text, fontSize: 24, fontWeight: '700', paddingHorizontal: 20, paddingVertical: 16 },
  list: { gap: 12, paddingBottom: 24, paddingHorizontal: 16 },
  card: { borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: 16 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  kind: {
    backgroundColor: colors.primarySurface,
    borderRadius: 10,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  status: { borderRadius: 10, fontSize: 13, fontWeight: '600', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 2 },
  statusActive: { backgroundColor: colors.primarySurface, color: colors.text },
  statusRetired: { backgroundColor: colors.dangerSurface, color: colors.danger },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  muted: { color: colors.textMuted, fontSize: 15, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  button: { alignItems: 'center', borderRadius: 14, flex: 1, paddingVertical: 12 },
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
  secondary: { borderColor: colors.primary, borderWidth: 2 },
  secondaryText: { color: colors.text, fontSize: 17, fontWeight: '700' },
  error: {
    backgroundColor: colors.dangerSurface,
    borderRadius: 14,
    color: colors.danger,
    fontSize: 15,
    marginTop: 12,
    padding: 10,
  },
});
