import { supabase } from '@/lib/supabase';
import { logDebug, logError } from '@/lib/debug';
import { TeamDesignFlow, Question, LogoVariant } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class TeamDesignService {
  /**
   * Create a new team design flow
   */
  static async createFlow(data: {
    team_name: string;
    sport: string;
    age_group: string;
    debug_mode?: boolean;
  }): Promise<TeamDesignFlow> {
    try {
      const { data: flow, error } = await supabase
        .from('team_design_flows')
        .insert({
          user_session_id: uuidv4(),
          team_name: data.team_name,
          sport: data.sport,
          age_group: data.age_group,
          round1_answers: {
            team_name: data.team_name,
            sport: data.sport,
            age_group: data.age_group
          },
          round2_questions: [],
          round2_answers: [],
          logo_variants: [],
          current_step: 'round1',
          debug_mode: data.debug_mode || false,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create flow: ${error.message}`);
      }

      if (data.debug_mode) {
        await logDebug(flow.id, 'info', 'flow_creation', 'Flow created', {
          team_name: data.team_name,
          sport: data.sport,
          age_group: data.age_group
        });
      }

      return flow;
    } catch (error) {
      console.error('Error creating flow:', error);
      throw error;
    }
  }

  /**
   * Get a team design flow by ID
   */
  static async getFlow(flowId: string): Promise<TeamDesignFlow | null> {
    try {
      const { data: flow, error } = await supabase
        .from('team_design_flows')
        .select(`
          *,
          team_logos (*)
        `)
        .eq('id', flowId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Flow not found
        }
        throw new Error(`Failed to get flow: ${error.message}`);
      }

      return flow;
    } catch (error) {
      console.error('Error getting flow:', error);
      throw error;
    }
  }

  /**
   * Update a team design flow
   */
  static async updateFlow(
    flowId: string,
    updates: Partial<TeamDesignFlow>
  ): Promise<TeamDesignFlow> {
    try {
      const { data: flow, error } = await supabase
        .from('team_design_flows')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', flowId)
        .eq('is_active', true)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update flow: ${error.message}`);
      }

      if (flow.debug_mode) {
        await logDebug(flowId, 'info', 'flow_update', 'Flow updated', {
          updated_fields: Object.keys(updates),
          current_step: flow.current_step
        });
      }

      return flow;
    } catch (error) {
      console.error('Error updating flow:', error);
      throw error;
    }
  }

  /**
   * Get question set for a team
   */
  static async getQuestionSet(sport: string, ageGroup: string): Promise<{
    id: string;
    questions: Question[];
    is_generated: boolean;
  } | null> {
    try {
      // Try to get a specific question set first
      const { data: questionSet, error } = await supabase
        .from('question_sets')
        .select('*')
        .eq('active', true)
        .or(`sport.eq.${sport},sport.is.null`)
        .or(`age_group.eq.${ageGroup},age_group.is.null`)
        .order('sort_order')
        .limit(1)
        .single();

      if (error || !questionSet) {
        // Fallback to generic question set
        const { data: fallbackSet, error: fallbackError } = await supabase
          .from('question_sets')
          .select('*')
          .eq('name', 'generic_fallback')
          .eq('active', true)
          .single();

        if (fallbackError || !fallbackSet) {
          throw new Error('No question sets available');
        }

        return {
          id: fallbackSet.id,
          questions: fallbackSet.questions as Question[],
          is_generated: fallbackSet.is_generated
        };
      }

      return {
        id: questionSet.id,
        questions: questionSet.questions as Question[],
        is_generated: questionSet.is_generated
      };
    } catch (error) {
      console.error('Error getting question set:', error);
      throw error;
    }
  }

  /**
   * Generate AI questions for Round 2
   */
  static async generateQuestions(
    flowId: string,
    teamName: string,
    sport: string,
    ageGroup: string,
    round1Answers: Record<string, any>
  ): Promise<{
    id: string;
    questions: Question[];
    is_generated: boolean;
  }> {
    try {
      // Get the question generation prompt
      const { data: prompt, error: promptError } = await supabase
        .from('logo_prompts')
        .select('*')
        .eq('name', 'question_generation')
        .eq('active', true)
        .single();

      if (promptError || !prompt) {
        throw new Error('Question generation prompt not found');
      }

      // Prepare the prompt with team data
      const promptText = prompt.prompt_text
        .replace('{team}', teamName)
        .replace('{sport}', sport)
        .replace('{age}', ageGroup);

      // This would typically call OpenAI here
      // For now, return a mock response
      const mockQuestions: Question[] = [
        {
          id: 'style',
          text: 'What best fits your team?',
          type: 'multiple_choice',
          options: ['Fun', 'Professional', 'Tough', 'Friendly'],
          selected: 0,
          required: true
        },
        {
          id: 'colors',
          text: 'What colors work for your team?',
          type: 'multiple_choice',
          options: ['Team colors', 'Custom colors', 'Classic colors'],
          selected: 0,
          required: true
        },
        {
          id: 'mascot',
          text: 'Should your logo include a mascot?',
          type: 'multiple_choice',
          options: ['Yes', 'No', 'Text only'],
          selected: 0,
          required: true
        }
      ];

      // Save the generated question set
      const { data: questionSet, error: saveError } = await supabase
        .from('question_sets')
        .insert({
          name: `generated_${flowId}`,
          sport: sport,
          age_group: ageGroup,
          questions: mockQuestions,
          is_generated: true,
          generation_prompt: promptText,
          generation_model: 'gpt-4o-mini',
          active: true
        })
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save generated questions: ${saveError.message}`);
      }

      await logDebug(flowId, 'info', 'question_generation', 'AI questions generated', {
        question_count: mockQuestions.length,
        sport: sport,
        age_group: ageGroup,
        question_set_id: questionSet.id
      });

      return {
        id: questionSet.id,
        questions: mockQuestions,
        is_generated: true
      };
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  }

  /**
   * Generate team logo(s)
   */
  static async generateLogos(
    flowId: string,
    teamName: string,
    sport: string,
    ageGroup: string,
    round1Answers: Record<string, any>,
    round2Answers: Question[],
    variantCount: number = 1
  ): Promise<LogoVariant[]> {
    try {
      // Get the logo generation prompt
      const { data: prompt, error: promptError } = await supabase
        .from('logo_prompts')
        .select('*')
        .eq('name', 'team_logo_generation')
        .eq('active', true)
        .single();

      if (promptError || !prompt) {
        throw new Error('Logo generation prompt not found');
      }

      // Extract answers for prompt generation
      const style = round2Answers.find(a => a.id === 'style')?.selected || 0;
      const colors = round2Answers.find(a => a.id === 'colors')?.selected || 0;
      const mascot = round2Answers.find(a => a.id === 'mascot')?.selected || 0;

      const styleOptions = round2Answers.find(a => a.id === 'style')?.options || ['Fun', 'Professional', 'Tough', 'Friendly'];
      const colorOptions = round2Answers.find(a => a.id === 'colors')?.options || ['Team colors', 'Custom colors', 'Classic colors'];
      const mascotOptions = round2Answers.find(a => a.id === 'mascot')?.options || ['Yes', 'No', 'Text only'];

      // Prepare the prompt with team data
      const promptText = prompt.prompt_text
        .replace('{team}', teamName)
        .replace('{sport}', sport)
        .replace('{age}', ageGroup)
        .replace('{style}', styleOptions[style])
        .replace('{colors}', colorOptions[colors])
        .replace('{mascot}', mascotOptions[mascot]);

      const startTime = Date.now();
      const generatedLogos: LogoVariant[] = [];

      // Generate the requested number of logo variants
      for (let i = 0; i < variantCount; i++) {
        try {
          // Mock logo generation - in real implementation, this would call OpenAI
          const fileName = `${flowId}/variant_${i + 1}_${Date.now()}.png`;
          const mockPublicUrl = `https://example.com/logos/${fileName}`;

          // Save logo metadata to database
          const { data: logo, error: logoError } = await supabase
            .from('team_logos')
            .insert({
              flow_id: flowId,
              file_path: fileName,
              file_size: 1024000, // Mock file size
              mime_type: 'image/png',
              storage_bucket: 'team-logos',
              variant_number: i + 1,
              is_selected: i === 0,
              generation_prompt: promptText,
              model_used: 'gpt-image-1',
              generation_time_ms: Date.now() - startTime,
              generation_cost_usd: 0.08
            })
            .select()
            .single();

          if (logoError) {
            throw new Error(`Failed to save logo metadata: ${logoError.message}`);
          }

          generatedLogos.push({
            id: logo.id,
            variant_number: i + 1,
            file_path: fileName,
            public_url: mockPublicUrl,
            is_selected: i === 0,
            generation_prompt: `Mock logo for ${teamName} (${sport}, ${ageGroup})`,
            model_used: 'mock',
            generation_time_ms: 0,
            generation_cost_usd: 0,
            created_at: new Date().toISOString()
          });

        } catch (variantError) {
          console.error(`Error generating variant ${i + 1}:`, variantError);
          // Continue with other variants even if one fails
        }
      }

      if (generatedLogos.length === 0) {
        throw new Error('Failed to generate any logo variants');
      }

      // Update the flow with logo data
      await this.updateFlow(flowId, {
        logo_prompt: promptText,
        logo_variants: generatedLogos,
        selected_logo_id: generatedLogos[0].id,
        logo_generated_at: new Date().toISOString(),
        current_step: 'completed'
      });

      await logDebug(flowId, 'info', 'logo_generation', 'Logos generated successfully', {
        variant_count: generatedLogos.length,
        generation_time_ms: Date.now() - startTime,
        team_name: teamName,
        sport: sport,
        age_group: ageGroup
      });

      return generatedLogos;
    } catch (error) {
      console.error('Error generating logos:', error);
      throw error;
    }
  }

  /**
   * Select a logo variant
   */
  static async selectLogo(flowId: string, logoId: string): Promise<void> {
    try {
      // Update the flow with selected logo
      await supabase
        .from('team_design_flows')
        .update({
          selected_logo_id: logoId,
          updated_at: new Date().toISOString()
        })
        .eq('id', flowId);

      // Update logo selection status
      await supabase
        .from('team_logos')
        .update({ is_selected: false })
        .eq('flow_id', flowId);

      await supabase
        .from('team_logos')
        .update({ is_selected: true })
        .eq('id', logoId);

    } catch (error) {
      console.error('Error selecting logo:', error);
      throw error;
    }
  }

  /**
   * Delete a flow (soft delete)
   */
  static async deleteFlow(flowId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_design_flows')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', flowId);

      if (error) {
        throw new Error(`Failed to delete flow: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting flow:', error);
      throw error;
    }
  }
}
