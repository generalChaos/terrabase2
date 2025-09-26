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
      // First, try to find an existing question set
      const existingSet = await this.findExistingQuestionSet(sport, ageGroup);
      
      if (existingSet) {
        await logDebug('QUESTION_CACHE_HIT', `Found existing question set for ${sport} ${ageGroup}`, {
          question_set_id: existingSet.id,
          question_count: existingSet.questions.length
        });
        return existingSet;
      }

      // If no existing set, generate new questions
      const generatedSet = await this.generateQuestions(flowId, sport, ageGroup);
      
      await logDebug('QUESTION_GENERATION', `Generated new question set for ${sport} ${ageGroup}`, {
        question_set_id: generatedSet.id,
        question_count: generatedSet.questions.length
      });

      return generatedSet;
    } catch (error) {
      await logError('QUESTION_SERVICE_ERROR', 'Failed to get questions for flow', error as Error);
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
  private async generateQuestions(flowId: string, sport: string, ageGroup: string): Promise<QuestionSet> {
    try {
      // Check if OpenAI is available
      const isOpenAIAvailable = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here');

      let questions: Question[];

      if (isOpenAIAvailable) {
        questions = await this.generateQuestionsWithAI(sport, ageGroup);
      } else {
        questions = this.getFallbackQuestions(sport, ageGroup);
      }

      // Save the generated question set
      const questionSet = await this.create({
        sport,
        age_group: ageGroup,
        questions,
        is_generated: isOpenAIAvailable,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return questionSet as QuestionSet;
    } catch (error) {
      await logError('QUESTION_GENERATION_ERROR', 'Failed to generate questions', error as Error);
      throw error;
    }
  }

  /**
   * Generate questions using OpenAI GPT-4o-mini
   */
  private async generateQuestionsWithAI(sport: string, ageGroup: string): Promise<Question[]> {
    try {
      const prompt = `Generate 3 creative team logo design questions for a ${ageGroup} ${sport} team. 
      
      Requirements:
      - Questions should help determine logo style, colors, and mascot preferences
      - Use multiple choice format with 3-4 options each
      - Make questions age-appropriate for ${ageGroup}
      - Focus on visual design preferences
      
      Return as JSON array with this structure:
      [
        {
          "id": "style",
          "text": "What best fits your team?",
          "type": "multiple_choice",
          "options": ["Fun", "Professional", "Tough", "Friendly"],
          "required": true
        }
      ]`;

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
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const questions = JSON.parse(content);
      
      // Validate the response structure
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format from OpenAI');
      }

      return questions;
    } catch (error) {
      console.warn('OpenAI question generation failed, using fallback:', error);
      return this.getFallbackQuestions(sport, ageGroup);
    }
  }

  /**
   * Get fallback questions when AI is not available
   */
  private getFallbackQuestions(sport: string, ageGroup: string): Question[] {
    return [
      {
        id: 'style',
        text: 'What best fits your team?',
        type: 'multiple_choice',
        options: ['Fun', 'Professional', 'Tough', 'Friendly'],
        required: true
      },
      {
        id: 'colors',
        text: 'What colors work for your team?',
        type: 'multiple_choice',
        options: ['Team colors', 'Custom colors', 'Classic colors'],
        required: true
      },
      {
        id: 'mascot',
        text: 'Should your logo include a mascot?',
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
      return await this.findById(id) as QuestionSet;
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
      await logError('QUESTION_STATS_ERROR', 'Failed to get question statistics', error as Error);
      throw error;
    }
  }
}
