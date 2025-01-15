/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly REACT_APP_API_URL: string; // Add this line for REACT_APP_API_URL
  // Add more environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}