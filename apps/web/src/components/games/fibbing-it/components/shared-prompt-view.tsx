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
  state: 'waiting' | 'input' | 'options' | 'reveal' | 'scoring' | 'over';
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

export function SharedPromptView({
  question,
  timeLeft,
  totalTime,
  round,
  maxRounds,
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
        votes={votes}
        players={players}
        onSubmitAnswer={onSubmitAnswer}
        onSubmitVote={onSubmitVote}
        hasSubmitted={hasSubmitted}
        selectedChoiceId={selectedChoiceId}
        showOptions={showOptions}
        onPlayAgain={onPlayAgain}
      />
      <RoundInfo round={round} maxRounds={maxRounds} />
    </GameLayout>
  );
}
