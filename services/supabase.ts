import { createClient } from '@supabase/supabase-js';

// Fallback to the provided keys if environment variables are not injected.
// This prevents crashes in environments where .env.local isn't automatically loaded.
const FALLBACK_URL = 'https://tkkaemdzrotczkefrhig.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRra2FlbWR6cm90Y3prZWZyaGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MjM2NjksImV4cCI6MjA4NjI5OTY2OX0.mf2QZCPKvirkhlNXTb5pBPrwkgX0l0-ZoT-68qiVU_w';

// Safely retrieve env vars without crashing if 'process' is undefined
const getEnv = (key: string) => {
  try {
    return typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || FALLBACK_URL;
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || FALLBACK_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'CRITICAL ERROR: Supabase environment variables are missing. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signInAnonymously = async () => {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('Supabase Auth Error:', error.message);
      return null;
    }
    return data.session;
  } catch (err) {
    console.error('Unexpected auth error:', err);
    return null;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { session: data.session, error };
};

export const signUpWithEmail = async (email: string, password: string) => {
  // We use window.location.origin to ensure the user is redirected back to this app
  // after clicking the confirmation link in their real email inbox.
  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo
    }
  });
  return { session: data.session, user: data.user, error };
};
