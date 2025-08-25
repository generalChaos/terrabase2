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
  state: 'waiting' | 'input' | 'options' | 'reveal' | 'scoring' | 'over';
  options?: Option[];
  correctAnswer?: string;
  votes?: Array<{ voter: string; choiceId: string }>;
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

    case 'over':
      return (
        <RevealResults
          options={options}
          correctAnswer={correctAnswer}
          votes={votes}
          players={players}
          selectedChoiceId={selectedChoiceId}
          showOptions={showOptions}
          state="over"
          onPlayAgain={onPlayAgain}
        />
      );

    default:
      return null;
  }
}
