import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';

if (!supabaseUrl || supabaseUrl === PLACEHOLDER_URL) {
  console.error(
    '[supabase] VITE_SUPABASE_URL yapılandırılmamış veya placeholder değerde. ' +
    'Kimlik doğrulama özelliği çalışmayacak. ' +
    '.env dosyasına VITE_SUPABASE_URL ekleyin.'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === PLACEHOLDER_KEY) {
  console.error(
    '[supabase] VITE_SUPABASE_ANON_KEY yapılandırılmamış veya placeholder değerde. ' +
    'Kimlik doğrulama özelliği çalışmayacak. ' +
    '.env dosyasına VITE_SUPABASE_ANON_KEY ekleyin.'
  );
}

export const supabase = createClient(
  supabaseUrl || PLACEHOLDER_URL,
  supabaseAnonKey || PLACEHOLDER_KEY
);

// Placeholder istemci mi? Diğer modüller bunu kontrol edebilir.
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl !== PLACEHOLDER_URL &&
  supabaseAnonKey !== PLACEHOLDER_KEY;
