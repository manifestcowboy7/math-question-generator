import { createClient } from '@supabase/supabase-js';

console.log("[supabaseClient.js] STARTING execution..."); // Added log

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("[supabaseClient.js] Supabase URL from env:", supabaseUrl ? 'Loaded' : 'MISSING!'); // Added log
console.log("[supabaseClient.js] Supabase Anon Key from env:", supabaseAnonKey ? 'Loaded' : 'MISSING!'); // Added log

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("!!! CRITICAL ERROR: Supabase URL or Anon Key MISSING !!!"); // More visible error
  // Throwing an error here might sometimes be swallowed depending on build process, logging is key.
  const errorMessage = `
      -------------------------------------------------------------
      ERROR: Supabase URL and/or Anon Key missing!
      -------------------------------------------------------------
      Please ensure:
      1. You have a file named '.env' in the project root directory.
      2. It contains your Supabase URL and Anon Key.
      3. The variable names have the correct prefix:
         - 'VITE_' for Vite projects (e.g., VITE_SUPABASE_URL)
         - 'REACT_APP_' for Create React App (e.g., REACT_APP_SUPABASE_URL)
      4. You have RESTARTED your development server after creating/modifying the .env file.
      -------------------------------------------------------------
  `;
  // Display error prominently in console and stop execution
  console.error(errorMessage);
  throw new Error("Supabase environment variables not configured correctly. See console for details.");
}

// Attempt to create the client
let supabase;
try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("[supabaseClient.js] Supabase client CREATED successfully."); // Added log
} catch (error) {
    console.error("[supabaseClient.js] FAILED to create Supabase client:", error);
    throw error; // Re-throw client creation error
}

// Export the client only if successfully created
export { supabase };