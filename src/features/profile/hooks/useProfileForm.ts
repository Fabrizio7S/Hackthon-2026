import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as Clipboard from 'expo-clipboard';
import {
  formatPersonalCode,
  isPlaceholderName,
  normalizeDisplayName,
} from '../data/profileService';
import { useProfile } from './useProfile';

export function useProfileForm({
  client,
  userId,
  email,
  onSaved,
}: {
  client: SupabaseClient;
  userId: string;
  email: string | undefined;
  onSaved?: () => void;
}) {
  const profile = useProfile(client, userId);

  const [name, setName] = useState('');

  const [validation, setValidation] = useState<string | null>(null);

  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const [copying, setCopying] = useState(false);

  const copyBusy = useRef(false);

  const mounted = useRef(false);

  const displayCode = profile.profile ? formatPersonalCode(profile.profile.personal_code) : '';

  const needsName = isPlaceholderName(profile.profile?.display_name);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setName(needsName ? '' : (profile.profile?.display_name ?? ''));
  }, [profile.profile, needsName]);

  async function copyCode() {
    if (!profile.profile || copyBusy.current) return;
    copyBusy.current = true;
    setCopying(true);
    setCopyMessage(null);
    try {
      const copied = await Clipboard.setStringAsync(displayCode);
      if (mounted.current)
        setCopyMessage(
          copied ? `Código ${displayCode} copiado al portapapeles.` : 'No se pudo copiar.',
        );
    } catch {
      if (mounted.current) setCopyMessage('No se pudo copiar automáticamente.');
    } finally {
      copyBusy.current = false;
      if (mounted.current) setCopying(false);
    }
  }

  async function save() {
    try {
      const normalized = normalizeDisplayName(name);
      setValidation(null);
      if (await profile.save(normalized)) onSaved?.();
    } catch (failure) {
      setValidation(failure instanceof Error ? failure.message : 'Revisa el nombre.');
    }
  }
  return {
    profile,
    name,
    setName,
    validation,
    setValidation,
    copyMessage,
    copying,
    displayCode,
    needsName,
    copyCode,
    save,
    email,
  };
}
export type ProfilePanelModel = ReturnType<typeof useProfileForm>;
