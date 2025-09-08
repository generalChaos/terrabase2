/**
 * Enhanced Context Logging Service
 * Provides comprehensive logging and debugging for context flow and AI responses
 */

export interface ContextLogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  category: 'context' | 'prompt' | 'response' | 'flow' | 'error'
  step: string
  flowId: string
  requestId: string
  message: string
  data?: Record<string, unknown>
  metadata?: {
    tokensUsed?: number
    costUsd?: number
    duration?: number
    model?: string
  }
}

export interface FlowDetails {
  flowId: string
  steps: Array<{
    stepName: string
    stepOrder: number
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    startTime?: string
    endTime?: string
    duration?: number
    input?: Record<string, unknown>
    output?: Record<string, unknown>
    context?: Record<string, unknown>
    tokensUsed?: number
    costUsd?: number
    error?: string
  }>
  totalTokensUsed: number
  totalCostUsd: number
  startTime: string
  endTime?: string
  totalDuration?: number
}

export class ContextLogger {
  private static logs: ContextLogEntry[] = []
  private static flowDetails: Map<string, FlowDetails> = new Map()
  private static maxLogs = 1000 // Keep last 1000 log entries

  /**
   * Log a context-related event
   */
  static log(
    level: ContextLogEntry['level'],
    category: ContextLogEntry['category'],
    step: string,
    flowId: string,
    requestId: string,
    message: string,
    data?: Record<string, unknown>,
    metadata?: ContextLogEntry['metadata']
  ): void {
    const entry: ContextLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      step,
      flowId,
      requestId,
      message,
      data: this.sanitizeData(data),
      metadata
    }

