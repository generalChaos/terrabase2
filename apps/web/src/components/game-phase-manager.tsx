"use client";
import { BluffTriviaPhaseManagerFC } from "./games/bluff-trivia-phase-manager";
import { WordAssociationPhaseManagerFC } from "./games/word-association-phase-manager";
import { FibbingItPhaseManagerFC } from "./games/fibbing-it-phase-manager";
import type { Phase, Choice } from "@party/types";

type GamePhaseManagerProps = {
  gameType?: string; // New prop to identify which game to render
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
  current?: Record<string, unknown>; // Current round state including correctAnswerPlayers
  onSubmitAnswer?: (answer: string) => void;
  onSubmitVote?: (choiceId: string) => void;
  hasSubmittedAnswer?: boolean;
  hasVoted?: boolean;
  selectedChoiceId?: string;
};

export function GamePhaseManager(props: GamePhaseManagerProps) {
  const { gameType = 'bluff-trivia', ...gameProps } = props;

  // Route to the appropriate game-specific phase manager
  switch (gameType) {
    case 'bluff-trivia':
      return <BluffTriviaPhaseManagerFC {...gameProps} />;
    
    case 'word-association':
      return <WordAssociationPhaseManagerFC {...gameProps} />;
    
    case 'fibbing-it':
      return <FibbingItPhaseManagerFC {...gameProps} />;
    
    // Add new games here:
    // case 'new-game':
    //   return <NewGamePhaseManager {...gameProps} />;
    
    default:
      console.warn(`Unknown game type: ${gameType}, falling back to bluff-trivia`);
      return <BluffTriviaPhaseManagerFC {...gameProps} />;
  }
}
