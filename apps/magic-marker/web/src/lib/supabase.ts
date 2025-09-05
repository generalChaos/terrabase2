import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Global instances to prevent multiple client creation
declare global {
  var __supabase: SupabaseClient | undefined
  var __supabaseAdmin: SupabaseClient | undefined
}

// Singleton pattern using global variables (works in both server and client)
export const supabase = (() => {
  if (typeof window !== 'undefined') {
    // Client-side: use global variable
    if (!globalThis.__supabase) {
      globalThis.__supabase = createClient(supabaseUrl, supabaseAnonKey)
    }
    return globalThis.__supabase
  } else {
    // Server-side: create new instance
    return createClient(supabaseUrl, supabaseAnonKey)
  }
})()

// Admin client with service role key for full database access
export const supabaseAdmin = (() => {
  if (typeof window !== 'undefined') {
    // Client-side: use global variable
    if (!globalThis.__supabaseAdmin) {
      globalThis.__supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    }
    return globalThis.__supabaseAdmin
  } else {
    // Server-side: create new instance
    return createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
})()

// Database types
export interface Question {
  id: string
  text: string
  options?: string[]
  correct_answer?: number
  created_at: string
}

export interface Image {
  id: string
  original_path?: string
  final_path?: string
  created_at: string
}
