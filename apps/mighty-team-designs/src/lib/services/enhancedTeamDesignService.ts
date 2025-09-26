import { supabase } from '@/lib/supabase';
import { logDebug, logError } from '@/lib/debug';
import { TeamDesignFlow, Question, LogoVariant, FlowStep } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { BaseService } from './baseService';
import { QuestionService } from './questionService';
import { LogoService } from './logoService';
import { ImageGenerationService } from './imageGenerationService';

export class EnhancedTeamDesignService extends BaseService {
  private questionService: QuestionService;
  private logoService: LogoService;

  constructor() {
    super('team_design_flows');
    this.questionService = new QuestionService();
    this.logoService = new LogoService();
  }

  /**
   * Create a new team design flow
   */
  async createTeamDesignFlow(data: {
    team_name: string;
    sport: string;
    age_group: string;
    debug_mode?: boolean;
  }): Promise<TeamDesignFlow> {
    try {
      const flowData = {
        user_session_id: uuidv4(),
        team_name: data.team_name,
        sport: data.sport,
        age_group: data.age_group,
        round1_answers: {
          team_name: data.team_name,
          sport: data.sport,
          age_group: data.age_group,
        },
        current_step: 'round1' as FlowStep,
        debug_mode: data.debug_mode || false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const flow = await this.create(flowData);
      
      await logDebug(flow.id, 'info', 'flow_creation', `New flow created: ${flow.id}`, flow);
      return flow as TeamDesignFlow;
    } catch (error) {
      await logError('system', 'database', 'Failed to create team design flow', error as Error);
      throw error;
    }
  }

  /**
   * Get a flow by ID with all related data
   */
  async getFlowById(id: string): Promise<TeamDesignFlow | null> {
    try {
      const { data: flow, error } = await supabase
        .from('team_design_flows')
        .select(`
          *,
          team_logos!team_logos_flow_id_fkey (*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !flow) {
        return null;
      }

      // Add public URLs to logos
      if (flow.team_logos) {
        flow.team_logos = await Promise.all(
          flow.team_logos.map(async (logo: any) => {
            const { data: urlData } = supabase.storage
              .from(logo.storage_bucket)
              .getPublicUrl(logo.file_path);
            
            return {
              ...logo,
              public_url: urlData.publicUrl
            };
          })
        );
      }

      return flow as TeamDesignFlow;
    } catch (error) {
      await logError('system', 'database', 'Failed to get flow by ID', error as Error);
      return null;
    }
  }

  /**
   * Update a flow
   */
  async updateTeamDesignFlow(id: string, data: Partial<TeamDesignFlow>): Promise<TeamDesignFlow> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const flow = await this.update(id, updateData);
      
      await logDebug(id, 'info', 'flow_update', `Flow updated: ${id}`, { id, updates: Object.keys(data) });
      return flow as TeamDesignFlow;
    } catch (error) {
      await logError(id, 'database', 'Failed to update flow', error as Error);
      throw error;
    }
  }

  /**
   * Soft delete a flow
   */
  async softDeleteTeamDesignFlow(id: string): Promise<void> {
    try {
      await this.softDelete(id);
      
      // Also soft delete related logos
      await supabase
        .from('team_logos')
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq('flow_id', id);

      await logDebug(id, 'info', 'flow_update', `Flow soft deleted: ${id}`, { id });
    } catch (error) {
      await logError(id, 'database', 'Failed to delete flow', error as Error);
      throw error;
    }
  }

  /**
   * Get questions for a flow
   */
  async getQuestionsForFlow(flowId: string, sport: string, ageGroup: string) {
    try {
      const questionSet = await this.questionService.getQuestionsForFlow(flowId, sport, ageGroup);
      
      // Update the flow with the question set
      await this.updateTeamDesignFlow(flowId, {
        round2_questions: questionSet.questions.map(q => ({
          ...q,
          options: q.options || [],
          selected: q.selected || 0
        }))
      });

      return questionSet;
    } catch (error) {
      await logError(flowId, 'question_generation', 'Failed to get questions for flow', error as Error);
      throw error;
    }
  }

  /**
   * Update flow with Round 2 answers
   */
  async updateFlowWithAnswers(flowId: string, answers: Question[]): Promise<TeamDesignFlow> {
    try {
      const flow = await this.updateTeamDesignFlow(flowId, {
        round2_answers: answers.map(q => ({
          question_id: q.id,
          answer: q.options[q.selected || 0] || ''
        })),
        current_step: 'generating' as FlowStep
      });

      await logDebug(flowId, 'info', 'flow_update', `Flow answers updated: ${flowId}`, {
        flow_id: flowId,
        answer_count: answers.length
      });

      return flow;
    } catch (error) {
      await logError(flowId, 'flow_update', 'Failed to update flow with answers', error as Error);
      throw error;
    }
  }

  /**
   * Generate logos for a flow
   */
  async generateLogosForFlow(flowId: string, variantCount: number = 2): Promise<LogoVariant[]> {
    try {
      const flow = await this.getFlowById(flowId);
      if (!flow) {
        throw new Error('Flow not found');
      }

      // Extract answers for prompt generation from round2_questions
      const style = flow.round2_questions?.find(a => a.id === 'style')?.selected || 0;
      const colors = flow.round2_questions?.find(a => a.id === 'colors')?.selected || 0;
      const mascot = flow.round2_questions?.find(a => a.id === 'mascot')?.selected || 0;

      // Get the options for each answer
      const styleOptions = flow.round2_questions?.find(a => a.id === 'style')?.options || ['Fun', 'Professional', 'Tough', 'Friendly'];
      const colorOptions = flow.round2_questions?.find(a => a.id === 'colors')?.options || ['Team colors', 'Custom colors', 'Classic colors'];
      const mascotOptions = flow.round2_questions?.find(a => a.id === 'mascot')?.options || ['Yes', 'No', 'Text only'];

      // Generate logos using the image generation service
      const generatedLogos = await ImageGenerationService.generateLogos(flowId, {
        teamName: flow.team_name,
        sport: flow.sport,
        ageGroup: flow.age_group,
        style: styleOptions[style],
        colors: colorOptions[colors],
        mascot: mascotOptions[mascot],
        variantCount
      });

      // Update the flow with logo data
      await this.updateTeamDesignFlow(flowId, {
        logo_variants: generatedLogos,
        selected_logo_id: generatedLogos[0]?.id || undefined,
        logo_generated_at: new Date().toISOString(),
        current_step: 'logo_selection' as FlowStep
      });

      await logDebug(flowId, 'info', 'logo_generation', `Logos generated for flow: ${flowId}`, {
        flow_id: flowId,
        logo_count: generatedLogos.length
      });

      return generatedLogos;
    } catch (error) {
      await logError(flowId, 'logo_generation', 'Failed to generate logos for flow', error as Error);
      throw error;
    }
  }

  /**
   * Select a logo for a flow
   */
  async selectLogoForFlow(flowId: string, logoId: string): Promise<LogoVariant> {
    try {
      const selectedLogo = await this.logoService.selectLogo(flowId, logoId);
      
      // Update the flow's selected logo
      await this.updateTeamDesignFlow(flowId, {
        selected_logo_id: logoId,
        current_step: 'completed' as FlowStep
      });

      await logDebug(flowId, 'info', 'logo_generation', `Logo selected for flow: ${flowId}`, {
        flow_id: flowId,
        logo_id: logoId
      });

      return {
        ...selectedLogo,
        generation_time_ms: selectedLogo.generation_time_ms || 0
      } as LogoVariant;
    } catch (error) {
      await logError(flowId, 'logo_generation', 'Failed to select logo for flow', error as Error);
      throw error;
    }
  }

  /**
   * Get flow statistics
   */
  async getFlowStats() {
    try {
      const totalFlows = await this.count();
      const completedFlows = await this.count({ current_step: 'completed' });
      const activeFlows = await this.count({ is_active: true });

      // Get step distribution
      const { data: stepData } = await supabase
        .from('team_design_flows')
        .select('current_step')
        .eq('is_active', true);

      const stepCounts = stepData?.reduce((acc, item) => {
        acc[item.current_step] = (acc[item.current_step] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get sport distribution
      const { data: sportData } = await supabase
        .from('team_design_flows')
        .select('sport')
        .eq('is_active', true);

      const sportCounts = sportData?.reduce((acc, item) => {
        acc[item.sport] = (acc[item.sport] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total_flows: totalFlows,
        completed_flows: completedFlows,
        active_flows: activeFlows,
        step_distribution: stepCounts,
        sport_distribution: sportCounts
      };
    } catch (error) {
      await logError('system', 'database', 'Failed to get flow statistics', error as Error);
      throw error;
    }
  }

  /**
   * Get all flows with optional filtering
   */
  async getAllFlows(filters: {
    sport?: string;
    age_group?: string;
    current_step?: FlowStep;
    debug_mode?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const { limit = 50, offset = 0, ...otherFilters } = filters;
      
      let query = supabase
        .from('team_design_flows')
        .select(`
          *,
          team_logos!team_logos_flow_id_fkey (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      Object.entries(otherFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get flows: ${error.message}`);
      }

      return (data || []) as TeamDesignFlow[];
    } catch (error) {
      await logError('system', 'database', 'Failed to get all flows', error as Error);
      throw error;
    }
  }

  /**
   * Get flows by user session
   */
  async getFlowsBySession(sessionId: string): Promise<TeamDesignFlow[]> {
    try {
      const flows = await this.findMany({ user_session_id: sessionId }, '*', 'created_at');
      return (flows as unknown) as TeamDesignFlow[];
    } catch (error) {
      await logError(sessionId, 'database', 'Failed to get flows by session', error as Error);
      throw error;
    }
  }

  /**
   * Clean up old flows (for maintenance)
   */
  async cleanupOldFlows(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Find old flows
      const { data: oldFlows } = await supabase
        .from('team_design_flows')
        .select('id')
        .lt('created_at', cutoffDate.toISOString())
        .eq('is_active', true);

      if (!oldFlows || oldFlows.length === 0) {
        return 0;
      }

      // Soft delete flows
      const flowIds = oldFlows.map(flow => flow.id);
      await supabase
        .from('team_design_flows')
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .in('id', flowIds);

      // Also soft delete related logos
      await supabase
        .from('team_logos')
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .in('flow_id', flowIds);

      await logDebug('system', 'info', 'database', `Cleaned up ${oldFlows.length} old flows`, {
        count: oldFlows.length,
        cutoff_date: cutoffDate.toISOString()
      });

      return oldFlows.length;
    } catch (error) {
      await logError('system', 'database', 'Failed to cleanup old flows', error as Error);
      throw error;
    }
  }
}
