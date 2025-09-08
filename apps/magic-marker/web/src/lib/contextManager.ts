import { Question } from './newTypes'
import { ContextLogger } from './contextLogger'

/**
 * Enhanced context data structure that extends the existing context_data
 * Maintains backward compatibility while adding new features
 */
export interface EnhancedContextData {
  // Existing fields (maintain backward compatibility)
  imageAnalysis: string
  previousAnswers: string[]
  artisticDirection: string
  
  // New enhanced fields
  stepResults: {
    [stepName: string]: {
      input: Record<string, unknown>
      output: Record<string, unknown>
      timestamp: string
      success: boolean
      tokensUsed?: number
      costUsd?: number
    }
  }
  conversationHistory: ConversationEntry[]
  userPreferences: {
    stylePreferences: string[]
    colorPreferences: string[]
    moodPreferences: string[]
    compositionPreferences: string[]
  }
  metadata: {
    totalTokens: number
    totalCost: number
    lastUpdated: string
    flowId: string
  }
  
  // Index signature to allow additional properties
  [key: string]: unknown
}

export interface ConversationEntry {
  step: string
  question: Question
  answer?: string
  timestamp: string
  context?: Record<string, unknown>
}

export interface StepContext {
  flowId: string
  currentStep: string
  stepOrder: number
  contextData: EnhancedContextData
}

/**
 * Context Manager Service
 * Handles context building, updating, and retrieval for prompt steps
 */
export class ContextManager {
  /**
   * Build context for a specific step using existing context_data
   */
  static buildContextForStep(
    flowId: string,
    currentStep: string,
    stepOrder: number,
    currentContextData: Record<string, unknown>
  ): StepContext {
    const requestId = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    ContextLogger.log('debug', 'context', currentStep, flowId, requestId,
      `Building context for step: ${currentStep}`, {
        flowId: flowId.substring(0, 8) + '...',
        stepOrder,
        hasExistingContext: !!currentContextData,
        contextDataKeys: Object.keys(currentContextData)
      })

    // Convert existing context_data to enhanced format
    const enhancedContext = this.convertToEnhancedContext(
      currentContextData,
      flowId
    )

    const stepContext = {
      flowId,
      currentStep,
      stepOrder,
      contextData: enhancedContext
    }

    ContextLogger.log('info', 'context', currentStep, flowId, requestId,
      `Context built successfully for step: ${currentStep}`, {
        enhancedContextKeys: Object.keys(enhancedContext),
        contextSize: JSON.stringify(enhancedContext).length
      })

    return stepContext
  }

  /**
   * Update context with step results
   */
  static updateContextWithStepResult(
    contextData: Record<string, unknown>,
    stepName: string,
    stepResult: {
      input: Record<string, unknown>
      output: Record<string, unknown>
      success: boolean
      tokensUsed?: number
      costUsd?: number
    }
  ): Record<string, unknown> {
    console.log(`🔄 [ContextManager] Updating context with step result: ${stepName}`, {
      success: stepResult.success,
      tokensUsed: stepResult.tokensUsed
    })

    // Ensure we have the enhanced structure
    const enhancedContext = this.convertToEnhancedContext(contextData)
    
    // Update step results
    enhancedContext.stepResults[stepName] = {
      input: stepResult.input,
      output: stepResult.output,
      timestamp: new Date().toISOString(),
      success: stepResult.success,
      tokensUsed: stepResult.tokensUsed,
      costUsd: stepResult.costUsd
    }

    // Update metadata
    enhancedContext.metadata.lastUpdated = new Date().toISOString()
    if (stepResult.tokensUsed) {
      enhancedContext.metadata.totalTokens += stepResult.tokensUsed
    }
    if (stepResult.costUsd) {
      enhancedContext.metadata.totalCost += stepResult.costUsd
    }

    return enhancedContext
  }

  /**
   * Get relevant context for a specific step
   */
  static getRelevantContextForStep(
    contextData: Record<string, unknown>,
    stepName: string,
    flowId?: string
  ): Record<string, unknown> {
    const requestId = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    ContextLogger.log('debug', 'context', stepName, flowId || 'unknown', requestId,
      `Getting relevant context for step: ${stepName}`)

    const enhancedContext = this.convertToEnhancedContext(contextData, flowId)
    
    // Define context requirements for each step type
    const contextRequirements = {
      'questions_generation': {
        required: ['imageAnalysis'],
        optional: ['artisticDirection', 'userPreferences']
      },
      'conversational_question': {
        required: ['imageAnalysis', 'stepResults.questions_generation'],
        optional: ['artisticDirection', 'conversationHistory', 'userPreferences']
      },
      'image_generation': {
        required: ['imageAnalysis', 'stepResults.questions_generation', 'stepResults.conversational_question'],
        optional: ['artisticDirection', 'conversationHistory', 'userPreferences', 'stepResults']
      }
    }

    const requirements = contextRequirements[stepName as keyof typeof contextRequirements]
    if (!requirements) {
      ContextLogger.log('warn', 'context', stepName, flowId || 'unknown', requestId,
        `No context requirements defined for step: ${stepName}`)
      return enhancedContext
    }

    // Build relevant context based on requirements
    const relevantContext: Record<string, unknown> = {}
    
    // Add required fields
    requirements.required.forEach(field => {
      const value = this.getNestedValue(enhancedContext, field)
      if (value !== undefined) {
        this.setNestedValue(relevantContext, field, value)
      } else {
        ContextLogger.log('warn', 'context', stepName, flowId || 'unknown', requestId,
          `Required field missing: ${field}`)
      }
    })

    // Add optional fields if available
    requirements.optional.forEach(field => {
      const value = this.getNestedValue(enhancedContext, field)
      if (value !== undefined) {
        this.setNestedValue(relevantContext, field, value)
      }
    })

    ContextLogger.logContextBuilding(
      flowId || 'unknown',
      requestId,
      stepName,
      enhancedContext,
      relevantContext
    )

    return relevantContext
  }

