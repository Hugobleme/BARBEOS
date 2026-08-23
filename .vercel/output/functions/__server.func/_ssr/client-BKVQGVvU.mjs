import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
const DEFAULT_SUPABASE_URL = "https://hluuisbsqrxcgznslfjy.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsdXVpc2JzcXJ4Y2d6bnNsZmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDMyMjMsImV4cCI6MjA5MzkxOTIyM30.ViAcJcHn2HukrdAPASvJxk5gXR7xVg6gHDb_Jgvsyug";
function createSupabaseClient() {
  const SUPABASE_URL = typeof import.meta !== "undefined" && "https://hluuisbsqrxcgznslfjy.supabase.co" || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = typeof import.meta !== "undefined" && "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsdXVpc2JzcXJ4Y2d6bnNsZmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDMyMjMsImV4cCI6MjA5MzkxOTIyM30.ViAcJcHn2HukrdAPASvJxk5gXR7xVg6gHDb_Jgvsyug" || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
export {
  supabase as s
};
