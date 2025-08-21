"use client";
import { PromptView } from "../../prompt-view";
import { PlayerPromptView } from "../../player-prompt-view";
import { VotingView } from "../../voting-view";
import { PlayerVotingView } from "../../player-voting-view";
import { ScoringView } from "../../scoring-view";
import { PlayerScoringView } from "../../player-scoring-view";
import { BaseGamePhaseManager, BaseGamePhaseManagerProps } from "../shared";
import type { Choice } from "@party/types";

type BluffTriviaPhaseManagerProps = BaseGamePhaseManagerProps & {
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

export class BluffTriviaPhaseManager extends BaseGamePhaseManager {
  readonly gameType = 'bluff-trivia';

  renderPhase(props: BluffTriviaPhaseManagerProps): React.ReactNode {
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
      console.warn(`Invalid phase for bluff-trivia: ${phase}`);
      return null;
    }

    switch (phase) {
      case 'prompt':
        if (isHost) {
          return (
            <PromptView
              question={question || "Loading question..."}
              timeLeft={timeLeft}
              totalTime={totalTime}
              round={round}
              maxRounds={maxRounds}
            />
          );
        } else {
          return (
            <PlayerPromptView
              question={question || "Loading question..."}
              timeLeft={timeLeft}
              totalTime={totalTime}
              round={round}
              maxRounds={maxRounds}
              onSubmitAnswer={onSubmitAnswer || (() => {})}
              hasSubmitted={hasSubmittedAnswer}
            />
          );
        }
      
      case 'choose':
        if (isHost) {
          return (
            <VotingView
              question={question || "Loading question..."}
              choices={choices}
              timeLeft={timeLeft}
              totalTime={totalTime}
              round={round}
              maxRounds={maxRounds}
              votes={votes}
              players={players}
            />
          );
        } else {
          return (
            <PlayerVotingView
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
                  // Handle case where it might be a Set-like object
                  return Object.values(correctPlayers).includes(playerId || "");
                }
                return false;
              })()}
            />
          );
        }
      
      case 'scoring':
        if (isHost) {
          return (
            <ScoringView
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
            />
          );
        } else {
          return (
            <PlayerScoringView
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
            />
          );
        }
      
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
export function BluffTriviaPhaseManagerFC(props: BluffTriviaPhaseManagerProps) {
  const manager = new BluffTriviaPhaseManager();
  return manager.renderPhase(props);
}
