import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';

import { offersApi as defaultApi } from '../data';
import type { OffersApi } from '../data/offersApi';
import type { Offer } from '../data/offerTypes';
import type { OfferErrors } from '../data/offerValidation';
import { formStyles as styles, OfferFormFields, type OfferFormValues } from '../form/OfferFormFields';
import { ListLoadError } from '../list/listLoader';
import { ListStateView } from '../list/ListStateView';
import { useListLoader } from '../list/useListLoader';
import { useSubmitOnce } from '../submit/useSubmitOnce';

type Props = {
  offerId: string;
  /** Se llama con la oferta ya guardada en Supabase. */
  onSaved?: (offer: Offer) => void;
  /** Para pruebas; por defecto usa el Supabase compartido. */
  api?: Pick<OffersApi, 'getById' | 'update'>;
};

/** Editar una oferta propia: todos los campos salvo el tipo (issue #2, bloque 1; D19). */
export function EditOfferScreen({ offerId, onSaved, api = defaultApi }: Props) {
  const { state, reload } = useListLoader(async () => {
    const result = await api.getById(offerId);
    if (!result.ok) throw new ListLoadError(result.error.message);
    return [result.data];
  });

  return (
    <ListStateView emptyMessage="Esta oferta ya no está disponible." onRetry={() => void reload()} state={state}>
      {([offer]) => <EditForm api={api} offer={offer} onSaved={onSaved} />}
    </ListStateView>
  );
}

function EditForm({
  offer,
  onSaved,
  api,
}: {
  offer: Offer;
  onSaved?: (offer: Offer) => void;
  api: NonNullable<Props['api']>;
}) {
  const [values, setValues] = useState<OfferFormValues>({
    kind: offer.kind,
    title: offer.title,
    description: offer.description ?? '',
    contactPhone: offer.contactPhone,
  });
  const [errors, setErrors] = useState<OfferErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { submit, submitting } = useSubmitOnce(async () => {
    setGeneralError(null);
    setErrors({});
    setSaved(false);
    // La ubicación se conserva hasta integrar la de Persona 5.
    const result = await api.update(offer.id, { ...values, kind: offer.kind, location: offer.location });
    if (result.ok) {
      setSaved(true);
      onSaved?.(result.data);
      return;
    }
    if (result.error.kind === 'formulario') setErrors(result.error.errors);
    else setGeneralError(result.error.message);
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={styles.title}>
          Editar oferta
        </Text>

        <OfferFormFields
          errors={errors}
          kindLocked
          onChange={(patch) => {
            setSaved(false);
            setValues((v) => ({ ...v, ...patch }));
          }}
          values={values}
        />

        {generalError && (
          <Text accessibilityRole="alert" style={styles.generalError}>
            {generalError}
          </Text>
        )}
        {saved && (
          <Text accessibilityRole="alert" style={styles.body}>
            Cambios guardados.
          </Text>
        )}

        <Pressable
          accessibilityLabel={submitting ? 'Guardando' : 'Guardar cambios'}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting, busy: submitting }}
          disabled={submitting}
          onPress={() => void submit()}
          style={[styles.primary, submitting && styles.primaryDisabled]}
        >
          <Text style={styles.primaryText}>{submitting ? 'Guardando…' : 'Guardar cambios'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
