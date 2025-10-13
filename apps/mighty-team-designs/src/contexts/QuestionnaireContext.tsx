'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TeamDesignFlow, Question, LogoVariant, FlowStep } from '@/types';
import { ColorOption, MascotOption } from '@/lib/services/questionService';

interface QuestionnaireState {
  flow: TeamDesignFlow | null;
  currentStep: FlowStep;
  isLoading: boolean;
  error: string | null;
  round1Answers: {
    team_name: string;
    sport: string;
    logo_style: string;
  };
  round2Questions: Question[];
  round2Answers: Question[];
  colors: ColorOption[];
  mascots: MascotOption[];
  selectedColors: string | null;
  selectedMascot: string | null;
  customColorInput: string;
  customMascotInput: string;
  logoVariants: LogoVariant[];
  selectedLogoId: string | null;
}

type QuestionnaireAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FLOW'; payload: TeamDesignFlow }
  | { type: 'SET_CURRENT_STEP'; payload: FlowStep }
  | { type: 'UPDATE_ROUND1_ANSWERS'; payload: Partial<QuestionnaireState['round1Answers']> }
  | { type: 'SET_ROUND2_QUESTIONS'; payload: Question[] }
  | { type: 'UPDATE_ROUND2_ANSWER'; payload: { questionId: string; selected: number | string } }
  | { type: 'SET_COLORS'; payload: ColorOption[] }
  | { type: 'SET_MASCOTS'; payload: MascotOption[] }
  | { type: 'SELECT_COLORS'; payload: string }
  | { type: 'SELECT_MASCOT'; payload: string }
  | { type: 'SET_CUSTOM_COLOR_INPUT'; payload: string }
  | { type: 'SET_CUSTOM_MASCOT_INPUT'; payload: string }
  | { type: 'SET_LOGO_VARIANTS'; payload: LogoVariant[] }
  | { type: 'SELECT_LOGO'; payload: string }
  | { type: 'RESET' };

const initialState: QuestionnaireState = {
  flow: null,
  currentStep: 'round1',
  isLoading: false,
  error: null,
  round1Answers: {
    team_name: '',
    sport: '',
    logo_style: ''
  },
  round2Questions: [],
  round2Answers: [],
  colors: [],
  mascots: [],
  selectedColors: null,
  selectedMascot: null,
  customColorInput: '',
  customMascotInput: '',
  logoVariants: [],
  selectedLogoId: null
};

function questionnaireReducer(state: QuestionnaireState, action: QuestionnaireAction): QuestionnaireState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_FLOW':
      return {
        ...state,
        flow: action.payload,
        currentStep: action.payload.current_step as FlowStep,
        round1Answers: (action.payload.round1_answers as { team_name: string; sport: string; logo_style: string }) || state.round1Answers,
        round2Questions: action.payload.round2_questions || [],
        round2Answers: (action.payload.round2_answers as unknown as Question[]) || [],
        logoVariants: action.payload.logo_variants || [],
        selectedLogoId: action.payload.selected_logo_id || null,
        isLoading: false,
        error: null
      };
    
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    
    case 'UPDATE_ROUND1_ANSWERS':
      return {
        ...state,
        round1Answers: { ...state.round1Answers, ...action.payload }
      };
    
    case 'SET_ROUND2_QUESTIONS':
      return {
        ...state,
        round2Questions: action.payload,
        round2Answers: action.payload.map(q => ({ 
          ...q, 
          selected: q.selected ?? (q.type === 'text' ? '' : 0) 
        }))
      };
    
    case 'UPDATE_ROUND2_ANSWER':
      return {
        ...state,
        round2Answers: state.round2Answers.map(answer =>
          answer.id === action.payload.questionId
            ? { ...answer, selected: action.payload.selected }
            : answer
        )
      };
    
    case 'SET_COLORS':
      return { ...state, colors: action.payload };
    
    case 'SET_MASCOTS':
      return { ...state, mascots: action.payload };
    
    case 'SELECT_COLORS':
      return { ...state, selectedColors: action.payload };
    
    case 'SELECT_MASCOT':
      return { ...state, selectedMascot: action.payload };
    
    case 'SET_CUSTOM_COLOR_INPUT':
      return { ...state, customColorInput: action.payload };
    
    case 'SET_CUSTOM_MASCOT_INPUT':
      return { ...state, customMascotInput: action.payload };
    
    case 'SET_LOGO_VARIANTS':
      return {
        ...state,
        logoVariants: action.payload,
        selectedLogoId: action.payload.length > 0 ? action.payload[0].id : null
      };
    
    case 'SELECT_LOGO':
      return {
        ...state,
        selectedLogoId: action.payload
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

interface QuestionnaireContextType {
  state: QuestionnaireState;
  dispatch: React.Dispatch<QuestionnaireAction>;
  // Actions
  createFlow: (data: { team_name: string; sport: string; logo_style: string; debug_mode?: boolean }) => Promise<void>;
  updateFlow: (updates: Partial<TeamDesignFlow>) => Promise<void>;
  getQuestions: (sport: string, ageGroup: string) => Promise<void>;
  generateQuestions: () => Promise<void>;
  generateColorsAndMascots: () => Promise<void>;
  generateLogos: () => Promise<void>;
  selectLogo: (logoId: string) => Promise<void>;
  reset: () => void;
}

const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined);