  /**
   * Convert existing context_data to enhanced format
   */
  private static convertToEnhancedContext(
    contextData: Record<string, unknown>,
    flowId: string = ''
  ): EnhancedContextData {
    // Start with default enhanced structure
    const enhanced: EnhancedContextData = {
      imageAnalysis: '',
      previousAnswers: [],
      artisticDirection: '',
      stepResults: {},
      conversationHistory: [],
      userPreferences: {
        stylePreferences: [],
        colorPreferences: [],
        moodPreferences: [],
        compositionPreferences: []
      },
      metadata: {
        totalTokens: 0,
        totalCost: 0,
        lastUpdated: new Date().toISOString(),
        flowId: flowId || ''
      }
    }

    // Map existing fields
    if (contextData.imageAnalysis && typeof contextData.imageAnalysis === 'string') {
      enhanced.imageAnalysis = contextData.imageAnalysis
    }
    
    if (contextData.previousAnswers && Array.isArray(contextData.previousAnswers)) {
      enhanced.previousAnswers = contextData.previousAnswers as string[]
    }
    
    if (contextData.artisticDirection && typeof contextData.artisticDirection === 'string') {
      enhanced.artisticDirection = contextData.artisticDirection
    }

    // Map existing step results if they exist
    if (contextData.stepResults && typeof contextData.stepResults === 'object') {
      enhanced.stepResults = contextData.stepResults as {
        [stepName: string]: {
          input: Record<string, unknown>
          output: Record<string, unknown>
          timestamp: string
          success: boolean
          tokensUsed?: number
          costUsd?: number
        }
      }
    }

    // Map existing conversation history if it exists
    if (contextData.conversationHistory && Array.isArray(contextData.conversationHistory)) {
      enhanced.conversationHistory = contextData.conversationHistory as ConversationEntry[]
    }

    // Map existing user preferences if they exist
    if (contextData.userPreferences && typeof contextData.userPreferences === 'object') {
      enhanced.userPreferences = { ...enhanced.userPreferences, ...contextData.userPreferences as Record<string, unknown> }
    }

    // Map existing metadata if it exists
    if (contextData.metadata && typeof contextData.metadata === 'object') {
      enhanced.metadata = { ...enhanced.metadata, ...contextData.metadata as Record<string, unknown> }
    }

    return enhanced
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key]
      }
      return undefined
    }, obj)
  }

  /**
   * Set nested value in object using dot notation
   */
  private static setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current: Record<string, unknown>, key: string) => {
      if (!current[key]) current[key] = {}
      return current[key] as Record<string, unknown>
    }, obj)
    target[lastKey] = value
  }

  /**
   * Add conversation entry to context
   */
  static addConversationEntry(
    contextData: Record<string, unknown>,
    step: string,
    question: Question,
    answer?: string,
    context?: Record<string, unknown>
  ): Record<string, unknown> {
    const enhancedContext = this.convertToEnhancedContext(contextData)
    
    const entry: ConversationEntry = {
      step,
      question,
      answer,
      timestamp: new Date().toISOString(),
      context
    }

    enhancedContext.conversationHistory.push(entry)
    enhancedContext.metadata.lastUpdated = new Date().toISOString()

    return enhancedContext
  }

  /**
   * Update user preferences in context
   */
  static updateUserPreferences(
    contextData: Record<string, unknown>,
    preferences: Partial<{
      stylePreferences: string[]
      colorPreferences: string[]
      moodPreferences: string[]
      compositionPreferences: string[]
    }>
  ): Record<string, unknown> {
    const enhancedContext = this.convertToEnhancedContext(contextData)
    
    Object.entries(preferences).forEach(([key, value]) => {
      if (value && Array.isArray(value)) {
        enhancedContext.userPreferences[key as keyof typeof enhancedContext.userPreferences] = value
      }
    })

    enhancedContext.metadata.lastUpdated = new Date().toISOString()

    return enhancedContext
  }

  /**
   * Get context summary for debugging
   */
  static getContextSummary(contextData: Record<string, unknown>): {
    hasImageAnalysis: boolean
    stepCount: number
    conversationCount: number
    totalTokens: number
    totalCost: number
    lastUpdated: string
  } {
    const enhancedContext = this.convertToEnhancedContext(contextData)
    
    return {
      hasImageAnalysis: !!enhancedContext.imageAnalysis,
      stepCount: Object.keys(enhancedContext.stepResults).length,
      conversationCount: enhancedContext.conversationHistory.length,
      totalTokens: enhancedContext.metadata.totalTokens,
      totalCost: enhancedContext.metadata.totalCost,
      lastUpdated: enhancedContext.metadata.lastUpdated
    }
  }
}
