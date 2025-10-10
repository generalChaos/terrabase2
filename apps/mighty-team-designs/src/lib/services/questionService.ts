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

export interface ColorOption {
  id: string;
  name: string;
  primary: string;    // hex code
  secondary: string;  // hex code  
  accent: string;     // hex code
  description: string;
}

export interface MascotOption {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
}

export class QuestionService extends BaseService {
  private lastGenerationTime = 0;
  private readonly MIN_GENERATION_INTERVAL = 2000; // 2 seconds between generations

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
   * Generate colors and mascots for V1 flow (public method)
   */
  async generateColorsAndMascotsForFlow(flowId: string, teamName: string, sport: string, logoStyle: string): Promise<{ colors: ColorOption[], mascots: MascotOption[] }> {
    try {
      console.log('=== COLOR/MASCOT GENERATION DEBUG ===');
      console.log('🎯 Team Name:', teamName);
      console.log('🏀 Sport:', sport);
      console.log('🎨 Logo Style:', logoStyle);
      
      await logDebug(flowId, 'info', 'ai_generation', `Generating colors and mascots for flow ${flowId}`, {
        teamName,
        sport,
        logoStyle
      });
      
      const isOpenAIAvailable = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here');
      console.log('🤖 OpenAI Available:', isOpenAIAvailable);
      console.log('🔑 API Key exists:', !!process.env.OPENAI_API_KEY);
      console.log('🔑 API Key value:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
      
      if (isOpenAIAvailable) {
        console.log('🚀 Attempting AI generation...');
        const result = await this.generateColorsAndMascotsWithAI(teamName, sport, logoStyle);
        console.log('✅ AI generation successful');
        console.log('🎨 Generated colors:', result.colors.length);
        console.log('🦅 Generated mascots:', result.mascots.length);
        return result;
      } else {
        console.log('⚠️ Using fallback generation');
        const result = this.getFallbackColorsAndMascots(teamName, sport, logoStyle);
        console.log('📋 Fallback colors:', result.colors.length);
        console.log('📋 Fallback mascots:', result.mascots.length);
        return result;
      }
    } catch (error) {
      console.error('❌ Error in generateColorsAndMascotsForFlow:', error);
      await logError(flowId, 'ai_generation', 'Failed to generate colors and mascots', error as Error);
      throw error;
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

  /**
   * Generate colors and mascots using OpenAI
   */
  private async generateColorsAndMascotsWithAI(teamName: string, sport: string, logoStyle: string): Promise<{ colors: ColorOption[], mascots: MascotOption[] }> {
    try {
      console.log('=== AI GENERATION METHOD CALLED ===');
      console.log('🎯 Team Name:', teamName);
      console.log('🏀 Sport:', sport);
      console.log('🎨 Logo Style:', logoStyle);
      
      const prompt = `Generate 5 color combinations and 4 mascot concepts for a team logo based on the team name and style.

TEAM: "${teamName}" (${sport}, ${logoStyle})

COLOR GENERATION RULES:
1. If the team name suggests colors (e.g., "Red Devils" → red, "Blue Jays" → blue), create 4 variations based on that color
2. If no obvious color from team name, suggest 4 popular team color combinations like "Blue & White", "Red & Black", "Green & Gold", "Purple & Silver"
3. ALWAYS include a 5th option: "Custom colors" with placeholder colors and description encouraging user input
4. Each color combination should have: primary color, secondary color, accent color (all as hex codes)
5. Make sure colors work well together and are appropriate for the ${logoStyle} style

MASCOT GENERATION RULES:
1. Analyze the team name to extract the primary mascot concept (e.g., "Thunder Hawks" → hawk, "Blue Vipers" → viper, "Golden Tigers" → tiger)
2. If team name suggests a clear mascot, create 4 different variations of that SAME mascot concept, each inspired by the ${logoStyle} style
3. Each variation should be a different visual interpretation of the same mascot (e.g., 4 different hawk designs, 4 different viper designs)
4. Style inspiration examples:
   - "fun-and-friendly": Cartoon-like, bright, approachable versions
   - "bold-and-competitive": Strong, confident, professional versions  
   - "dynamic-and-fierce": Aggressive, energetic, action-oriented versions
   - "classic-and-iconic": Timeless, traditional, heritage-inspired versions
5. If no clear mascot can be inferred from team name, suggest 4 different "best guess" mascot concepts that fit the sport and style
6. Each mascot should have: name, description, and 2-3 key visual characteristics
7. ALWAYS include a 5th option: "Custom mascot" with placeholder content encouraging user input

Return JSON format:
{
  "colors": [
    {
      "id": "color_1",
      "name": "Blue & White",
      "primary": "#1E3A8A",
      "secondary": "#FFFFFF", 
      "accent": "#3B82F6",
      "description": "Classic team colors that work great for any sport"
    },
    {
      "id": "custom_colors",
      "name": "Custom colors",
      "primary": "#6B7280",
      "secondary": "#9CA3AF",
      "accent": "#D1D5DB",
      "description": "Describe your own color combination (e.g., 'purple and teal')"
    }
  ],
  "mascots": [
    {
      "id": "hawk_1",
      "name": "Classic Hawk",
      "description": "Traditional hawk design with bold, competitive styling",
      "characteristics": ["Wings spread", "Sharp talons", "Confident posture"]
    },
    {
      "id": "hawk_2", 
      "name": "Dynamic Hawk",
      "description": "Energetic hawk in action pose for competitive teams",
      "characteristics": ["Mid-flight pose", "Intense eyes", "Streamlined body"]
    },
    {
      "id": "hawk_3",
      "name": "Power Hawk",
      "description": "Strong, muscular hawk representing team strength",
      "characteristics": ["Broad chest", "Powerful stance", "Determined look"]
    },
    {
      "id": "hawk_4",
      "name": "Victory Hawk",
      "description": "Triumphant hawk celebrating team success",
      "characteristics": ["Head held high", "Wings raised", "Proud expression"]
    },
    {
      "id": "custom_mascot",
      "name": "Custom mascot",
      "description": "Describe your own mascot concept (e.g., 'a fierce dragon' or 'a lightning bolt')",
      "characteristics": ["Your choice", "Your design", "Your vision"]
    }
  ]
}

Generate exactly 5 colors and 5 mascots. Return JSON only.`;

      console.log('📝 Sending prompt to OpenAI...');
      console.log('📏 Prompt length:', prompt.length, 'characters');
      
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
        max_tokens: 800
      });

      console.log('✅ OpenAI response received');
      console.log('📊 Response choices:', response.choices?.length || 0);
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error('❌ No response content from OpenAI');
        throw new Error('No response from OpenAI');
      }

      console.log('📄 Raw AI response:');
      console.log(content.substring(0, 500) + '...');

      const result = JSON.parse(content);
      console.log('✅ JSON parsed successfully');
      console.log('🎨 Parsed colors:', result.colors?.length || 0);
      console.log('🦅 Parsed mascots:', result.mascots?.length || 0);
      
      // Validate the response structure
      if (!result.colors || !Array.isArray(result.colors) || result.colors.length !== 5) {
        throw new Error('Invalid colors format from OpenAI');
      }
      
      if (!result.mascots || !Array.isArray(result.mascots) || result.mascots.length !== 5) {
        throw new Error('Invalid mascots format from OpenAI');
      }

      return {
        colors: result.colors,
        mascots: result.mascots
      };
    } catch (error) {
      console.error('❌ OpenAI color/mascot generation failed:', error);
      
      // Check if it's a rate limit or quota error
      if (error instanceof Error && error.message.includes('429')) {
        console.warn('⚠️ Rate limit exceeded, using fallback');
      } else if (error instanceof Error && (error.message.includes('quota') || error.message.includes('insufficient'))) {
        console.warn('⚠️ API quota insufficient, using fallback');
      } else {
        console.warn('⚠️ Other OpenAI error, using fallback:', error instanceof Error ? error.message : 'Unknown error');
      }
      
      return this.getFallbackColorsAndMascots(teamName, sport, logoStyle);
    }
  }

