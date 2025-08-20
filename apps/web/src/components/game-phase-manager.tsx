"use client";
import { PromptView } from "./prompt-view";
import { PlayerPromptView } from "./player-prompt-view";
import { VotingView } from "./voting-view";
import { PlayerVotingView } from "./player-voting-view";
import { ScoringView } from "./scoring-view";
import { PlayerScoringView } from "./player-scoring-view";
import type { Phase, Choice } from "@party/types";

type GamePhaseManagerProps = {
  phase: Phase;
  isHost: boolean;
  question?: string;
  correctAnswer?: string;
  timeLeft?: number;
  totalTime?: number;
  round?: number;
  maxRounds?: number;
  choices?: Choice[];
  votes?: Array<{ voter: string; choiceId: string }>;
  players?: Array<{ id: string; name: string; avatar?: string; score: number; connected?: boolean }>;
  scores?: Array<{ playerId: string; score: number }>;
  playerId?: string; // Current player's ID for player-specific views
  onSubmitAnswer?: (answer: string) => void;
  onSubmitVote?: (choiceId: string) => void;
  hasSubmittedAnswer?: boolean;
  hasVoted?: boolean;
  selectedChoiceId?: string;
};

export function GamePhaseManager({
  phase,
  isHost,
  question,
  correctAnswer,
  timeLeft = 0,
  totalTime = 30,
  round = 1,
  maxRounds = 5,
  choices = [],
  votes = [],
  players = [],
  scores = [],
  playerId,
  onSubmitAnswer,
  onSubmitVote,
  hasSubmittedAnswer = false,
  hasVoted = false,
  selectedChoiceId,
}: GamePhaseManagerProps) {
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
