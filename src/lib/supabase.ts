import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Sin configuración no se crea el cliente. Las sesiones se implementarán después.
export const supabase =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })
    : null;