  /**
   * Get fallback colors and mascots when AI is not available
   */
  private getFallbackColorsAndMascots(teamName: string, sport: string, logoStyle: string): { colors: ColorOption[], mascots: MascotOption[] } {
    // Popular team color combinations
    const colors: ColorOption[] = [
      {
        id: 'blue_white',
        name: 'Blue & White',
        primary: '#1E3A8A',
        secondary: '#FFFFFF',
        accent: '#3B82F6',
        description: 'Classic team colors that work great for any sport'
      },
      {
        id: 'red_black',
        name: 'Red & Black',
        primary: '#DC2626',
        secondary: '#000000',
        accent: '#F59E0B',
        description: 'Bold and powerful combination perfect for competitive teams'
      },
      {
        id: 'green_gold',
        name: 'Green & Gold',
        primary: '#059669',
        secondary: '#F59E0B',
        accent: '#10B981',
        description: 'Fresh and energetic colors that stand out on the field'
      },
      {
        id: 'purple_silver',
        name: 'Purple & Silver',
        primary: '#7C3AED',
        secondary: '#6B7280',
        accent: '#A78BFA',
        description: 'Unique and modern combination for distinctive team identity'
      },
      {
        id: 'custom_colors',
        name: 'Custom colors',
        primary: '#6B7280',
        secondary: '#9CA3AF',
        accent: '#D1D5DB',
        description: 'Describe your own color combination (e.g., "purple and teal")'
      }
    ];

    // Analyze team name for smart mascot suggestions
    const teamNameLower = teamName.toLowerCase();
    let suggestedMascots: MascotOption[] = [];
    
    console.log('🔍 Analyzing team name for mascot suggestions:', teamNameLower);
    
    // Extract mascot concepts from team name
    if (teamNameLower.includes('hawk') || teamNameLower.includes('eagle') || teamNameLower.includes('bird')) {
      console.log('🦅 Detected bird-related team name, suggesting hawk variations');
      suggestedMascots = [
        {
          id: 'hawk',
          name: 'Hawk',
          description: 'Powerful bird of prey representing speed and precision',
          characteristics: ['Sharp talons', 'Wings spread', 'Fierce eyes']
        },
        {
          id: 'eagle',
          name: 'Eagle',
          description: 'Majestic bird symbolizing strength and freedom',
          characteristics: ['Wings spread', 'Sharp beak', 'Regal posture']
        },
        {
          id: 'falcon',
          name: 'Falcon',
          description: 'Fast and agile bird perfect for dynamic teams',
          characteristics: ['Streamlined body', 'Sharp vision', 'Swift movement']
        },
        {
          id: 'phoenix',
          name: 'Phoenix',
          description: 'Mythical bird representing rebirth and determination',
          characteristics: ['Fire wings', 'Majestic presence', 'Eternal spirit']
        }
      ];
    } else if (teamNameLower.includes('tiger') || teamNameLower.includes('lion') || teamNameLower.includes('cat')) {
      suggestedMascots = [
        {
          id: 'tiger',
          name: 'Tiger',
          description: 'Fierce predator representing strength and agility',
          characteristics: ['Striped pattern', 'Sharp claws', 'Intense gaze']
        },
        {
          id: 'lion',
          name: 'Lion',
          description: 'King of the jungle symbolizing courage and leadership',
          characteristics: ['Mane flowing', 'Strong jaw', 'Regal posture']
        },
        {
          id: 'panther',
          name: 'Panther',
          description: 'Stealthy and powerful big cat for competitive teams',
          characteristics: ['Sleek body', 'Sharp claws', 'Night vision']
        },
        {
          id: 'jaguar',
          name: 'Jaguar',
          description: 'Fast and powerful cat representing speed and strength',
          characteristics: ['Spotted coat', 'Muscular build', 'Fierce expression']
        }
      ];
    } else if (teamNameLower.includes('shark') || teamNameLower.includes('fish') || teamNameLower.includes('water')) {
      suggestedMascots = [
        {
          id: 'shark',
          name: 'Shark',
          description: 'Fast and powerful predator perfect for competitive teams',
          characteristics: ['Sharp teeth', 'Streamlined body', 'Intense eyes']
        },
        {
          id: 'orca',
          name: 'Orca',
          description: 'Intelligent and powerful marine predator',
          characteristics: ['Black and white', 'Strong tail', 'Team hunting']
        },
        {
          id: 'dolphin',
          name: 'Dolphin',
          description: 'Intelligent and playful marine animal',
          characteristics: ['Friendly smile', 'Sleek body', 'Team spirit']
        },
        {
          id: 'kraken',
          name: 'Kraken',
          description: 'Mythical sea monster representing power and mystery',
          characteristics: ['Tentacles', 'Deep sea', 'Legendary strength']
        }
      ];
    } else {
      // Generic fallback mascots
      suggestedMascots = [
        {
          id: 'eagle',
          name: 'Eagle',
          description: 'Strong and majestic bird representing power and freedom',
          characteristics: ['Wings spread', 'Sharp talons', 'Fierce expression']
        },
        {
          id: 'lion',
          name: 'Lion',
          description: 'King of the jungle symbolizing courage and leadership',
          characteristics: ['Mane flowing', 'Strong jaw', 'Regal posture']
        },
        {
          id: 'shark',
          name: 'Shark',
          description: 'Fast and powerful predator perfect for competitive teams',
          characteristics: ['Sharp teeth', 'Streamlined body', 'Intense eyes']
        },
        {
          id: 'bear',
          name: 'Bear',
          description: 'Strong and protective animal representing team unity',
          characteristics: ['Muscular build', 'Protective stance', 'Determined look']
        }
      ];
    }

    // Add custom mascot option
    suggestedMascots.push({
      id: 'custom_mascot',
      name: 'Custom mascot',
      description: 'Describe your own mascot concept (e.g., "a fierce dragon" or "a lightning bolt")',
      characteristics: ['Your choice', 'Your design', 'Your vision']
    });

    const mascots: MascotOption[] = suggestedMascots;

    return { colors, mascots };
  }
}
