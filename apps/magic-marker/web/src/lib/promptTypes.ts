// Core prompt types - SIMPLIFIED
export type PromptType = 
  | 'image_analysis'      // Image + prompt → response
  | 'questions_generation' // Analysis → questions
  | 'image_generation'    // Prompt → image_base64
  | 'text_processing'     // Prompt → response

// SIMPLIFIED Input/Output type mappings
export interface PromptTypeMap {
  'image_analysis': {
    input: {
      image: string // base64 image
      prompt: string // text prompt for analysis
    }
    output: {
      response: string // analysis text
    }
  }
  
  'questions_generation': {
    input: {
      response: string
    }
    output: {
      questions: Question[]
    }
  }
  
  'image_generation': {
    input: {
      prompt: string
    }
    output: {
      image_base64: string
    }
  }
  
  'text_processing': {
    input: {
      prompt: string
    }
    output: {
      response: string
    }
  }
  
}

// Helper types
export type PromptInput<T extends PromptType> = PromptTypeMap[T]['input']
export type PromptOutput<T extends PromptType> = PromptTypeMap[T]['output']

// Existing types we need to define
export interface Question {
  id: string
  text: string
  type: 'multiple_choice'
  options: string[]
  required: boolean
}

export interface ConversationContext {
  questions: Question[]
  artisticDirection?: string
  previousAnswers: string[]
}

export interface QuestionContext {
  reasoning: string
  builds_on: string
  artistic_focus: string
}

export interface ConversationState {
  questions: Question[]
  totalQuestions: number
  currentQuestionIndex: number
  contextData: {
    previousAnswers: string[]
    artisticDirection?: string
  }
}

// Prompt Definition Interface
export interface PromptDefinition<T extends PromptType = PromptType> {
  id: string
  name: string
  type: T
  
  // Schemas for validation
  input_schema: JSONSchema
  output_schema: JSONSchema
  
  // Prompt components
  prompt_text: string        // The actual prompt content
  
  // Model configuration
  model: string
  response_format: 'json_object' | 'text'
  max_tokens?: number
  temperature?: number
  
  // Metadata
  active: boolean
  created_at: string
  updated_at: string
}

// JSON Schema type (simplified for now)
export interface JSONSchema {
  type: string
  properties?: Record<string, unknown>
  required?: string[]
  items?: unknown
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
}

// SIMPLIFIED Output Schemas for each prompt type
export const OUTPUT_SCHEMAS: Record<PromptType, JSONSchema> = {
  'image_analysis': {
    type: 'object',
    properties: {
      response: { type: 'string', minLength: 10 }
    },
    required: ['response']
  },

  'questions_generation': {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            text: { type: 'string', minLength: 10 },
            type: { type: 'string', enum: ['multiple_choice'] },
            options: { 
              type: 'array', 
              items: { type: 'string' },
              minItems: 2,
              maxItems: 6
            },
            required: { type: 'boolean' }
          },
          required: ['id', 'text', 'type', 'options', 'required']
        },
        minItems: 3,
        maxItems: 10
      }
    },
    required: ['questions']
  },

  'image_generation': {
    type: 'object',
    properties: {
      image_base64: { type: 'string', minLength: 100 }
    },
    required: ['image_base64']
  },

  'text_processing': {
    type: 'object',
    properties: {
      response: { type: 'string', minLength: 1 }
    },
    required: ['response']
  },


}
