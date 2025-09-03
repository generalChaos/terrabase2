import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Question {
  id: string
  text: string
  options?: any
  correct_answer?: number
  created_at: string
}

export interface Image {
  id: string
  original_path?: string
  final_path?: string
  created_at: string
}
