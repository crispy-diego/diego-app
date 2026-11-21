import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// La dirección y la llave pública del proyecto vienen de .env (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).
// Son públicas por diseño. Si faltan, la app funciona igual pero sin servidor (agenda de ejemplo).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
