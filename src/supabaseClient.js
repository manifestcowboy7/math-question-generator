// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Basic check if environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Make sure .env file is set up correctly.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: Export createClient if needed elsewhere, though usually just the client instance is fine
// export { createClient };