export function QuestionnaireProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(questionnaireReducer, initialState);

  const createFlow = async (data: { team_name: string; sport: string; logo_style: string; debug_mode?: boolean }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create flow');
      }

      const result = await response.json();
      dispatch({ type: 'SET_FLOW', payload: result.data });
      
      // Store round 1 answers including logo_style
      dispatch({ 
        type: 'UPDATE_ROUND1_ANSWERS', 
        payload: {
          team_name: data.team_name,
          sport: data.sport,
          logo_style: data.logo_style
        }
      });
      
      // Advance to round 2 after creating the flow
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'round2' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const updateFlow = async (updates: Partial<TeamDesignFlow>) => {
    if (!state.flow) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await fetch(`/api/flows/${state.flow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update flow');
      }

      const result = await response.json();
      dispatch({ type: 'SET_FLOW', payload: result.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const getQuestions = async (sport: string, ageGroup: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await fetch(`/api/questions?sport=${sport}&age_group=${ageGroup}`);
      
      if (!response.ok) {
        throw new Error('Failed to get questions');
      }

      const result = await response.json();
      
      if (result.data && result.data.questions) {
        dispatch({ type: 'SET_ROUND2_QUESTIONS', payload: result.data.questions });
      } else {
        // No questions found, automatically generate them
        await generateQuestions();
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const generateQuestions = async () => {
    if (!state.flow || state.isLoading) return; // Prevent duplicate calls

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_id: state.flow.id,
          team_name: state.round1Answers.team_name,
          sport: state.round1Answers.sport,
          logo_style: state.round1Answers.logo_style,
          round1_answers: state.round1Answers
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const result = await response.json();
      dispatch({ type: 'SET_ROUND2_QUESTIONS', payload: result.data.questions });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const generateLogos = async () => {
    if (!state.flow || state.isLoading) return; // Prevent duplicate calls

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'generating' });

      // Find the selected color and mascot objects
      const selectedColor = state.colors.find(c => c.id === state.selectedColors);
      const selectedMascot = state.mascots.find(m => m.id === state.selectedMascot);

      console.log('=== FRONTEND DATA DEBUG ===');
      console.log('🎨 Available colors:', state.colors.length);
      console.log('🦅 Available mascots:', state.mascots.length);
      console.log('✅ Selected color ID:', state.selectedColors);
      console.log('✅ Selected mascot ID:', state.selectedMascot);
      console.log('🎨 Selected color object:', selectedColor);
      console.log('🦅 Selected mascot object:', selectedMascot);

      // Create color description
      const colorDescription = selectedColor 
        ? selectedColor.name  // Use the name like "Blue & White" instead of description
        : state.customColorInput || 'blue and white';

      // Create mascot description
      const mascotDescription = selectedMascot 
        ? selectedMascot.description
        : state.customMascotInput || 'hawk';

      // Determine if custom colors are being used
      const isCustomColor = selectedColor?.id === 'custom_colors' || !selectedColor;
      const customColors = isCustomColor ? (state.customColorInput || '') : '';

      // Determine if custom mascot is being used
      const isCustomMascot = selectedMascot?.id === 'custom_mascot' || !selectedMascot;
      const customMascotDescription = isCustomMascot ? (state.customMascotInput || '') : '';

      console.log('📤 Sending to API:');
      console.log('  - Team Name:', state.round1Answers.team_name);
      console.log('  - Sport:', state.round1Answers.sport);
      console.log('  - Logo Style:', state.round1Answers.logo_style);
      console.log('  - Colors:', colorDescription);
      console.log('  - Custom Colors:', customColors);
      console.log('  - Mascot:', mascotDescription);
      console.log('  - Custom Mascot:', customMascotDescription);

      const response = await fetch('/api/logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_id: state.flow.id,
          team_name: state.round1Answers.team_name,
          sport: state.round1Answers.sport,
          logo_style: state.round1Answers.logo_style,
          colors: colorDescription,
          custom_colors: customColors,
          mascot: mascotDescription,
          mascot_type: 'AUTO_DETERMINED',
          variant_count: 3
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate logos');
      }

      const result = await response.json();
      console.log('Logo generation response:', result); // Debug log
      dispatch({ type: 'SET_LOGO_VARIANTS', payload: result.data.logos });
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'completed' });
    } catch (error) {
      console.error('Logo generation error:', error); // Debug log
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const generateColorsAndMascots = async () => {
    console.log('🎨 generateColorsAndMascots called:', {
      hasFlow: !!state.flow,
      flowId: state.flow?.id,
      teamName: state.round1Answers.team_name,
      sport: state.round1Answers.sport,
      logoStyle: state.round1Answers.logo_style
    });
    
    if (!state.flow) {
      console.log('❌ No flow available, skipping colors/mascots generation');
      return;
    }

    try {
      console.log('🔄 Setting loading state to true');
      dispatch({ type: 'SET_LOADING', payload: true });

      const requestBody = {
        flow_id: state.flow.id,
        team_name: state.round1Answers.team_name,
        sport: state.round1Answers.sport,
        logo_style: state.round1Answers.logo_style,
        round1_answers: {
          team_name: state.round1Answers.team_name,
          sport: state.round1Answers.sport,
          logo_style: state.round1Answers.logo_style
        }
      };
      
      console.log('📤 Sending request to /api/ai/colors-mascots:', requestBody);

      const response = await fetch('/api/ai/colors-mascots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API error response:', errorData);
        throw new Error(`Failed to generate colors and mascots: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 API result:', result);
      
      if (!result.success || !result.data) {
        console.error('❌ Invalid API response structure:', result);
        throw new Error('Invalid response from color/mascot generation API');
      }
      
      console.log('✅ Setting colors and mascots:', {
        colorsCount: result.data.colors?.length || 0,
        mascotsCount: result.data.mascots?.length || 0
      });
      
      dispatch({ type: 'SET_COLORS', payload: result.data.colors });
      dispatch({ type: 'SET_MASCOTS', payload: result.data.mascots });
    } catch (error) {
      console.error('❌ Color/mascot generation error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to generate colors and mascots. Please try again.' });
    } finally {
      console.log('🔄 Setting loading state to false');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const selectLogo = async (logoId: string) => {
    if (!state.flow) return;

    try {
      const response = await fetch('/api/logos/select', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_id: state.flow.id,
          logo_id: logoId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to select logo');
      }

      dispatch({ type: 'SELECT_LOGO', payload: logoId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  const value: QuestionnaireContextType = {
    state,
    dispatch,
    createFlow,
    updateFlow,
    getQuestions,
    generateQuestions,
    generateColorsAndMascots,
    generateLogos,
    selectLogo,
    reset
  };

  return (
    <QuestionnaireContext.Provider value={value}>
      {children}
    </QuestionnaireContext.Provider>
  );
}

export function useQuestionnaire() {
  const context = useContext(QuestionnaireContext);
  if (context === undefined) {
    throw new Error('useQuestionnaire must be used within a QuestionnaireProvider');
  }
  return context;
}
