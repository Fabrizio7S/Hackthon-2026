import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { offersApi as defaultApi, newClientRequestId } from '../data';
import type { OffersApi } from '../data/offersApi';
import type { Offer } from '../data/offerTypes';
import type { OfferErrors } from '../data/offerValidation';
import { isValidCoordinates, type Coordinates } from '../distance/distance';
import {
  EMPTY_OFFER_FORM,
  formStyles as styles,
  OfferFormFields,
  type OfferFormValues,
} from '../form/OfferFormFields';
import { useSubmitOnce } from '../submit/useSubmitOnce';

type Props = {
  /** Ubicación opcional proporcionada por el módulo de ubicación (Persona 5). */
  userLocation?: Coordinates | null;
  /** Se llama con la oferta ya guardada en Supabase. */
  onPublished?: (offer: Offer) => void;
  /** Para pruebas; por defecto usa el Supabase compartido. */
  api?: Pick<OffersApi, 'create'>;
};

/**
 * Formulario para publicar una oferta (D16, D17).
 * Si recibe `userLocation` válida, la adjunta a la oferta; si no, publica sin ubicación.
 */
export function PublishOfferScreen({ userLocation = null, onPublished, api = defaultApi }: Props) {
  const [values, setValues] = useState<OfferFormValues>(EMPTY_OFFER_FORM);
  const [errors, setErrors] = useState<OfferErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [published, setPublished] = useState<Offer | null>(null);

  // Se conserva entre reintentos para que el servidor reconozca el mismo envío.
  const requestId = useRef(newClientRequestId());

  const { submit, submitting } = useSubmitOnce(async () => {
    setGeneralError(null);
    setErrors({});
    const validLocation = isValidCoordinates(userLocation) ? userLocation : null;
    const result = await api.create({ ...values, location: validLocation }, requestId.current);
    if (result.ok) {
      requestId.current = newClientRequestId();
      setPublished(result.data);
      onPublished?.(result.data);
      return;
    }
    if (result.error.kind === 'formulario') {
      setErrors(result.error.errors);
    } else {
      setGeneralError(result.error.message);
    }
  });

  function startAnother() {
    setValues(EMPTY_OFFER_FORM);
    setPublished(null);
  }

  if (published) {
    return (
      <View style={styles.center}>
        <Text accessibilityRole="header" style={styles.title}>
          Oferta publicada
        </Text>
        <Text style={styles.body}>«{published.title}» ya está visible para tus vecinos.</Text>
        <Pressable
          accessibilityLabel="Publicar otra"
          accessibilityRole="button"
          onPress={startAnother}
          style={styles.primary}
        >
          <Text style={styles.primaryText}>Publicar otra</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={styles.title}>
          Publicar oferta
        </Text>

        <OfferFormFields
          errors={errors}
          onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
          values={values}
        />

        {generalError && (
          <Text accessibilityRole="alert" style={styles.generalError}>
            {generalError}
          </Text>
        )}

        <Pressable
          accessibilityLabel={submitting ? 'Publicando' : 'Publicar'}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting, busy: submitting }}
          disabled={submitting}
          onPress={() => void submit()}
          style={[styles.primary, submitting && styles.primaryDisabled]}
        >
          <Text style={styles.primaryText}>{submitting ? 'Publicando…' : 'Publicar'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
