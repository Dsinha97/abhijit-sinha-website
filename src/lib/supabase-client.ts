/**
 * Browser-side Supabase client for the admin panel.
 *
 * IMPORTANT: this module is client-side only. Importing it from an .astro
 * frontmatter block would run it during `astro build`, where there is no
 * browser storage for the auth session — the build-time content path uses plain
 * fetch in src/lib/knowledge.ts precisely to avoid that.
 *
 * The anon key here is public by design and belongs in the bundle. What
 * protects the data is Postgres Row Level Security plus the admin_allowlist
 * table: a Supabase account on its own grants nothing. The service_role key
 * must never appear anywhere under src/, public/ or .env.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

let client: SupabaseClient | null = null;

/** Returns null when Supabase is not configured, so the admin shell can render
 *  an explanatory card instead of throwing on a blank screen. */
export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}

export const supabaseUrl = SUPABASE_URL;
