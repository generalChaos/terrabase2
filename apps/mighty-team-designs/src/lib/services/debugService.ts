import { supabase } from '../supabase';
import { logDebug, logError } from '@/lib/debug';
import { BaseService } from './baseService';

export interface DebugLog {
  id: string;
  flow_id: string | null;
  log_level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  context: any;
  stack_trace?: string;
  created_at: string;
}

export class DebugService extends BaseService {
  constructor() {
    super('debug_logs');
  }

  /**
   * Get logs by level
   */
  async getLogsByLevel(level: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('debug_logs')
        .select('*')
        .eq('log_level', level)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data as DebugLog[];
    } catch (error) {
      await logError('system', 'database', 'Failed to get logs by level', error as Error);
      throw error;
    }
  }

  /**
   * Get logs by category
   */
  async getLogsByCategory(category: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('debug_logs')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data as DebugLog[];
    } catch (error) {
      await logError('system', 'database', 'Failed to get logs by category', error as Error);
      throw error;
    }
  }

  /**
   * Get recent error logs
   */
  async getRecentErrors(limit: number = 20) {
    return this.getLogsByLevel('error', limit);
  }

  /**
   * Get recent logs (all levels)
   */
  async getRecentLogs(limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('debug_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data as DebugLog[];
    } catch (error) {
      await logError('system', 'database', 'Failed to get recent logs', error as Error);
      throw error;
    }
  }

  /**
   * Get system health from logs
   */
  async getSystemHealth() {
    try {
      const { data: recentErrors } = await supabase
        .from('debug_logs')
        .select('id, log_level, created_at')
        .eq('log_level', 'error')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      const { data: totalLogs } = await supabase
        .from('debug_logs')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const errorCount = recentErrors?.length || 0;
      const totalCount = totalLogs?.length || 0;
      const errorRate = totalCount > 0 ? errorCount / totalCount : 0;

      return {
        error_count_24h: errorCount,
        total_logs_24h: totalCount,
        error_rate: errorRate,
        healthy: errorRate < 0.1 // Less than 10% error rate is healthy
      };
    } catch (error) {
      await logError('system', 'database', 'Failed to get system health', error as Error);
      return {
        error_count_24h: 0,
        total_logs_24h: 0,
        error_rate: 1,
        healthy: false
      };
    }
  }
}
