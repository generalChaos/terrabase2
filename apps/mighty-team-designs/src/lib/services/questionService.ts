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
  selected: number | string;
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
   * Generate questions using OpenAI GPT-4o-mini (optimized for speed)
   */
  private async generateQuestionsWithAI(teamName: string, sport: string, ageGroup: string): Promise<Question[]> {
    try {
      const prompt = `Generate 5 personalized, casual questions for team logo design based on the specific team.

TEAM: "${teamName}" (${sport}, ${ageGroup})

PERSONALIZE THE QUESTIONS:
- Make questions specific to this team name and sport
- Include mascot suggestions based on the team name
- Suggest colors that would work well for this team
- Make the language feel natural and conversational
- Each question should feel like it was written specifically for this team

QUESTIONS TO GENERATE:
1. Style question - Ask about the team's vibe/personality with options that fit the sport and age group
2. Colors question - Ask about colors with smart suggestions based on team name
3. Custom colors - Text input for specific color preferences
4. Mascot question - Simple yes/no about using AI's best guess (keep it short and casual)
5. Mascot description - Simple text input for custom mascot ideas (keep it short)

TONE: Casual, parent-friendly, easy to read to kids - KEEP QUESTIONS SHORT AND SIMPLE

AGE-APPROPRIATE STYLING (CRITICAL):
- U6-U8: ONLY playful, cute, friendly, fun options (NO fierce, bold, aggressive)
- U10-U12: Mix of playful and slightly competitive (some bold OK, but keep it kid-friendly)
- U14+: Can include more competitive, bold, fierce options
- ALWAYS prioritize kid-friendly over aggressive for younger ages

AI INFERENCE: 
- Analyze team name for smart mascot suggestions (e.g., "Eagles" → Eagle, "Thunder" → Lightning bolt, "Tigers" → Tiger)
- Suggest colors that work well with the team name and sport
- Make style options appropriate for the age group and sport - YOUNGER = MORE PLAYFUL
- Keep mascot questions concise and natural

Return JSON with personalized questions:
{
  "questions": [
    {"id": "style", "text": "PERSONALIZED_STYLE_QUESTION", "type": "multiple_choice", "options": ["PERSONALIZED_OPTION_1", "PERSONALIZED_OPTION_2", "PERSONALIZED_OPTION_3", "PERSONALIZED_OPTION_4"], "selected": 0, "required": true},
    {"id": "colors", "text": "PERSONALIZED_COLORS_QUESTION", "type": "multiple_choice", "options": ["Use team colors", "Input custom colors"], "selected": 0, "required": true},
    {"id": "custom_colors", "text": "PERSONALIZED_CUSTOM_COLORS_QUESTION", "type": "text", "selected": "", "required": false},
    {"id": "mascot", "text": "PERSONALIZED_MASCOT_QUESTION", "type": "multiple_choice", "options": ["Yes", "No, I'll describe it"], "selected": 0, "required": true},
    {"id": "mascot_description", "text": "PERSONALIZED_MASCOT_DESCRIPTION_QUESTION", "type": "text", "selected": "", "required": false}
  ]
}

IMPORTANT: Replace all PERSONALIZED_* placeholders with actual personalized content based on the team name and sport.

Return JSON only.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      const questions = result.questions;
      
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
    // Age-appropriate style options
    const getStyleOptions = (ageGroup: string) => {
      if (ageGroup.startsWith('U6') || ageGroup.startsWith('U8')) {
        return ['Fun & playful', 'Cute & friendly', 'Happy & bright', 'Kid-friendly'];
      } else if (ageGroup.startsWith('U10') || ageGroup.startsWith('U12')) {
        return ['Fun & playful', 'Energetic & bold', 'Friendly & approachable', 'Competitive'];
      } else {
        return ['Fun & playful', 'Serious & tough', 'Friendly & approachable', 'Professional'];
      }
    };

    return [
      {
        id: 'style',
        text: `What vibe fits the ${teamName} best?`,
        type: 'multiple_choice',
        options: getStyleOptions(ageGroup),
        selected: 0,
        required: true
      },
      {
        id: 'colors',
        text: `What colors should we use for the ${teamName}?`,
        type: 'multiple_choice',
        options: ['Use team colors', 'Input custom colors'],
        selected: 0,
        required: true
      },
      {
        id: 'custom_colors',
        text: `What colors do you want for the ${teamName}? (e.g., 'blue and white')`,
        type: 'text',
        selected: '',
        required: false
      },
      {
        id: 'mascot',
        text: `Use our best guess for your mascot?`,
        type: 'multiple_choice',
        options: ['Yes', 'No, I\'ll describe it'],
        selected: 0,
        required: true
      },
      {
        id: 'mascot_description',
        text: `What should your mascot be?`,
        type: 'text',
        selected: '',
        required: false
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
