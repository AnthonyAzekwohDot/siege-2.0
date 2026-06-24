import { createClient } from "@supabase/supabase-js";

// Fallbacks keep `next build` from throwing during static page-data collection
// when env is absent (CI without secrets, an env-less local build). At runtime
// on Vercel the real values are always present, so the placeholders are never
// actually used to talk to a server.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
