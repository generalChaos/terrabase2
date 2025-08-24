'use client';
import { SharedPromptView } from './components';
import { LobbyView } from '../shared';
import { BaseGamePhaseManager, BaseGamePhaseManagerProps } from '../shared';
import type { Choice } from '@party/types';
import { getGameInfo } from '@party/config';

type FibbingItPhaseManagerProps = BaseGamePhaseManagerProps & {
  question?: string;
  correctAnswer?: string;
  choices?: Choice[];
  votes?: Array<{ voter: string; choiceId: string }>;
  scores?: Array<{ playerId: string; score: number }>;
  current?: Record<string, unknown>; // Current round state including correctAnswerPlayers
  onSubmitAnswer?: (answer: string) => void;
  onSubmitVote?: (choiceId: string) => void;
  hasSubmittedAnswer?: boolean;
  selectedChoiceId?: string;
};

export class FibbingItPhaseManager extends BaseGamePhaseManager {
  readonly gameType = 'fibbing-it';

  renderPhase(props: FibbingItPhaseManagerProps): React.ReactNode {
      const {
    phase,
    isHost,
    question,
    correctAnswer,
    timeLeft = 0,
    totalTime = this.getDefaultTimeForPhase(phase),
    round = 1,
    maxRounds = 5,
    choices = [],
    players = [],
    onSubmitAnswer,
    onSubmitVote,
    hasSubmittedAnswer = false,
    selectedChoiceId,
    onStartGame,
  } = props;

    if (!this.isValidPhase(phase)) {
      console.warn(`Invalid phase for fibbing-it: ${phase}`);
      return null;
    }

    switch (phase) {
      case 'lobby':
        return (
          <LobbyView
            roomCode="TEST123"
            players={players}
            isHost={isHost}
            onStartGame={onStartGame}
            selectedGame={getGameInfo('fibbing-it')}
          />
        );

      case 'prompt':
        return (
          <SharedPromptView
            question={question || 'Loading question...'}
            timeLeft={timeLeft}
            totalTime={totalTime}
            round={round}
            maxRounds={maxRounds}
            state={isHost ? 'waiting' : 'input'}
            onSubmitAnswer={onSubmitAnswer}
            hasSubmitted={hasSubmittedAnswer}
          />
        );

      case 'choose':
        return (
          <SharedPromptView
            question={question || 'Loading question...'}
            timeLeft={timeLeft}
            totalTime={totalTime}
            round={round}
            maxRounds={maxRounds}
            state="options"
            options={choices.map((choice, index) => ({
              id: choice.id,
              text: choice.text,
              color: [
                'from-orange-500 to-orange-600',     // Orange
                'from-pink-500 to-pink-600',         // Magenta/Deep Pink
                'from-teal-500 to-teal-600',         // Teal/Blue-Green
                'from-green-600 to-green-700',       // Dark Green
              ][index % 4],
              playerId: choice.by,
              playerAvatar: `avatar_${(index + 1) % 9 + 1}`
            }))}
            onSubmitVote={onSubmitVote}
            selectedChoiceId={selectedChoiceId}
          />
        );



      case 'scoring':
        return (
          <SharedPromptView
            question={question || 'Loading question...'}
            timeLeft={timeLeft}
            totalTime={totalTime}
            round={round}
            maxRounds={maxRounds}
            state="reveal"
            options={choices.map((choice, index) => ({
              id: choice.id,
              text: choice.text,
              color: [
                'from-orange-500 to-orange-600',     // Orange
                'from-pink-500 to-pink-600',         // Magenta/Deep Pink
                'from-teal-500 to-teal-600',         // Teal/Blue-Green
                'from-green-600 to-green-700',       // Dark Green
              ][index % 4],
              playerId: choice.by,
              playerAvatar: `avatar_${(index + 1) % 9 + 1}`
            }))}
            correctAnswer={correctAnswer}
            onSubmitVote={onSubmitVote}
            selectedChoiceId={selectedChoiceId}
          />
        );

      case 'over':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h1 className="text-3xl font-bold mb-8">Game Over!</h1>
            <div className="text-[--muted]">Final scores coming soon...</div>
          </div>
        );

      default:
        return null;
    }
  }
}

// Export a function component for easier use
export function FibbingItPhaseManagerFC(props: FibbingItPhaseManagerProps) {
  const manager = new FibbingItPhaseManager();
  return manager.renderPhase(props);
}
