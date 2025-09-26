import OpenAI from 'openai'

// Client-side OpenAI instance
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Only for client-side usage
})

// Server-side OpenAI instance
export const createServerOpenAI = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

// Model configurations
export const MODELS = {
  QUESTION_GENERATION: 'gpt-4o-mini',
  LOGO_GENERATION: 'gpt-image-1',
} as const

// Token limits
export const TOKEN_LIMITS = {
  QUESTION_GENERATION: 500,
  LOGO_GENERATION: 1000,
} as const
