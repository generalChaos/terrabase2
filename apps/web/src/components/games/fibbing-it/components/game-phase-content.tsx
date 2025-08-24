'use client';
import { PromptInput } from './prompt-input';
import { VotingOptions } from './voting-options';
import { RevealResults } from './reveal-results';

type Option = {
  id: string;
  text: string;
  color: string;
  playerId?: string;
  playerAvatar?: string;
};

type GamePhaseContentProps = {
  state: 'waiting' | 'input' | 'options' | 'reveal';
  options?: Option[];
  correctAnswer?: string;
  onSubmitAnswer?: (answer: string) => void;
  onSubmitVote?: (choiceId: string) => void;
  hasSubmitted?: boolean;
  selectedChoiceId?: string;
  showOptions: boolean;
};

export function GamePhaseContent({
  state,
  options = [],
  correctAnswer,
  onSubmitAnswer,
  onSubmitVote,
  hasSubmitted = false,
  selectedChoiceId,
  showOptions,
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
          selectedChoiceId={selectedChoiceId}
          showOptions={showOptions}
        />
      );

    default:
      return null;
  }
}
