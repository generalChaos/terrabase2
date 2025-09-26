import { supabase } from '@/lib/supabase';
import { BaseService } from './baseService';
import { logDebug, logError } from '@/lib/debug';
import { openai } from '@/lib/openai';

export interface QuestionSet {
  id: string;
  sport: string;
  age_group: string;
  questions: Question[];
  is_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text';
  options?: string[];
  required: boolean;
  selected?: number;
}

export class QuestionService extends BaseService {
  constructor() {
    super('question_sets');
  }

  /**
   * Get or generate questions for a specific sport and age group
   */
  async getQuestionsForFlow(flowId: string, sport: string, ageGroup: string): Promise<QuestionSet> {
    try {
      // Always generate fresh questions for personalization
      // Note: This method is deprecated in favor of generateQuestionsForFlow with team name
      const generatedSet = await this.generateQuestions(flowId, 'Team', sport, ageGroup);
      
      await logDebug('system', 'info', 'question_generation', `Generated fresh question set for ${sport} ${ageGroup}`, {
        question_set_id: generatedSet.id,
        question_count: generatedSet.questions.length
      });

      return generatedSet;
    } catch (error) {
      await logError('system', 'question_generation', 'Failed to get questions for flow', error as Error);
      throw error;
    }
  }

  /**
   * Get questions by sport and age group (public method)
   */
  async getQuestionsBySportAndAge(sport: string, ageGroup: string): Promise<QuestionSet | null> {
    try {
      await logDebug('system', 'info', 'question_generation', `Getting questions for ${sport} ${ageGroup}`);
      
      const questionSet = await this.findExistingQuestionSet(sport, ageGroup);
      
      if (questionSet) {
        await logDebug('system', 'info', 'question_generation', `Found existing question set`, {
          question_set_id: questionSet.id,
          question_count: questionSet.questions.length
        });
        return questionSet;
      }
      
      await logDebug('system', 'info', 'question_generation', `No existing question set found for ${sport} ${ageGroup}`);
      return null;
    } catch (error) {
      await logError('system', 'question_generation', 'Failed to get questions by sport and age', error as Error);
      return null;
    }
  }

  /**
   * Generate questions for a flow (public method)
   */
  async generateQuestionsForFlow(flowId: string, teamName: string, sport: string, ageGroup: string): Promise<QuestionSet> {
    try {
      await logDebug(flowId, 'info', 'question_generation', `Generating fresh questions for flow ${flowId}`, {
        teamName,
        sport,
        ageGroup
      });
      
      // Always generate fresh questions for personalization
      const questionSet = await this.generateQuestions(flowId, teamName, sport, ageGroup);
      
      await logDebug(flowId, 'info', 'question_generation', `Generated fresh question set`, {
        question_set_id: questionSet.id,
        question_count: questionSet.questions.length
      });
      
      return questionSet;
    } catch (error) {
      await logError(flowId, 'question_generation', 'Failed to generate questions for flow', error as Error);
      throw error;
    }
  }

