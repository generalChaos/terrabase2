// Simplified prompt system - only what we actually need
export type SimplePromptType = 
  | 'image_analysis'      // Image → Analysis text
  | 'questions_generation' // Analysis → Questions
  | 'image_prompt_creation' // Questions + Answers → Image prompt
  | 'image_generation'    // Image prompt → Image URL

// Simplified input/output mappings
export interface SimplePromptTypeMap {
  'image_analysis': {
    input: {
      image: string // base64 image
      context?: string // optional context
    }
    output: {
      analysis: string
    }
  }
  
  'questions_generation': {
    input: {
      analysis: string
    }
    output: {
      questions: Question[]
    }
  }
  
  'image_prompt_creation': {
    input: {
      questions: Question[]
      answers: string[]
    }
    output: {
      prompt: string
    }
  }
  
  'image_generation': {
    input: {
      prompt: string
    }
    output: {
      image_url: string
    }
  }
}

// Helper types
export type SimplePromptInput<T extends SimplePromptType> = SimplePromptTypeMap[T]['input']
export type SimplePromptOutput<T extends SimplePromptType> = SimplePromptTypeMap[T]['output']

export interface Question {
  id: string
  text: string
  type: 'multiple_choice'
  options: string[]
  required: boolean
}

// Simplified JSON Schema type
export interface SimpleJSONSchema {
  type: string
  properties?: Record<string, unknown>
  required?: string[]
  items?: unknown
  minLength?: number
  maxLength?: number
}

// Simplified output schemas
export const SIMPLE_OUTPUT_SCHEMAS: Record<SimplePromptType, SimpleJSONSchema> = {
  'image_analysis': {
    type: 'object',
    properties: {
      analysis: { type: 'string', minLength: 10 }
    },
    required: ['analysis']
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

  'image_prompt_creation': {
    type: 'object',
    properties: {
      prompt: { type: 'string', minLength: 20 }
    },
    required: ['prompt']
  },

  'image_generation': {
    type: 'object',
    properties: {
      image_url: { type: 'string' }
    },
    required: ['image_url']
  }
}

// Input schemas
export const SIMPLE_INPUT_SCHEMAS: Record<SimplePromptType, SimpleJSONSchema> = {
  'image_analysis': {
    type: 'object',
    properties: {
      image: { type: 'string' },
      context: { type: 'string' }
    },
    required: ['image']
  },

  'questions_generation': {
    type: 'object',
    properties: {
      analysis: { type: 'string', minLength: 10 }
    },
    required: ['analysis']
  },

  'image_prompt_creation': {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            text: { type: 'string' },
            type: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } },
            required: { type: 'boolean' }
          }
        }
      },
      answers: { type: 'array', items: { type: 'string' } }
    },
    required: ['questions', 'answers']
  },

  'image_generation': {
    type: 'object',
    properties: {
      prompt: { type: 'string', minLength: 10 }
    },
    required: ['prompt']
  }
}
