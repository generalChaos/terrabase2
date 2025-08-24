'use client';
import { useState, useEffect } from 'react';
import { 
  GameLayout, 
  TimerDisplay, 
  QuestionDisplay, 
  RoundInfo, 
  GamePhaseContent 
} from './index';

type SharedPromptViewProps = {
  question: string;
  timeLeft: number;
  totalTime: number;
  round: number;
  maxRounds: number;
  state: 'waiting' | 'input' | 'options' | 'reveal';
  options?: Array<{
    id: string;
    text: string;
    color: string;
    playerId?: string;
    playerAvatar?: string;
  }>;
  correctAnswer?: string;
  onSubmitAnswer?: (answer: string) => void;
  onSubmitVote?: (choiceId: string) => void;
  hasSubmitted?: boolean;
  selectedChoiceId?: string;
};

export function SharedPromptView({
  question,
  timeLeft,
  totalTime,
  round,
  maxRounds,

  state,
  options = [],
  correctAnswer,
  onSubmitAnswer,
  onSubmitVote,
  hasSubmitted = false,
  selectedChoiceId,
}: SharedPromptViewProps) {
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

  return (
    <GameLayout>
      <TimerDisplay timeLeft={timeLeft} totalTime={totalTime} />
      <QuestionDisplay question={question} />
      <GamePhaseContent
        state={state}
        options={options}
        correctAnswer={correctAnswer}
        onSubmitAnswer={onSubmitAnswer}
        onSubmitVote={onSubmitVote}
        hasSubmitted={hasSubmitted}
        selectedChoiceId={selectedChoiceId}
        showOptions={showOptions}
      />
      <RoundInfo round={round} maxRounds={maxRounds} />
    </GameLayout>
  );
}
