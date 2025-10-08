// Team Design Flow Types
export interface TeamDesignFlow {
  id: string
  user_session_id: string // Anonymous session tracking
  team_name: string
  sport: string
  age_group: string
  round1_answers: Record<string, any>
  round2_questions: Question[]
  round2_answers: QuestionAnswer[]
  logo_prompt?: string
  logo_variants: LogoVariant[]
  selected_logo_id?: string
  logo_generated_at?: string
  current_step: FlowStep
  debug_mode: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type FlowStep = 'round1' | 'round2' | 'generating' | 'completed' | 'failed'

// Question Types (Simplified)
export interface Question {
  id: string
  text: string
  type: 'multiple_choice' | 'text'
  options?: string[] // For multiple choice questions
  selected: number | string // Index of selected option (0-based) or text input value
  required: boolean
}

export interface QuestionAnswer {
  question_id: string
  answer: string
}

// Logo Types
export interface LogoVariant {
  id: string
  variant_number: number
  is_selected: boolean
  file_path: string
  generation_prompt: string
  model_used: string
  generation_time_ms: number
  generation_cost_usd: number
  created_at: string
  public_url?: string
}

export interface TeamLogo {
  id: string
  flow_id: string
  file_path: string
  file_size?: number
  mime_type?: string
  storage_bucket: string
  variant_number: number
  is_selected: boolean
  generation_prompt: string
  model_used: string
  generation_time_ms: number
  generation_cost_usd: number
  created_at: string
  updated_at: string
}

// Question Set Types
export interface QuestionSet {
  id: string
  name: string
  sport?: string
  age_group?: string
  questions: Question[]
  is_generated: boolean
  generation_prompt?: string
  generation_model?: string
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Logo Prompt Types
export interface LogoPrompt {
  id: string
  name: string
  prompt_text: string
  model: string
  response_format: string
  max_tokens?: number
  temperature: number
  description?: string
  input_schema?: Record<string, any>
  output_schema?: Record<string, any>
  active: boolean
  version: number
  created_at: string
  updated_at: string
}

// Debug Types
export interface DebugLog {
  id: string
  flow_id?: string
  log_level: 'debug' | 'info' | 'warn' | 'error'
  category: 'question_generation' | 'logo_generation' | 'api' | 'database'
  message: string
  context?: Record<string, any>
  stack_trace?: string
  created_at: string
}

export interface SystemMetric {
  id: string
  metric_name: string
  metric_value: number
  metric_unit?: string
  time_period: 'hour' | 'day' | 'week'
  recorded_at: string
}

export interface ErrorPattern {
  id: string
  error_type: string
  error_message: string
  occurrence_count: number
  first_occurrence: string
  last_occurrence: string
  resolved: boolean
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface QuestionGenerationResponse {
  success: boolean
  questions?: Question[]
  error?: string
}

export interface LogoGenerationResponse {
  success: boolean
  variants?: LogoVariant[]
  error?: string
}

// Form Types
export interface Round1FormData {
  team_name: string
  sport: string
  logo_style: string
}

export interface Round2FormData {
  answers: QuestionAnswer[]
}

// Context Types
export interface QuestionGenerationContext {
  team: string
  sport: string
  age: string
}

export interface LogoGenerationContext {
  team: string
  sport: string
  age: string
  style: string
  colors: string
  mascot: string
}
