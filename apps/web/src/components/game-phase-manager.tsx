'use client';
import { BluffTriviaPhaseManagerFC } from './games/bluff-trivia';
import { WordAssociationPhaseManagerFC } from './games/word-association';
import { FibbingItPhaseManagerFC } from './games/fibbing-it';
import { LobbyView } from './games/shared/common-phases/lobby-view';
import type { GamePhase, Choice } from '@party/types';

type GamePhaseManagerProps = {
  gameType?: string; // New prop to identify which game to render
  phase: GamePhase;
  isHost: boolean;
  roomCode?: string;
  question?: string;
  correctAnswer?: string;
  timeLeft?: number;
  totalTime?: number;
  round?: number;
  maxRounds?: number;
  choices?: Choice[];
  votes?: Array<{ voter: string; choiceId: string }>;
  players?: Array<{
    id: string;
    name: string;
    avatar?: string;
    score: number;
    connected?: boolean;
  }>;
  scores?: Array<{ playerId: string; score: number }>;
  playerId?: string; // Current player's ID for player-specific views
  current?: Record<string, unknown>; // Current round state including correctAnswerPlayers
  onSubmitAnswer?: (answer: string) => void;
  onSubmitVote?: (choiceId: string) => void;
  onStartGame?: () => void;
  hasSubmittedAnswer?: boolean;
  hasVoted?: boolean;
  selectedChoiceId?: string;
  // Lobby props
  selectedGame?: {
    id: string;
    title: string;
    description: string;
    icon: string;
    players: string;
    duration: string;
    difficulty: string;
    theme?: {
      primary: string;
      accent: string;
      background: string;
      icon: string;
      name: string;
    };
  };
  onGameSelect?: (gameId: string) => void;
  availableGames?: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    players: string;
    duration: string;
    difficulty: string;
    theme?: {
      primary: string;
      accent: string;
      background: string;
      icon: string;
      name: string;
    };
  }>;
  showAllGames?: boolean;
};

export function GamePhaseManager(props: GamePhaseManagerProps) {
  const { gameType = 'bluff-trivia', phase, ...gameProps } = props;

  // For lobby phase, show the shared lobby view regardless of game type
  if (phase === 'lobby') {
    if (!gameProps.roomCode) {
      console.error('roomCode is required for lobby phase');
      return <div>Error: Room code required</div>;
    }
    return (
      <LobbyView
        {...gameProps}
        roomCode={gameProps.roomCode}
        players={gameProps.players || []}
        isHost={gameProps.isHost}
        onStartGame={gameProps.onStartGame}
        selectedGame={gameProps.selectedGame}
      />
    );
  }

  // Route to the appropriate game-specific phase manager for other phases
  switch (gameType) {
    case 'bluff-trivia':
      return <BluffTriviaPhaseManagerFC phase={phase} {...gameProps} />;

    case 'word-association':
      return <WordAssociationPhaseManagerFC phase={phase} {...gameProps} />;

    case 'fibbing-it':
      return <FibbingItPhaseManagerFC phase={phase} {...gameProps} />;

    // Add new games here:
    // case 'new-game':
    //   return <NewGamePhaseManager phase={phase} {...gameProps} />;

    default:
      console.warn(
        `Unknown game type: ${gameType}, falling back to bluff-trivia`
      );
      return <BluffTriviaPhaseManagerFC phase={phase} {...gameProps} />;
  }
}
