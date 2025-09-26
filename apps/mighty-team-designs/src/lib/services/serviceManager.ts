import { EnhancedTeamDesignService } from './enhancedTeamDesignService';
import { QuestionService } from './questionService';
import { LogoService } from './logoService';
import { ImageGenerationService } from './imageGenerationService';
import { logDebug, logError } from '@/lib/debug';

/**
 * Central service manager that coordinates all database operations
 * Provides a unified interface for the application
 */
export class ServiceManager {
  private static instance: ServiceManager;
  
  public readonly flows: EnhancedTeamDesignService;
  public readonly questions: QuestionService;
  public readonly logos: LogoService;
  public readonly imageGeneration: typeof ImageGenerationService;

  private constructor() {
    this.flows = new EnhancedTeamDesignService();
    this.questions = new QuestionService();
    this.logos = new LogoService();
    this.imageGeneration = ImageGenerationService;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * Get comprehensive system statistics
   */
  async getSystemStats() {
    try {
      const [flowStats, questionStats, logoStats] = await Promise.all([
        this.flows.getFlowStats(),
        this.questions.getQuestionStats(),
        this.logos.getLogoStats()
      ]);

      return {
        flows: flowStats,
        questions: questionStats,
        logos: logoStats,
        system: {
          openai_available: ImageGenerationService.isOpenAIAvailable(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      await logError('system', 'database', 'Failed to get system statistics', error as Error);
      throw error;
    }
  }

  /**
   * Perform system maintenance tasks
   */
  async performMaintenance() {
    try {
      const results = {
        flows_cleaned: 0,
        logos_cleaned: 0,
        errors: [] as string[]
      };

      // Clean up old flows (90+ days)
      try {
        results.flows_cleaned = await this.flows.cleanupOldFlows(90);
      } catch (error) {
        results.errors.push(`Flow cleanup failed: ${error}`);
      }

      // Clean up old logos (30+ days)
      try {
        results.logos_cleaned = await this.logos.cleanupOldLogos(30);
      } catch (error) {
        results.errors.push(`Logo cleanup failed: ${error}`);
      }

      await logDebug('system', 'info', 'database', 'System maintenance completed', results);
      return results;
    } catch (error) {
      await logError('system', 'database', 'System maintenance failed', error as Error);
      throw error;
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck() {
    try {
      const checks = {
        database: false,
        storage: false,
        openai: false,
        errors: [] as string[]
      };

      // Test database connection
      try {
        await this.flows.count();
        checks.database = true;
      } catch (error) {
        checks.errors.push(`Database check failed: ${error}`);
      }

      // Test storage connection
      try {
        const data = await this.logos.getLogoPrompts();
        if (data && data.length >= 0) {
          checks.storage = true;
        } else {
          checks.errors.push('Storage check failed: No data returned');
        }
      } catch (error) {
        checks.errors.push(`Storage check failed: ${error}`);
      }

      // Test OpenAI availability
      checks.openai = ImageGenerationService.isOpenAIAvailable();

      const isHealthy = checks.database && checks.storage;
      
      await logDebug('system', 'info', 'database', 'System health check completed', {
        healthy: isHealthy,
        checks
      });

      return {
        healthy: isHealthy,
        checks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      await logError('system', 'database', 'Health check failed', error as Error);
      return {
        healthy: false,
        checks: {
          database: false,
          storage: false,
          openai: false,
          errors: [`Health check failed: ${error}`]
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get debug information for admin panel
   */
  async getDebugInfo() {
    try {
      const [systemStats, healthCheck] = await Promise.all([
        this.getSystemStats(),
        this.healthCheck()
      ]);

      return {
        stats: systemStats,
        health: healthCheck,
        environment: {
          node_env: process.env.NODE_ENV,
          debug_mode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
          openai_configured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here',
          supabase_configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      await logError('system', 'database', 'Failed to get debug information', error as Error);
      throw error;
    }
  }
}

// Export singleton instance
export const serviceManager = ServiceManager.getInstance();