    this.logs.push(entry)
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console logging for development
    const logMessage = `[${level.toUpperCase()}] ${category}:${step} - ${message}`
    if (level === 'error') {
      console.error(logMessage, data)
    } else if (level === 'warn') {
      console.warn(logMessage, data)
    } else if (level === 'debug') {
      console.debug(logMessage, data)
    } else {
      console.log(logMessage, data)
    }
  }

  /**
   * Start tracking a new flow
   */
  static startFlow(flowId: string): void {
    const flowDetails: FlowDetails = {
      flowId,
      steps: [],
      totalTokensUsed: 0,
      totalCostUsd: 0,
      startTime: new Date().toISOString()
    }

    this.flowDetails.set(flowId, flowDetails)
    
    this.log('info', 'flow', 'flow_start', flowId, 'flow_start', 
      `Started new flow: ${flowId.substring(0, 8)}...`, 
      { flowId })
  }

  /**
   * Start tracking a step within a flow
   */
  static startStep(
    flowId: string, 
    stepName: string, 
    stepOrder: number,
    input?: Record<string, unknown>
  ): void {
    const flow = this.flowDetails.get(flowId)
    if (!flow) {
      this.log('warn', 'flow', stepName, flowId, 'step_start', 
        'Flow not found when starting step', { flowId, stepName })
      return
    }

    const step = {
      stepName,
      stepOrder,
      status: 'in_progress' as const,
      startTime: new Date().toISOString(),
      input: this.sanitizeData(input)
    }

    flow.steps.push(step)
    
    this.log('info', 'flow', stepName, flowId, 'step_start', 
      `Started step: ${stepName}`, 
      { stepName, stepOrder, input: this.sanitizeData(input) })
  }

  /**
   * Complete a step within a flow
   */
  static completeStep(
    flowId: string,
    stepName: string,
    output?: Record<string, unknown>,
    context?: Record<string, unknown>,
    tokensUsed?: number,
    costUsd?: number
  ): void {
    const flow = this.flowDetails.get(flowId)
    if (!flow) {
      this.log('warn', 'flow', stepName, flowId, 'step_complete', 
        'Flow not found when completing step', { flowId, stepName })
      return
    }

    const step = flow.steps.find(s => s.stepName === stepName && s.status === 'in_progress')
    if (!step) {
      this.log('warn', 'flow', stepName, flowId, 'step_complete', 
        'Step not found when completing', { flowId, stepName })
      return
    }

    const endTime = new Date().toISOString()
    const duration = step.startTime ? 
      new Date(endTime).getTime() - new Date(step.startTime).getTime() : undefined

    step.status = 'completed'
    step.endTime = endTime
    step.duration = duration
    step.output = this.sanitizeData(output)
    step.context = this.sanitizeData(context)
    step.tokensUsed = tokensUsed
    step.costUsd = costUsd

    // Update flow totals
    if (tokensUsed) flow.totalTokensUsed += tokensUsed
    if (costUsd) flow.totalCostUsd += costUsd

    this.log('info', 'flow', stepName, flowId, 'step_complete', 
      `Completed step: ${stepName}`, 
      { 
        stepName, 
        duration, 
        tokensUsed, 
        costUsd,
        output: this.sanitizeData(output),
        context: this.sanitizeData(context)
      })
  }

  /**
   * Fail a step within a flow
   */
  static failStep(
    flowId: string,
    stepName: string,
    error: string,
    input?: Record<string, unknown>
  ): void {
    const flow = this.flowDetails.get(flowId)
    if (!flow) {
      this.log('warn', 'flow', stepName, flowId, 'step_fail', 
        'Flow not found when failing step', { flowId, stepName })
      return
    }

    const step = flow.steps.find(s => s.stepName === stepName && s.status === 'in_progress')
    if (!step) {
      this.log('warn', 'flow', stepName, flowId, 'step_fail', 
        'Step not found when failing', { flowId, stepName })
      return
    }

    const endTime = new Date().toISOString()
    const duration = step.startTime ? 
      new Date(endTime).getTime() - new Date(step.startTime).getTime() : undefined

    step.status = 'failed'
    step.endTime = endTime
    step.duration = duration
    step.error = error
    step.input = this.sanitizeData(input)

    this.log('error', 'flow', stepName, flowId, 'step_fail', 
      `Failed step: ${stepName}`, 
      { stepName, error, duration, input: this.sanitizeData(input) })
  }

  /**
   * Complete a flow
   */
  static completeFlow(flowId: string): void {
    const flow = this.flowDetails.get(flowId)
    if (!flow) {
      this.log('warn', 'flow', 'flow_complete', flowId, 'flow_complete', 
        'Flow not found when completing', { flowId })
      return
    }

    const endTime = new Date().toISOString()
    const totalDuration = new Date(endTime).getTime() - new Date(flow.startTime).getTime()
    
    flow.endTime = endTime
    flow.totalDuration = totalDuration

    this.log('info', 'flow', 'flow_complete', flowId, 'flow_complete', 
      `Completed flow: ${flowId.substring(0, 8)}...`, 
      { 
        flowId,
        totalDuration,
        totalTokensUsed: flow.totalTokensUsed,
        totalCostUsd: flow.totalCostUsd,
        stepsCompleted: flow.steps.filter(s => s.status === 'completed').length,
        stepsFailed: flow.steps.filter(s => s.status === 'failed').length
      })
  }

  /**
   * Log context building
   */
  static logContextBuilding(
    flowId: string,
    requestId: string,
    stepName: string,
    contextData: Record<string, unknown>,
    relevantContext: Record<string, unknown>
  ): void {
    this.log('debug', 'context', stepName, flowId, requestId, 
      `Building context for step: ${stepName}`, 
      {
        contextDataKeys: Object.keys(contextData),
        relevantContextKeys: Object.keys(relevantContext),
        contextDataSize: JSON.stringify(contextData).length,
        relevantContextSize: JSON.stringify(relevantContext).length
      })
  }

  /**
   * Log prompt construction
   */
  static logPromptConstruction(
    flowId: string,
    requestId: string,
    stepName: string,
    promptText: string,
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ): void {
    this.log('debug', 'prompt', stepName, flowId, requestId, 
      `Constructing prompt for step: ${stepName}`, 
      {
        promptLength: promptText.length,
        inputKeys: Object.keys(input),
        contextKeys: Object.keys(context),
        input: this.sanitizeData(input),
        context: this.sanitizeData(context)
      })
  }

  /**
   * Log AI response
   */
  static logAIResponse(
    flowId: string,
    requestId: string,
    stepName: string,
    response: Record<string, unknown>,
    tokensUsed?: number,
    costUsd?: number,
    model?: string,
    duration?: number
  ): void {
    this.log('info', 'response', stepName, flowId, requestId, 
      `AI response received for step: ${stepName}`, 
      {
        responseKeys: Object.keys(response),
        responseSize: JSON.stringify(response).length,
        response: this.sanitizeData(response)
      },
      {
        tokensUsed,
        costUsd,
        model,
        duration
      })
  }

  /**
   * Get logs for a specific flow
   */
  static getFlowLogs(flowId: string): ContextLogEntry[] {
    return this.logs.filter(log => log.flowId === flowId)
  }

  /**
   * Get flow details
   */
  static getFlowDetails(flowId: string): FlowDetails | undefined {
    return this.flowDetails.get(flowId)
  }

  /**
   * Get all logs
   */
  static getAllLogs(): ContextLogEntry[] {
    return [...this.logs]
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    this.logs = []
    this.flowDetails.clear()
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  private static sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) return undefined

    const sanitized = { ...data }
    
    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'apiKey']
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    })

    // Truncate very long strings
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key]
      if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '... [TRUNCATED]'
      }
    })

    return sanitized
  }
}