// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

// SPEC-246: segunda trava (a primeira está no vite.config.ts). Nunca falar com o banco antigo (backup) em produção: aviso claro em vez de lista vazia.
if (import.meta.env.PROD && (SUPABASE_URL ?? '').includes('vcvcwzmbiftcawncibke')) {
  throw new Error('Configuração apontando para o banco antigo (backup). Corrija VITE_SUPABASE_URL para o banco oficial de São Paulo.')
}
const SUPABASE_PUBLISHABLE_KEY = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string

// Import the supabase client like this:
// import { supabase } from "@/lib/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
