'use client';
import { PromptInput } from './prompt-input';
import { VotingOptions } from './voting-options';
import { RevealResults } from './reveal-results';
import type { ComponentState } from '../../../../shared/types';

type Option = {
  id: string;
  text: string;
  color: string;
  playerId?: string;
  playerAvatar?: string;
};

type GamePhaseContentProps = {
  state: ComponentState;
  options?: Option[];
  correctAnswer?: string;
  votes?: Array<{ voter: string; vote: string }>;
  players?: Array<{ id: string; name: string; avatar?: string; score: number }>;
  onSubmitAnswer?: (answer: string) => void;
  onSubmitVote?: (choiceId: string) => void;
  hasSubmitted?: boolean;
  selectedChoiceId?: string;
  showOptions: boolean;
  onPlayAgain?: () => void;
};

export function GamePhaseContent({
  state,
  options = [],
  correctAnswer,
  votes = [],
  players = [],
  onSubmitAnswer,
  onSubmitVote,
  hasSubmitted = false,
  selectedChoiceId,
  showOptions,
  onPlayAgain,
}: GamePhaseContentProps) {
  switch (state) {
    case 'waiting':
      return (
        <div className="text-xl text-slate-300 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
          Players are submitting answers...
        </div>
      );

    case 'input':
      return (
        <PromptInput
          onSubmitAnswer={onSubmitAnswer!}
          hasSubmitted={hasSubmitted}
        />
      );

    case 'options':
      return (
        <VotingOptions
          options={options}
          onSubmitVote={onSubmitVote!}
          selectedChoiceId={selectedChoiceId}
          showOptions={showOptions}
        />
      );

    case 'reveal':
      return (
        <RevealResults
          options={options}
          correctAnswer={correctAnswer}
          votes={votes}
          players={players}
          selectedChoiceId={selectedChoiceId}
          showOptions={showOptions}
          state="reveal"
        />
      );

    case 'scoring':
      return (
        <RevealResults
          options={options}
          correctAnswer={correctAnswer}
          votes={votes}
          players={players}
          selectedChoiceId={selectedChoiceId}
          showOptions={showOptions}
          state="scoring"
        />
      );

    case 'game-over':
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h1 className="text-3xl font-bold mb-8">Game Over!</h1>
        </div>
      );

    default:
      return null;
  }
}
