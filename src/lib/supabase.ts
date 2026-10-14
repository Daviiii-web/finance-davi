import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Configure a URL e a chave pública do Supabase no .env.local.');
}

const query = new URLSearchParams(window.location.search);
const hash = new URLSearchParams(window.location.hash.slice(1));
export const authRedirect = {
  recoveryRequested: query.get('auth') === 'recovery' || hash.get('type') === 'recovery',
  hasError: hash.has('error') || hash.has('error_code') || query.has('error') || query.has('error_code'),
  accessToken: hash.get('access_token'),
};

export const supabase = createClient(supabaseUrl, supabaseKey);
