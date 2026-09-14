import { createClient } from '@supabase/supabase-js';

// Supabase Live Remote Configuration
const supabaseUrl = ((import.meta as any)?.env?.VITE_SUPABASE_URL as string) || 'https://poslfknqmvhxextngbeb.supabase.co';
const supabaseAnonKey = ((import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_PsQ86Jq4B9jH8f2w';

export const isRealSupabaseConnected = Boolean(
  supabaseUrl && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('mock-supabase') &&
  supabaseAnonKey
);

export const SUPABASE_PROJECT_URL = supabaseUrl;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

