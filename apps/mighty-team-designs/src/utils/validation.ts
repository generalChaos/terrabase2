import { z } from 'zod'

// Round 1 form validation
export const round1Schema = z.object({
  team_name: z
    .string()
    .min(2, 'Team name must be at least 2 characters')
    .max(20, 'Team name must be less than 20 characters')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Team name can only contain letters, numbers, and spaces'),
  sport: z
    .string()
    .min(1, 'Please select a sport'),
  age_group: z
    .string()
    .min(1, 'Please select an age group'),
})

// Round 2 form validation
export const round2Schema = z.object({
  answers: z
    .array(
      z.object({
        question_id: z.string(),
        answer: z.string().min(1, 'Please provide an answer'),
      })
    )
    .min(1, 'Please answer all questions'),
})

// Question generation context validation
export const questionContextSchema = z.object({
  team: z.string().min(1),
  sport: z.string().min(1),
  age: z.string().min(1),
})

// Logo generation context validation
export const logoContextSchema = z.object({
  team: z.string().min(1),
  sport: z.string().min(1),
  age: z.string().min(1),
  style: z.string().min(1),
  colors: z.string().min(1),
  mascot: z.string().min(1),
})

// Environment variables validation
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  ADMIN_PASSWORD: z.string().min(1),
  NEXT_PUBLIC_DEBUG_MODE: z.string().optional(),
})

// Validate environment variables
export const validateEnv = () => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('Environment validation failed:', error)
    throw new Error('Invalid environment configuration')
  }
}
