// Core prompt types
export type PromptType = 
  | 'image_analysis'
  | 'questions_generation' 
  | 'conversational_question'
  | 'image_prompt_creation'
  | 'answer_analysis'
  | 'image_generation'
  | 'conversation_summary'
  | 'artistic_style_analysis'
  | 'mood_analysis'
  | 'composition_analysis'
  | 'text_processing' // Simple text input → text output
  | 'image_text_analysis' // Image + text input → text output

// Input/Output type mappings
export interface PromptTypeMap {
  'image_analysis': {
    input: {
      image: string // base64 - always required
      context?: string // optional additional context
      analysis_type?: 'general' | 'artistic' | 'technical' | 'child_drawing'
      focus_areas?: string[] // what to pay attention to
      user_instructions?: string // specific user guidance
    }
    output: {
      analysis: string
      response?: string // optional additional response
      confidence_score?: number
      identified_elements?: string[]
      artistic_notes?: string
      technical_notes?: string
    }
  }
  
  'questions_generation': {
    input: {
      analysis: string
    }
    output: {
      questions: Question[]
      response?: string // optional additional response
    }
  }
  
  'conversational_question': {
    input: {
      analysis: string
      previousAnswers: string[]
      conversationContext: ConversationContext
    }
    output: {
      question: Question
      context: QuestionContext
      response?: string // optional additional response
    }
  }
  
  'image_prompt_creation': {
    input: {
      questions: Question[]
      answers: string[]
    }
    output: {
      prompt: string
      response?: string // optional additional response
    }
  }
  
  'answer_analysis': {
    input: {
      questions: Question[]
      answers: string[]
      analysis: string
    }
    output: {
      insights: string
      artistic_direction: string
      style_preferences: string[]
      response?: string // optional additional response
    }
  }
  
  'image_generation': {
    input: {
      prompt: string
    }
    output: {
      image_url: string
      response?: string // optional additional response
    }
  }
  
  'conversation_summary': {
    input: {
      conversationHistory: ConversationState
    }
    output: {
      summary: string
      key_insights: string[]
      artistic_theme: string
      response?: string // optional additional response
    }
  }
  
  'artistic_style_analysis': {
    input: {
      analysis: string
      userPreferences: string[]
    }
    output: {
      recommended_styles: string[]
      style_explanation: string
      confidence_score: number
      response?: string // optional additional response
    }
  }
  
  'mood_analysis': {
    input: {
      analysis: string
      color_palette?: string[]
    }
    output: {
      mood: string
      emotional_tone: string
      color_suggestions: string[]
      response?: string // optional additional response
    }
  }
  
  'composition_analysis': {
    input: {
      analysis: string
      artistic_goals: string[]
    }
    output: {
      composition_type: string
      focal_points: string[]
      balance_suggestions: string[]
      response?: string // optional additional response
    }
  }
  
  'text_processing': {
    input: {
      text: string
      context?: string // optional additional context
      instructions?: string // specific processing instructions
      format?: string // desired output format hints
    }
    output: {
      result: string
      response?: string // optional additional response
    }
  }
  
  'image_text_analysis': {
    input: {
      image: string // base64 image
      text: string // text prompt/instruction
      context?: string // optional additional context
      instructions?: string // specific processing instructions
    }
    output: {
      analysis: string
      response?: string // optional additional response
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
  return_schema: JSONSchema  // What the AI should return (auto-appended)
  
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

// Output Schemas for each prompt type
export const OUTPUT_SCHEMAS: Record<PromptType, JSONSchema> = {
  'image_analysis': {
    type: 'object',
    properties: {
      analysis: { type: 'string', minLength: 10 },
      response: { type: 'string' },
      confidence_score: { type: 'number', minimum: 0, maximum: 1 },
      identified_elements: { 
        type: 'array', 
        items: { type: 'string' } 
      },
      artistic_notes: { type: 'string' },
      technical_notes: { type: 'string' }
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
        maxItems: 15
      },
      response: { type: 'string' }
    },
    required: ['questions']
  },

  'conversational_question': {
    type: 'object',
    properties: {
      question: {
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
      context: {
        type: 'object',
        properties: {
          reasoning: { type: 'string', minLength: 10 },
          builds_on: { type: 'string', minLength: 5 },
          artistic_focus: { type: 'string', minLength: 5 }
        },
        required: ['reasoning', 'builds_on', 'artistic_focus']
      },
      response: { type: 'string' }
    },
    required: ['question', 'context']
  },

  'image_prompt_creation': {
    type: 'object',
    properties: {
      prompt: { type: 'string', minLength: 20 },
      response: { type: 'string' }
    },
    required: ['prompt']
  },

  'answer_analysis': {
    type: 'object',
    properties: {
      insights: { type: 'string', minLength: 20 },
      artistic_direction: { type: 'string', minLength: 10 },
      style_preferences: { 
        type: 'array', 
        items: { type: 'string' },
        minItems: 1
      },
      response: { type: 'string' }
    },
    required: ['insights', 'artistic_direction', 'style_preferences']
  },

  'image_generation': {
    type: 'object',
    properties: {
      image_url: { type: 'string', format: 'uri' },
      response: { type: 'string' }
    },
    required: ['image_url']
  },

  'conversation_summary': {
    type: 'object',
    properties: {
      summary: { type: 'string', minLength: 20 },
      key_insights: { 
        type: 'array', 
        items: { type: 'string' },
        minItems: 1
      },
      artistic_theme: { type: 'string', minLength: 5 },
      response: { type: 'string' }
    },
    required: ['summary', 'key_insights', 'artistic_theme']
  },

  'artistic_style_analysis': {
    type: 'object',
    properties: {
      recommended_styles: { 
        type: 'array', 
        items: { type: 'string' },
        minItems: 1
      },
      style_explanation: { type: 'string', minLength: 20 },
      confidence_score: { type: 'number', minimum: 0, maximum: 1 },
      response: { type: 'string' }
    },
    required: ['recommended_styles', 'style_explanation', 'confidence_score']
  },

  'mood_analysis': {
    type: 'object',
    properties: {
      mood: { type: 'string', minLength: 5 },
      emotional_tone: { type: 'string', minLength: 5 },
      color_suggestions: { 
        type: 'array', 
        items: { type: 'string' },
        minItems: 1
      },
      response: { type: 'string' }
    },
    required: ['mood', 'emotional_tone', 'color_suggestions']
  },

  'composition_analysis': {
    type: 'object',
    properties: {
      composition_type: { type: 'string', minLength: 5 },
      focal_points: { 
        type: 'array', 
        items: { type: 'string' },
        minItems: 1
      },
      balance_suggestions: { 
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      },
      response: { type: 'string' }
    },
    required: ['composition_type', 'focal_points', 'balance_suggestions']
  },

  'text_processing': {
    type: 'object',
    properties: {
      result: { type: 'string', minLength: 1 },
      response: { type: 'string' }
    },
    required: ['result']
  },

  'image_text_analysis': {
    type: 'object',
    properties: {
      analysis: { type: 'string', minLength: 10 },
      response: { type: 'string' }
    },
    required: ['analysis']
  }
}
