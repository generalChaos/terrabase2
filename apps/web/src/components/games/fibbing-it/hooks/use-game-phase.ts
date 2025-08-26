import { useState, useEffect } from 'react';
import type { ComponentState } from '../shared/types';

type UseGamePhaseProps = {
  state: ComponentState;
  options?: Array<{
    id: string;
    text: string;
    color: string;
    playerId?: string;
    playerAvatar?: string;
  }>;
  correctAnswer?: string;
  votes?: Array<{ voter: string; choiceId: string }>;
  players?: Array<{ id: string; name: string; avatar?: string; score: number }>;
  onSubmitAnswer?: (answer: string) => void;
  onSubmitVote?: (choiceId: string) => void;
  hasSubmitted?: boolean;
  selectedChoiceId?: string;
  onPlayAgain?: () => void;
};

export function useGamePhase({
  state,
  options = [],
  correctAnswer,
  votes = [],
  players = [],
  onSubmitAnswer,
  onSubmitVote,
  hasSubmitted = false,
  selectedChoiceId,
  onPlayAgain,
}: UseGamePhaseProps) {
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (state === 'options' || state === 'reveal') {
      // Delay showing options for smooth animation
      const timer = setTimeout(() => setShowOptions(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowOptions(false);
    }
  }, [state]);

  return {
    showOptions,
    phaseProps: {
      options,
      correctAnswer,
      votes,
      players,
      onSubmitAnswer,
      onSubmitVote,
      hasSubmitted,
      selectedChoiceId,
      showOptions,
      onPlayAgain,
    },
  };
}
