import type { Phase, Choice } from "@party/types";

/**
 * Base interface that all game-specific phase managers must implement.
 * This ensures consistency across different games and makes it easier
 * to add new games to the system.
 */
export interface GamePhaseManagerInterface {
  /**
   * The game type this manager handles
   */
  readonly gameType: string;
  
  /**
   * Render the appropriate UI for the current game phase
   */
  renderPhase(props: BaseGamePhaseManagerProps): React.ReactNode;
}

/**
 * Base props that all game phase managers receive
 */
export interface BaseGamePhaseManagerProps {
  phase: Phase;
  isHost: boolean;
  timeLeft?: number;
  totalTime?: number;
  round?: number;
  maxRounds?: number;
  players?: Array<{ id: string; name: string; avatar?: string; score: number; connected?: boolean }>;
  playerId?: string;
  [key: string]: any; // Allow game-specific props
}

/**
 * Base class that provides common functionality for game phase managers
 */
export abstract class BaseGamePhaseManager implements GamePhaseManagerInterface {
  abstract readonly gameType: string;
  
  /**
   * Abstract method that each game must implement
   */
  abstract renderPhase(props: BaseGamePhaseManagerProps): React.ReactNode;
  
  /**
   * Common utility method to check if a phase is valid for this game
   */
  protected isValidPhase(phase: Phase): boolean {
    return ['lobby', 'prompt', 'choose', 'scoring', 'over'].includes(phase);
  }
  
  /**
   * Common utility method to get default time for a phase
   */
  protected getDefaultTimeForPhase(phase: Phase): number {
    switch (phase) {
      case 'prompt': return 15;
      case 'choose': return 20;
      case 'scoring': return 6;
      default: return 0;
    }
  }
}
