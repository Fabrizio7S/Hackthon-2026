import { launchImageLibraryAsync } from 'expo-image-picker';
import { useState } from 'react';
import { Image, Text, TextInput, View } from 'react-native';
import { colors } from '../../../shared/theme';
import { type Publication } from '../model/types';
import { type FavorPublicationDraft } from '../data';
import { Button } from './FavorButton';
import { styles } from '../styles/favors.styles';

export const publicationKinds = ['Préstamo', 'Intercambio'] as const;

export function PublicationForm({
  onCancel,
  onPublish,
  submitting = false,
}: {
  onCancel: () => void;
  onPublish: (draft: FavorPublicationDraft) => void;
  submitting?: boolean;
}) {
  const [kind, setKind] = useState<Publication['kind']>('Préstamo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string>();
  const [imageBase64, setImageBase64] = useState<string>();
  const [imageError, setImageError] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const missingFields = !title.trim() || !description.trim();

  async function chooseImage() {
    setImageError(false);
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 ?? undefined);
      }
    } catch {
      setImageError(true);
    }
  }

  function publish() {
    setAttempted(true);
    if (missingFields || submitting) return;
    onPublish({
      kind,
      title: title.trim(),
      description: description.trim(),
      imageUri,
      imageBase64,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Button icon="back" label="Volver" disabled={submitting} onPress={onCancel} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        Crear publicación
      </Text>
      <View style={[styles.card, styles.form]}>
        <Text style={styles.publisherName}>Tipo de publicación</Text>
        <View style={styles.row}>
          {publicationKinds.map((option) => (
            <Button
              key={option}
              label={option}
              selected={kind === option}
              onPress={() => setKind(option)}
            />
          ))}
        </View>
        <Text style={styles.publisherName}>Título</Text>
        <TextInput
          accessibilityLabel="Título"
          placeholder="Ej. Caja de herramientas"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={80}
          style={styles.search}
        />
        <Text style={styles.publisherName}>Descripción</Text>
        <TextInput
          accessibilityLabel="Descripción"
          placeholder="Cuenta qué prestas o qué te gustaría intercambiar."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          maxLength={600}
          multiline
          style={[styles.search, styles.descriptionInput]}
        />
        <Text style={styles.publisherName}>Imagen (opcional)</Text>
        {imageUri && (
          <Image
            accessibilityLabel="Vista previa de la imagen"
            source={{ uri: imageUri }}
            resizeMode="contain"
            style={styles.imagePreview}
          />
        )}
        <View style={styles.row}>
          <Button
            label={imageUri ? 'Cambiar imagen' : 'Seleccionar imagen'}
            onPress={() => void chooseImage()}
          />
          {imageUri && (
            <Button
              label="Quitar imagen"
              onPress={() => {
                setImageUri(undefined);
                setImageBase64(undefined);
              }}
            />
          )}
        </View>
        {imageError && (
          <Text accessibilityRole="alert" style={styles.notice}>
            No se pudo seleccionar la imagen. Inténtalo de nuevo.
          </Text>
        )}
        {attempted && missingFields && (
          <Text accessibilityRole="alert" style={styles.notice}>
            Completa el título y la descripción para publicar.
          </Text>
        )}
        <Button
          primary
          disabled={submitting}
          label={submitting ? 'Publicando…' : 'Publicar'}
          onPress={publish}
        />
      </View>
    </View>
  );
}
