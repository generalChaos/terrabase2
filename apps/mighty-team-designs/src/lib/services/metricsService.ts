import { supabase } from '../supabase';
import { logDebug, logError } from '@/lib/debug';
import { BaseService } from './baseService';

export interface SystemMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  aggregation_period: string;
  recorded_at: string;
}

export class MetricsService extends BaseService {
  constructor() {
    super('system_metrics');
  }

  /**
   * Get metrics by name
   */
  async getMetricsByName(metricName: string, limit: number = 100) {
    try {
      const { data, error } = await supabase
        .from('system_metrics')
        .select('*')
        .eq('metric_name', metricName)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data as SystemMetric[];
    } catch (error) {
      await logError('system', 'database', 'Failed to get metrics by name', error as Error);
      throw error;
    }
  }

  /**
   * Get recent metrics
   */
  async getRecentMetrics(limit: number = 100) {
    try {
      const { data, error } = await supabase
        .from('system_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data as SystemMetric[];
    } catch (error) {
      await logError('system', 'database', 'Failed to get recent metrics', error as Error);
      throw error;
    }
  }

  /**
   * Get recent performance metrics
   */
  async getPerformanceMetrics() {
    try {
      const { data, error } = await supabase
        .from('system_metrics')
        .select('*')
        .in('metric_name', [
          'question_generation_time',
          'logo_generation_time',
          'question_generation_success',
          'logo_generation_success'
        ])
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const metrics = data as SystemMetric[];
      
      // Calculate averages
      const questionTimes = metrics
        .filter(m => m.metric_name === 'question_generation_time')
        .map(m => m.metric_value);
      
      const logoTimes = metrics
        .filter(m => m.metric_name === 'logo_generation_time')
        .map(m => m.metric_value);

      const questionSuccess = metrics
        .filter(m => m.metric_name === 'question_generation_success')
        .map(m => m.metric_value);

      const logoSuccess = metrics
        .filter(m => m.metric_name === 'logo_generation_success')
        .map(m => m.metric_value);

      return {
        question_generation_time_avg: questionTimes.length > 0 
          ? questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length 
          : 0,
        logo_generation_time_avg: logoTimes.length > 0 
          ? logoTimes.reduce((a, b) => a + b, 0) / logoTimes.length 
          : 0,
        question_generation_success_rate: questionSuccess.length > 0 
          ? questionSuccess.reduce((a, b) => a + b, 0) / questionSuccess.length 
          : 0,
        logo_generation_success_rate: logoSuccess.length > 0 
          ? logoSuccess.reduce((a, b) => a + b, 0) / logoSuccess.length 
          : 0,
        total_metrics: metrics.length
      };
    } catch (error) {
      await logError('system', 'database', 'Failed to get performance metrics', error as Error);
      return {
        question_generation_time_avg: 0,
        logo_generation_time_avg: 0,
        question_generation_success_rate: 0,
        logo_generation_success_rate: 0,
        total_metrics: 0
      };
    }
  }

  /**
   * Get cost metrics
   */
  async getCostMetrics() {
    try {
      const { data, error } = await supabase
        .from('system_metrics')
        .select('*')
        .in('metric_name', [
          'question_generation_cost',
          'logo_generation_cost'
        ])
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const metrics = data as SystemMetric[];
      
      const questionCosts = metrics
        .filter(m => m.metric_name === 'question_generation_cost')
        .map(m => m.metric_value);
      
      const logoCosts = metrics
        .filter(m => m.metric_name === 'logo_generation_cost')
        .map(m => m.metric_value);

      return {
        question_generation_cost_total: questionCosts.reduce((a, b) => a + b, 0),
        logo_generation_cost_total: logoCosts.reduce((a, b) => a + b, 0),
        total_cost: questionCosts.reduce((a, b) => a + b, 0) + logoCosts.reduce((a, b) => a + b, 0)
      };
    } catch (error) {
      await logError('system', 'database', 'Failed to get cost metrics', error as Error);
      return {
        question_generation_cost_total: 0,
        logo_generation_cost_total: 0,
        total_cost: 0
      };
    }
  }
}
