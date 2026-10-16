import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAdminEnv } from "./env";

export function createAdminClient() {
  const { url, key } = requireSupabaseAdminEnv();
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