  /**
   * Find existing question set for sport and age group
   */
  private async findExistingQuestionSet(sport: string, ageGroup: string): Promise<QuestionSet | null> {
    try {
      const { data, error } = await supabase
        .from('question_sets')
        .select('*')
        .eq('sport', sport)
        .eq('age_group', ageGroup)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data as QuestionSet;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate new questions using OpenAI
   */
  private async generateQuestions(flowId: string, teamName: string, sport: string, ageGroup: string): Promise<QuestionSet> {
    try {
      // Check if OpenAI is available
      const isOpenAIAvailable = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here');

      let questions: Question[];

      if (isOpenAIAvailable) {
        questions = await this.generateQuestionsWithAI(teamName, sport, ageGroup);
      } else {
        questions = this.getFallbackQuestions(teamName, sport, ageGroup);
      }

      // Save the generated question set (generic for sport + age group)
      // Use timestamp to ensure uniqueness since we generate fresh questions each time
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const questionSet = await this.create({
        name: `${sport}_${ageGroup}_questions_${timestamp}`,
        sport,
        age_group: ageGroup,
        questions,
        is_generated: isOpenAIAvailable,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return questionSet as QuestionSet;
    } catch (error) {
      await logError('system', 'question_generation', 'Failed to generate questions', error as Error);
      throw error;
    }
  }

  /**
   * Generate questions using OpenAI GPT-4o-mini
   */
  private async generateQuestionsWithAI(teamName: string, sport: string, ageGroup: string): Promise<Question[]> {
    try {
      const prompt = `Generate 3 creative team logo design questions for the "${teamName}" ${ageGroup} ${sport} team. 
      
      Requirements:
      - Questions should help determine logo style, colors, and mascot preferences
      - Use multiple choice format with 3-4 options each
      - Make questions age-appropriate for ${ageGroup}
      - Focus on visual design preferences
      - Make questions feel personalized for the team name "${teamName}"`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a creative team logo design expert. Generate helpful questions for team logo preferences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        functions: [
          {
            name: 'generate_questions',
            description: 'Generate team logo design questions',
            parameters: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        description: 'Unique identifier for the question'
                      },
                      text: {
                        type: 'string',
                        description: 'The question text'
                      },
                      type: {
                        type: 'string',
                        enum: ['multiple_choice'],
                        description: 'Type of question'
                      },
                      options: {
                        type: 'array',
                        items: {
                          type: 'string'
                        },
                        description: 'Available answer options'
                      },
                      required: {
                        type: 'boolean',
                        description: 'Whether the question is required'
                      }
                    },
                    required: ['id', 'text', 'type', 'options', 'required']
                  }
                }
              },
              required: ['questions']
            }
          }
        ],
        function_call: { name: 'generate_questions' },
        temperature: 0.7,
        max_tokens: 1000
      });

      const functionCall = response.choices[0]?.message?.function_call;
      if (!functionCall || functionCall.name !== 'generate_questions') {
        throw new Error('No function call response from OpenAI');
      }

      const args = JSON.parse(functionCall.arguments);
      const questions = args.questions;
      
      // Validate the response structure
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format from OpenAI');
      }

      return questions;
    } catch (error) {
      console.warn('OpenAI question generation failed, using fallback:', error);
      return this.getFallbackQuestions(teamName, sport, ageGroup);
    }
  }

  /**
   * Get fallback questions when AI is not available
   */
  private getFallbackQuestions(teamName: string, sport: string, ageGroup: string): Question[] {
    return [
      {
        id: 'style',
        text: `What best fits the ${teamName} team?`,
        type: 'multiple_choice',
        options: ['Fun', 'Professional', 'Tough', 'Friendly'],
        required: true
      },
      {
        id: 'colors',
        text: `What colors work for the ${teamName} team?`,
        type: 'multiple_choice',
        options: ['Team colors', 'Custom colors', 'Classic colors'],
        required: true
      },
      {
        id: 'mascot',
        text: `Should the ${teamName} logo include a mascot?`,
        type: 'multiple_choice',
        options: ['Yes', 'No', 'Text only'],
        required: true
      }
    ];
  }

  /**
   * Get all question sets with optional filtering
   */
  async getAllQuestionSets(filters: { sport?: string; age_group?: string; is_generated?: boolean } = {}) {
    return this.findMany(filters, '*', 'created_at');
  }

  /**
   * Get question set by ID
   */
  async getQuestionSetById(id: string): Promise<QuestionSet | null> {
    try {
      return await this.findById(id) as unknown as QuestionSet;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update question set
   */
  async updateQuestionSet(id: string, data: Partial<QuestionSet>) {
    return this.update(id, {
      ...data,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Delete question set (soft delete)
   */
  async deleteQuestionSet(id: string) {
    return this.softDelete(id);
  }

  /**
   * Get question statistics
   */
  async getQuestionStats() {
    try {
      const totalSets = await this.count();
      const generatedSets = await this.count({ is_generated: true });
      const manualSets = await this.count({ is_generated: false });

      // Get sport distribution
      const { data: sportData } = await supabase
        .from('question_sets')
        .select('sport')
        .eq('is_active', true);

      const sportCounts = sportData?.reduce((acc, item) => {
        acc[item.sport] = (acc[item.sport] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        total_sets: totalSets,
        generated_sets: generatedSets,
        manual_sets: manualSets,
        sport_distribution: sportCounts
      };
    } catch (error) {
      await logError('system', 'question_generation', 'Failed to get question statistics', error as Error);
      throw error;
    }
  }
}
