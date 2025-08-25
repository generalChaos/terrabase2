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
  onPlayAgain?: () => void;
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
      votes = [],
      players = [],
      onSubmitAnswer,
      onSubmitVote,
      hasSubmittedAnswer = false,
      selectedChoiceId,
      onStartGame,
      onPlayAgain,
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
            selectedGame={getGameInfo('fibbing-it') || undefined}
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
            votes={votes}
            players={players}
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
            state="scoring"
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
            votes={votes}
            players={players}
            onSubmitVote={onSubmitVote}
            selectedChoiceId={selectedChoiceId}
          />
        );

      case 'over':
        return (
          <SharedPromptView
            question="Game Over!"
            timeLeft={timeLeft}
            totalTime={totalTime}
            round={round}
            maxRounds={maxRounds}
            state="over"
            onPlayAgain={onPlayAgain}
          />
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
