// Instancia conectada al cliente compartido de Supabase.
import { supabase } from '../../../lib/supabase';
import { createOffersApi } from './offersApi';

export const offersApi = createOffersApi(supabase);
export { newClientRequestId } from './offersApi';
