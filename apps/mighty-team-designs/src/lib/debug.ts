import { supabase } from './supabase';

export interface DebugContext {
  [key: string]: any;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'flow_creation' | 'flow_update' | 'question_generation' | 'logo_generation' | 'api' | 'database' | 'storage' | 'openai' | 'test';

/**
 * Log debug information to the database
 */
export async function logDebug(
  flowId: string | null,
  level: LogLevel,
  category: LogCategory,
  message: string,
  context?: DebugContext
): Promise<string | null> {
  // Use NULL for system-level logs (flow_id is now nullable)
  const actualFlowId = flowId === 'system' ? null : flowId;
  try {
    const { data, error } = await supabase
      .from('debug_logs')
      .insert({
        flow_id: actualFlowId,
        log_level: level,
        category,
        message,
        context: context || null
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log debug information:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in logDebug:', error);
    return null;
  }
}

/**
 * Log an error with stack trace
 */
export async function logError(
  flowId: string,
  category: LogCategory,
  message: string,
  error: Error,
  context?: DebugContext
): Promise<string | null> {
  // Use NULL for system-level logs (flow_id is now nullable)
  const actualFlowId = flowId === 'system' ? null : flowId;
  
  return logDebug(actualFlowId, 'error', category, message, {
    ...context,
    stack_trace: error.stack,
    error_name: error.name,
    error_message: error.message
  });
}

/**
 * Record system metrics
 */
export async function recordMetric(
  metricName: string,
  metricValue: number,
  metricUnit?: string,
  timePeriod: string = 'hour'
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('system_metrics')
      .insert({
        metric_name: metricName,
        metric_value: metricValue,
        metric_unit: metricUnit,
        time_period: timePeriod
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to record metric:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in recordMetric:', error);
    return null;
  }
}

/**
 * Track error patterns for monitoring
 */
export async function trackError(
  errorType: string,
  errorMessage: string
): Promise<string | null> {
  try {
    // First, try to update existing error pattern
    const { data: existing, error: findError } = await supabase
      .from('error_patterns')
      .select('id, occurrence_count')
      .eq('error_type', errorType)
      .eq('error_message', errorMessage)
      .single();

    if (existing && !findError) {
      // Update existing pattern
      const { data, error: updateError } = await supabase
        .from('error_patterns')
        .update({
          occurrence_count: existing.occurrence_count + 1,
          last_occurrence: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Failed to update error pattern:', updateError);
        return null;
      }

      return data.id;
    } else {
      // Create new error pattern
      const { data, error: insertError } = await supabase
        .from('error_patterns')
        .insert({
          error_type: errorType,
          error_message: errorMessage,
          occurrence_count: 1
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Failed to create error pattern:', insertError);
        return null;
      }

      return data.id;
    }
  } catch (error) {
    console.error('Error in trackError:', error);
    return null;
  }
}

/**
 * Get debug logs for a flow
 */
export async function getDebugLogs(
  flowId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('debug_logs')
      .select('*')
      .eq('flow_id', flowId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get debug logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDebugLogs:', error);
    return [];
  }
}

/**
 * Get system metrics
 */
export async function getSystemMetrics(
  timePeriod: string = 'hour',
  limit: number = 100
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('system_metrics')
      .select('*')
      .eq('time_period', timePeriod)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get system metrics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSystemMetrics:', error);
    return [];
  }
}

/**
 * Get error patterns
 */
export async function getErrorPatterns(
  resolved: boolean = false,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('error_patterns')
      .select('*')
      .eq('resolved', resolved)
      .order('last_occurrence', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get error patterns:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getErrorPatterns:', error);
    return [];
  }
}
