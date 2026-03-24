import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EMPRESAS } from '../config/empresas';

// Estado mutável — trocado ao selecionar empresa
const _state = {
  client: createClient(EMPRESAS[0].supabaseUrl, EMPRESAS[0].supabaseKey),
};

// Proxy: toda chamada a `supabase.from(...)` etc. delega ao cliente atual
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    return (_state.client as any)[prop];
  },
});

export function initSupabase(url: string, key: string) {
  _state.client = createClient(url, key);
}
