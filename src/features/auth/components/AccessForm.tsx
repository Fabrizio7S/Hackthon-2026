import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../../../shared/theme';
import { WelcomeStory } from './WelcomeStory';
import { styles } from '../styles/auth.styles';
import type { AccessFormModel } from '../hooks/useAccessForm';

export function AccessForm({ model }: { model: AccessFormModel }) {
  const { width, mode, setMode, email, setEmail, password, setPassword, submit, auth } = model;
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.centerContainer, { alignItems: 'center' }]}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 1120,
            gap: 32,
            flexDirection: width >= 900 ? 'row' : 'column',
            alignItems: 'center',
          }}
        >
          <WelcomeStory />
          <View style={[styles.authCard, width >= 900 && { flex: 1 }]}>
            <Text accessibilityRole="header" style={styles.authTitle}>
              {mode === 'signIn' ? 'Iniciar sesión' : 'Crear cuenta'}
            </Text>
            <Text style={styles.authSubtitle}>Red de apoyo, productos y servicios vecinales</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                accessibilityLabel="Correo electrónico"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                placeholder="tu@correo.com"
                placeholderTextColor={colors.textMuted}
                editable={!auth.pending}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                accessibilityLabel="Contraseña"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                editable={!auth.pending}
                onSubmitEditing={() => {
                  void submit();
                }}
              />
            </View>

            {auth.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText} accessibilityRole="alert">
                  {auth.error}
                </Text>
              </View>
            )}

            {auth.message && (
              <View style={styles.messageBox}>
                <Text style={styles.messageText} accessibilityLiveRegion="polite">
                  {auth.message}
                </Text>
              </View>
            )}

            <Pressable
              style={[styles.buttonPrimary, auth.pending && styles.buttonDisabled]}
              disabled={auth.pending}
              onPress={() => {
                void submit();
              }}
            >
              <Text style={styles.buttonPrimaryText}>
                {auth.pending
                  ? 'Enviando…'
                  : mode === 'signIn'
                    ? 'Entrar a mi red vecinal'
                    : 'Crear mi cuenta'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.buttonSwitch}
              disabled={auth.pending}
              onPress={() => {
                setMode(mode === 'signIn' ? 'signUp' : 'signIn');
                setPassword('');
                auth.clearFeedback();
              }}
            >
              <Text style={styles.buttonSwitchText}>
                {mode === 'signIn'
                  ? '¿No tienes cuenta? Regístrate aquí'
                  : '¿Ya tienes cuenta? Inicia sesión'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
