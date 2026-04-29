import { createClient } from '@supabase/supabase-js'

// Safe initialization for build-time (Vercel Prerendering)
// We provide dummy values during build to prevent the createClient constructor from throwing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (typeof window === 'undefined') {
    console.warn("Supabase credentials missing during build. DB features will be disabled.")
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
