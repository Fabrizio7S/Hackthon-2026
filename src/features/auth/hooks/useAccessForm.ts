import { useEffect, useState } from 'react';
import { BackHandler, useWindowDimensions } from 'react-native';
import type { AccessMode } from '../data/authService';
import { useAuth } from './useAuth';
import { useSessionIdentity } from '../../../shared/identity/IdentityContext';

export function useAccessForm(auth: ReturnType<typeof useAuth>) {
  const identity = useSessionIdentity();
  const { width } = useWindowDimensions();

  const [mode, setMode] = useState<AccessMode>('signIn');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  useEffect(() => {
    if (mode !== 'signUp' || auth.session) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!auth.pending) {
        setMode('signIn');
        setPassword('');
        auth.clearFeedback();
      }
      return true;
    });
    return () => subscription.remove();
  }, [mode, auth.session, auth.pending, auth.clearFeedback]);

  useEffect(() => {
    if (identity.status === 'authenticated') setMode('signIn');
  }, [identity.status]);

  async function submit() {
    if (await auth.submit(mode, email, password)) setPassword('');
  }
  return { width, mode, setMode, email, setEmail, password, setPassword, submit };
}

export type AccessFormModel = ReturnType<typeof useAccessForm> & {
  auth: ReturnType<typeof useAuth>;
};
