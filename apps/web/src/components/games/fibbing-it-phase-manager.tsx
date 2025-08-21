"use client";
import { FibbingItPromptView } from "./fibbing-it-prompt-view";
import { FibbingItVotingView } from "./fibbing-it-voting-view";
import { FibbingItScoringView } from "./fibbing-it-scoring-view";
import { FibbingItLobbyView } from "./fibbing-it-lobby-view";
import { FibbingItResultsView } from "./fibbing-it-results-view";
import { BaseGamePhaseManager, BaseGamePhaseManagerProps } from "./game-phase-manager.interface";
import type { Choice } from "@party/types";

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
  hasVoted?: boolean;
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
      votes = [],
      players = [],
      scores = [],
      playerId,
      current,
      onSubmitAnswer,
      onSubmitVote,
      hasSubmittedAnswer = false,
      hasVoted = false,
      selectedChoiceId,
    } = props;

    if (!this.isValidPhase(phase)) {
      console.warn(`Invalid phase for fibbing-it: ${phase}`);
      return null;
    }

    switch (phase) {
      case 'lobby':
        return (
          <FibbingItLobbyView
            players={players}
            timeLeft={timeLeft}
            totalTime={totalTime}
            round={round}
            maxRounds={maxRounds}
            isHost={isHost}
          />
        );

      case 'prompt':
        if (isHost) {
          return (
            <FibbingItPromptView
              question={question || "Loading question..."}
              timeLeft={timeLeft}
              totalTime={totalTime}
              round={round}
              maxRounds={maxRounds}
            />
          );
        } else {
          return (
            <FibbingItPromptView
              question={question || "Loading question..."}
              timeLeft={timeLeft}
              totalTime={totalTime}
              round={round}
              maxRounds={maxRounds}
              onSubmitAnswer={onSubmitAnswer || (() => {})}
              hasSubmitted={hasSubmittedAnswer}
              isPlayer={true}
            />
          );
        }
      
      case 'choose':
        if (isHost) {
          return (
            <FibbingItVotingView
              question={question || "Loading question..."}
              choices={choices}
              timeLeft={timeLeft}
              totalTime={totalTime}
              round={round}
              maxRounds={maxRounds}
              votes={votes}
              players={players}
              isHost={true}
            />
          );
        } else {
          return (
            <FibbingItVotingView
              question={question || "Loading question..."}
              choices={choices}
              timeLeft={timeLeft}
              totalTime={totalTime}
              round={round}
              maxRounds={maxRounds}
              onSubmitVote={onSubmitVote || (() => {})}
              hasVoted={hasVoted}
              selectedChoiceId={selectedChoiceId}
              gotAnswerCorrect={(() => {
                const correctPlayers = current?.correctAnswerPlayers;
                if (Array.isArray(correctPlayers)) {
                  return correctPlayers.includes(playerId || "");
                } else if (correctPlayers && typeof correctPlayers === 'object') {
                  return Object.values(correctPlayers).includes(playerId || "");
                }
                return false;
              })()}
              isPlayer={true}
            />
          );
        }
      
      case 'scoring':
        if (isHost) {
          return (
            <FibbingItScoringView
              question={question || "Loading question..."}
              correctAnswer={correctAnswer || "Loading answer..."}
              choices={choices}
              timeLeft={timeLeft}
              totalTime={totalTime}
              round={round}
              maxRounds={maxRounds}
              votes={votes}
              players={players.map(p => ({ ...p, connected: p.connected ?? true }))}
              scores={scores}
              isHost={true}
            />
          );
        } else {
          return (
            <FibbingItScoringView
              question={question || "Loading question..."}
              correctAnswer={correctAnswer || "Loading answer..."}
              choices={choices}
              timeLeft={timeLeft}
              totalTime={totalTime}
              round={round}
              maxRounds={maxRounds}
              votes={votes}
              scores={scores}
              playerId={playerId || ""}
              isPlayer={true}
            />
          );
        }
      
      case 'over':
        return (
          <FibbingItResultsView
            scores={scores}
            players={players}
            round={round}
            maxRounds={maxRounds}
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
