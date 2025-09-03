import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface GameRoom {
  id: string
  code: string
  name?: string
  game_type: string
  state: any
  created_at: string
  updated_at: string
}

export interface Player {
  id: string
  room_id: string
  name: string
  avatar?: string
  is_host: boolean
  created_at: string
}

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
