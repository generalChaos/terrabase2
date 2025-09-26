import { supabase } from '@/lib/supabase';
import { BaseService } from './baseService';
import { logDebug, logError } from '@/lib/debug';

export interface LogoVariant {
  id: string;
  flow_id: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  storage_bucket: string;
  variant_number: number;
  is_selected: boolean;
  generation_prompt: string;
  model_used: string;
  generation_time_ms?: number;
  generation_cost_usd?: number;
  created_at: string;
  public_url?: string;
}

export interface LogoPrompt {
  id: string;
  name: string;
  prompt_text: string;
  model: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export class LogoService extends BaseService {
  constructor() {
    super('team_logos');
  }

  /**
   * Get all logos for a specific flow
   */
  async getLogosByFlowId(flowId: string): Promise<LogoVariant[]> {
    try {
      const logos = await this.findMany({ flow_id: flowId }, '*', 'variant_number');
      
      // Add public URLs for each logo
      const logosWithUrls = await Promise.all(
        (logos as unknown as LogoVariant[]).map(async (logo) => {
          const { data: urlData } = supabase.storage
            .from(logo.storage_bucket)
            .getPublicUrl(logo.file_path);

          return {
            ...logo,
            public_url: urlData.publicUrl
          };
        })
      );

      return logosWithUrls as LogoVariant[];
    } catch (error) {
      await logError('system', 'database', 'Failed to get logos by flow ID', error as Error);
      throw error;
    }
  }

  /**
   * Get selected logo for a flow
   */
  async getSelectedLogo(flowId: string): Promise<LogoVariant | null> {
    try {
      const { data, error } = await supabase
        .from('team_logos')
        .select('*')
        .eq('flow_id', flowId)
        .eq('is_selected', true)
        .single();

      if (error || !data) {
        return null;
      }

      // Add public URL
      const { data: urlData } = supabase.storage
        .from(data.storage_bucket)
        .getPublicUrl(data.file_path);

      return {
        ...data,
        public_url: urlData.publicUrl
      } as LogoVariant;
    } catch (error) {
      await logError('system', 'database', 'Failed to get selected logo', error as Error);
      return null;
    }
  }

  /**
   * Select a logo variant
   */
  async selectLogo(flowId: string, logoId: string): Promise<LogoVariant> {
    try {
      // First, unselect all logos for this flow
      await supabase
        .from('team_logos')
        .update({ is_selected: false })
        .eq('flow_id', flowId);

      // Then select the specified logo
      const selectedLogo = await this.update(logoId, { is_selected: true });

      // Update the flow's selected_logo_id
      await supabase
        .from('team_design_flows')
        .update({ selected_logo_id: logoId })
        .eq('id', flowId);

      await logDebug('system', 'info', 'database', `Selected logo ${logoId} for flow ${flowId}`, {
        flow_id: flowId,
        logo_id: logoId
      });

      return selectedLogo as LogoVariant;
    } catch (error) {
      await logError('system', 'database', 'Failed to select logo', error as Error);
      throw error;
    }
  }

  /**
   * Delete a logo variant
   */
  async deleteLogo(logoId: string): Promise<void> {
    try {
      // Get logo info before deleting
      const logo = await this.findById(logoId);
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from((logo as unknown as LogoVariant).storage_bucket)
        .remove([(logo as unknown as LogoVariant).file_path]);

      if (storageError) {
        console.warn('Failed to delete logo from storage:', storageError);
      }

      // Delete from database
      await supabase
        .from('team_logos')
        .delete()
        .eq('id', logoId);

      await logDebug('system', 'info', 'database', `Deleted logo ${logoId}`, {
        logo_id: logoId,
        file_path: (logo as unknown as LogoVariant).file_path
      });
    } catch (error) {
      await logError('system', 'database', 'Failed to delete logo', error as Error);
      throw error;
    }
  }

  /**
   * Get logo generation statistics
   */
  async getLogoStats() {
    try {
      const totalLogos = await this.count();
      const selectedLogos = await this.count({ is_selected: true });

      // Get model distribution
      const { data: modelData } = await supabase
        .from('team_logos')
        .select('model_used')
        .eq('is_active', true);

      const modelCounts = modelData?.reduce((acc, item) => {
        acc[item.model_used] = (acc[item.model_used] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get average generation time and cost
      const { data: statsData } = await supabase
        .from('team_logos')
        .select('generation_time_ms, generation_cost_usd')
        .eq('is_active', true)
        .not('generation_time_ms', 'is', null)
        .not('generation_cost_usd', 'is', null);

      const avgGenerationTime = statsData?.length 
        ? statsData.reduce((sum, item) => sum + (item.generation_time_ms || 0), 0) / statsData.length
        : 0;

      const totalCost = statsData?.reduce((sum, item) => sum + (item.generation_cost_usd || 0), 0) || 0;

      return {
        total_logos: totalLogos,
        selected_logos: selectedLogos,
        model_distribution: modelCounts,
        average_generation_time_ms: Math.round(avgGenerationTime),
        total_generation_cost_usd: Math.round(totalCost * 100) / 100
      };
    } catch (error) {
      await logError('system', 'database', 'Failed to get logo statistics', error as Error);
      throw error;
    }
  }

  /**
   * Get recent logos
   */
  async getRecentLogos(limit: number = 10): Promise<LogoVariant[]> {
    try {
      const { data, error } = await supabase
        .from('team_logos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get recent logos: ${error.message}`);
      }

      // Add public URLs for each logo
      const logosWithUrls = await Promise.all(
        (data as LogoVariant[]).map(async (logo) => {
          const { data: urlData } = supabase.storage
            .from(logo.storage_bucket)
            .getPublicUrl(logo.file_path);

          return {
            ...logo,
            public_url: urlData.publicUrl
          };
        })
      );

      return logosWithUrls;
    } catch (error) {
      await logError('system', 'database', 'Failed to get recent logos', error as Error);
      throw error;
    }
  }

  /**
   * Get logo prompts
   */
  async getLogoPrompts(): Promise<LogoPrompt[]> {
    try {
      const { data, error } = await supabase
        .from('logo_prompts')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get logo prompts: ${error.message}`);
      }

      return data as LogoPrompt[];
    } catch (error) {
      await logError('system', 'database', 'Failed to get logo prompts', error as Error);
      throw error;
    }
  }

  /**
   * Get logo prompt by name
   */
  async getLogoPromptByName(name: string): Promise<LogoPrompt | null> {
    try {
      const { data, error } = await supabase
        .from('logo_prompts')
        .select('*')
        .eq('name', name)
        .eq('active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return data as LogoPrompt;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a new logo prompt
   */
  async createLogoPrompt(data: Omit<LogoPrompt, 'id' | 'created_at' | 'updated_at'>): Promise<LogoPrompt> {
    try {
      const prompt = await supabase
        .from('logo_prompts')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (prompt.error) {
        throw new Error(`Failed to create logo prompt: ${prompt.error.message}`);
      }

      return prompt.data as LogoPrompt;
    } catch (error) {
      await logError('system', 'database', 'Failed to create logo prompt', error as Error);
      throw error;
    }
  }

  /**
   * Update logo prompt
   */
  async updateLogoPrompt(id: string, data: Partial<LogoPrompt>): Promise<LogoPrompt> {
    try {
      const prompt = await supabase
        .from('logo_prompts')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (prompt.error) {
        throw new Error(`Failed to update logo prompt: ${prompt.error.message}`);
      }

      return prompt.data as LogoPrompt;
    } catch (error) {
      await logError('system', 'database', 'Failed to update logo prompt', error as Error);
      throw error;
    }
  }

  /**
   * Clean up old logos (for maintenance)
   */
  async cleanupOldLogos(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Find old logos
      const { data: oldLogos } = await supabase
        .from('team_logos')
        .select('id, file_path, storage_bucket')
        .lt('created_at', cutoffDate.toISOString())
        .eq('is_active', true);

      if (!oldLogos || oldLogos.length === 0) {
        return 0;
      }

      // Delete from storage
      const filePaths = oldLogos.map(logo => logo.file_path);
      const { error: storageError } = await supabase.storage
        .from('team-logos')
        .remove(filePaths);

      if (storageError) {
        console.warn('Failed to delete some logos from storage:', storageError);
      }

      // Soft delete from database
      const logoIds = oldLogos.map(logo => logo.id);
      await supabase
        .from('team_logos')
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .in('id', logoIds);

      await logDebug('system', 'info', 'database', `Cleaned up ${oldLogos.length} old logos`, {
        count: oldLogos.length,
        cutoff_date: cutoffDate.toISOString()
      });

      return oldLogos.length;
    } catch (error) {
      await logError('system', 'database', 'Failed to cleanup old logos', error as Error);
      throw error;
    }
  }
}
