'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TeamDesignFlow, Question, LogoVariant, FlowStep } from '@/types';

interface QuestionnaireState {
  flow: TeamDesignFlow | null;
  currentStep: FlowStep;
  isLoading: boolean;
  error: string | null;
  round1Answers: {
    team_name: string;
    sport: string;
    age_group: string;
  };
  round2Questions: Question[];
  round2Answers: Question[];
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
  | { type: 'UPDATE_ROUND2_ANSWER'; payload: { questionId: string; selected: number } }
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
    age_group: ''
  },
  round2Questions: [],
  round2Answers: [],
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
        round1Answers: (action.payload.round1_answers as { team_name: string; sport: string; age_group: string }) || state.round1Answers,
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
        round2Answers: action.payload.map(q => ({ ...q, selected: q.selected || 0 }))
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
  createFlow: (data: { team_name: string; sport: string; age_group: string; debug_mode?: boolean }) => Promise<void>;
  updateFlow: (updates: Partial<TeamDesignFlow>) => Promise<void>;
  getQuestions: (sport: string, ageGroup: string) => Promise<void>;
  generateQuestions: () => Promise<void>;
  generateLogos: () => Promise<void>;
  selectLogo: (logoId: string) => Promise<void>;
  reset: () => void;
}

const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined);

export function QuestionnaireProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(questionnaireReducer, initialState);

  const createFlow = async (data: { team_name: string; sport: string; age_group: string; debug_mode?: boolean }) => {
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
        // No questions found, set empty array to show "Generate Questions" button
        dispatch({ type: 'SET_ROUND2_QUESTIONS', payload: [] });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const generateQuestions = async () => {
    if (!state.flow) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_id: state.flow.id,
          team_name: state.round1Answers.team_name,
          sport: state.round1Answers.sport,
          age_group: state.round1Answers.age_group,
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
    }
  };

  const generateLogos = async () => {
    if (!state.flow) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'generating' });

      const response = await fetch('/api/logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_id: state.flow.id,
          team_name: state.round1Answers.team_name,
          sport: state.round1Answers.sport,
          age_group: state.round1Answers.age_group,
          round1_answers: state.round1Answers,
          round2_answers: state.round2Answers,
          variant_count: 3
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate logos');
      }

      const result = await response.json();
      dispatch({ type: 'SET_LOGO_VARIANTS', payload: result.data.logos });
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'completed' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'failed' });
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
