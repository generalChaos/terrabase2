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
  sessionId: string
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
  sessionId: string
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
    sessionId: string,
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
      sessionId,
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

    // Console logging with appropriate level
    const logMessage = `[${entry.timestamp}] [${level.toUpperCase()}] [${category}] [${step}] ${message}`
    const logData = data ? { data: this.sanitizeData(data), metadata } : { metadata }

    switch (level) {
      case 'debug':
        console.debug(logMessage, logData)
        break
      case 'info':
        console.info(logMessage, logData)
        break
      case 'warn':
        console.warn(logMessage, logData)
        break
      case 'error':
        console.error(logMessage, logData)
        break
    }
  }

  /**
   * Start tracking a new flow
   */
  static startFlow(flowId: string, sessionId: string): void {
    const flowDetails: FlowDetails = {
      flowId,
      sessionId,
      steps: [],
      totalTokensUsed: 0,
      totalCostUsd: 0,
      startTime: new Date().toISOString()
    }

    this.flowDetails.set(flowId, flowDetails)
    
    this.log('info', 'flow', 'flow_start', flowId, sessionId, 'flow_start', 
      `Started new flow: ${flowId.substring(0, 8)}...`, 
      { flowId, sessionId })
  }

  /**
   * Start tracking a step within a flow
   */
  static startStep(
    flowId: string, 
    sessionId: string, 
    stepName: string, 
    stepOrder: number,
    input?: Record<string, unknown>
  ): void {
    const flow = this.flowDetails.get(flowId)
    if (!flow) {
      this.log('warn', 'flow', stepName, flowId, sessionId, 'step_start', 
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
    
    this.log('info', 'flow', stepName, flowId, sessionId, 'step_start', 
      `Started step: ${stepName}`, 
      { stepName, stepOrder, input: this.sanitizeData(input) })
  }

  /**
   * Complete a step within a flow
   */
  static completeStep(
    flowId: string,
    sessionId: string,
    stepName: string,
    output?: Record<string, unknown>,
    context?: Record<string, unknown>,
    tokensUsed?: number,
    costUsd?: number
  ): void {
    const flow = this.flowDetails.get(flowId)
    if (!flow) {
      this.log('warn', 'flow', stepName, flowId, sessionId, 'step_complete', 
        'Flow not found when completing step', { flowId, stepName })
      return
    }

    const step = flow.steps.find(s => s.stepName === stepName && s.status === 'in_progress')
    if (!step) {
      this.log('warn', 'flow', stepName, flowId, sessionId, 'step_complete', 
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

    this.log('info', 'flow', stepName, flowId, sessionId, 'step_complete', 
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
    sessionId: string,
    stepName: string,
    error: string,
    input?: Record<string, unknown>
  ): void {
    const flow = this.flowDetails.get(flowId)
    if (!flow) {
      this.log('warn', 'flow', stepName, flowId, sessionId, 'step_fail', 
        'Flow not found when failing step', { flowId, stepName })
      return
    }

    const step = flow.steps.find(s => s.stepName === stepName && s.status === 'in_progress')
    if (!step) {
      this.log('warn', 'flow', stepName, flowId, sessionId, 'step_fail', 
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

    this.log('error', 'flow', stepName, flowId, sessionId, 'step_fail', 
      `Failed step: ${stepName}`, 
      { stepName, error, duration, input: this.sanitizeData(input) })
  }

  /**
   * Complete a flow
   */
  static completeFlow(flowId: string, sessionId: string): void {
    const flow = this.flowDetails.get(flowId)
    if (!flow) {
      this.log('warn', 'flow', 'flow_complete', flowId, sessionId, 'flow_complete', 
        'Flow not found when completing', { flowId })
      return
    }

    const endTime = new Date().toISOString()
    const totalDuration = new Date(endTime).getTime() - new Date(flow.startTime).getTime()

    flow.endTime = endTime
    flow.totalDuration = totalDuration

    this.log('info', 'flow', 'flow_complete', flowId, sessionId, 'flow_complete', 
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
    sessionId: string,
    requestId: string,
    stepName: string,
    contextData: Record<string, unknown>,
    relevantContext: Record<string, unknown>
  ): void {
    this.log('debug', 'context', stepName, flowId, sessionId, requestId, 
      `Building context for step: ${stepName}`, 
      {
        originalContextKeys: Object.keys(contextData),
        relevantContextKeys: Object.keys(relevantContext),
        contextSize: JSON.stringify(contextData).length,
        relevantSize: JSON.stringify(relevantContext).length
      })
  }

  /**
   * Log prompt construction
   */
  static logPromptConstruction(
    flowId: string,
    sessionId: string,
    requestId: string,
    stepName: string,
    promptText: string,
    input: Record<string, unknown>,
    context: Record<string, unknown>
  ): void {
    this.log('debug', 'prompt', stepName, flowId, sessionId, requestId, 
      `Constructing prompt for step: ${stepName}`, 
      {
        promptLength: promptText.length,
        inputKeys: Object.keys(input),
        contextKeys: Object.keys(context),
        hasImageData: 'image_base64' in input || 'image' in input
      })
  }

  /**
   * Log AI response
   */
  static logAIResponse(
    flowId: string,
    sessionId: string,
    requestId: string,
    stepName: string,
    response: Record<string, unknown>,
    tokensUsed?: number,
    costUsd?: number,
    model?: string,
    duration?: number
  ): void {
    this.log('info', 'response', stepName, flowId, sessionId, requestId, 
      `AI response received for step: ${stepName}`, 
      {
        responseKeys: Object.keys(response),
        responseSize: JSON.stringify(response).length,
        tokensUsed,
        costUsd,
        model,
        duration
      },
      { tokensUsed, costUsd, model, duration })
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
   * Get all flow details
   */
  static getAllFlowDetails(): FlowDetails[] {
    return Array.from(this.flowDetails.values())
  }

  /**
   * Get recent logs
   */
  static getRecentLogs(limit: number = 100): ContextLogEntry[] {
    return this.logs.slice(-limit)
  }

  /**
   * Clear logs (useful for testing)
   */
  static clearLogs(): void {
    this.logs = []
    this.flowDetails.clear()
  }

  /**
   * Sanitize data to remove sensitive information
   */
  private static sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) return undefined

    const sanitized = { ...data }
    
    // Remove or truncate sensitive fields
    const sensitiveFields = ['image_base64', 'image', 'password', 'token', 'key']
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        const value = sanitized[field]
        if (typeof value === 'string' && value.length > 100) {
          sanitized[field] = value.substring(0, 100) + '... [TRUNCATED]'
        }
      }
    }

    return sanitized
  }
}
