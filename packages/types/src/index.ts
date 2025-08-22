// Core game types
export type Phase = 'lobby' | 'prompt' | 'choose' | 'scoring' | 'over';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  connected: boolean;
}

// Game state interfaces
export interface BaseGameState {
  phase: string;
  players: Player[];
  timeLeft: number;
}

export interface GamePhase {
  name: string;
  duration: number;
  allowedActions: string[];
  onEnter?: (state: any) => void;
  onExit?: (state: any) => void;
}

// Game action and event interfaces
export interface GameAction {
  type: string;
  playerId: string;
  [key: string]: any;
}

export interface GameEvent {
  type: string;
  data: any;
  target?: 'all' | 'player' | 'host';
  playerId?: string;
}

export interface GameResult<TState, TEvent> {
  newState: TState;
  events: TEvent[];
  isValid: boolean;
  error?: string;
}

// Game engine interface
export interface GameEngine<
  TState extends BaseGameState,
  TAction extends GameAction,
  TEvent extends GameEvent,
> {
  initialize(players: Player[]): TState;
  processAction(state: TState, action: TAction): GameResult<TState, TEvent>;
  getValidActions(state: TState, playerId: string): TAction[];
  isGameOver(state: TState): boolean;
  getWinners(state: TState): Player[];
  getCurrentPhase(state: TState): GamePhase;
  advancePhase(state: TState): TState;
  getTimeLeft(state: TState): number;
  updateTimer(state: TState, delta: number): TState;
  generatePhaseEvents(state: TState): TEvent[];
}

// Game-specific types
export interface Bluff {
  id: string;
  by: string;
  text: string;
  isCorrect?: boolean;
}

export interface Vote {
  voter: string;
  choiceId: string;
}

export interface Choice {
  id: string;
  by: string;
  text: string;
}

export interface RoundState extends Record<string, unknown> {
  roundNumber: number;
  promptId: string;
  prompt: string;
  answer: string;
  bluffs: Bluff[];
  votes: Vote[];
  correctAnswerPlayers?: string[]; // Array of player IDs who got the answer correct
  timeLeft: number;
  phase: string;
}

export interface RoomState {
  code: string;
  gameType: string;
  phase: Phase;
  round: number;
  maxRounds: number;
  timeLeft: number;
  players: Player[];
  current?: RoundState;
  hostId?: string;
  usedPromptIds: Set<string>;
  timer?: NodeJS.Timeout;
}

// Game configuration - Single source of truth
export const GameConfig = {
  // Game timing configuration
  TIMING: {
    // Phase durations in seconds
    PHASES: {
      PROMPT: 15, // Time to submit answer/bluff
      CHOOSE: 20, // Time to vote
      SCORING: 6, // Time to show results
    },

    // Timer configuration
    TIMER: {
      TICK_MS: 1000, // Timer tick interval in milliseconds
      CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // Room cleanup interval (5 minutes)
    },

    // Time conversion constants
    CONVERSIONS: {
      SECONDS_TO_MS: 1000, // Convert seconds to milliseconds
      MINUTES_TO_SECONDS: 60, // Convert minutes to seconds
      MINUTES_TO_MS: 60 * 1000, // Convert minutes to milliseconds
    },
  },

  // Game rules and limits
  RULES: {
    // Round configuration
    ROUNDS: {
      MAX_ROUNDS: 5, // Maximum number of rounds per game
      MIN_PLAYERS_TO_START: 2, // Minimum players required to start
    },

    // Scoring configuration
    SCORING: {
      CORRECT_ANSWER: 1000, // Points for correct answer
      BLUFF_POINTS: 500, // Points per player fooled by bluff
    },

    // Player configuration
    PLAYERS: {
      MAX_PLAYERS_PER_ROOM: 8, // Maximum players in a room
      MIN_NICKNAME_LENGTH: 2, // Minimum nickname length
      MAX_NICKNAME_LENGTH: 20, // Maximum nickname length
    },
  },

  // Input validation limits
  VALIDATION: {
    MAX_INPUT_LENGTH: 1000, // Maximum length for any text input
    ROOM_CODE_PATTERN: /^[a-zA-Z0-9]{4,8}$/, // Room code format
    ROOM_CODE_MIN_LENGTH: 4, // Minimum room code length
    ROOM_CODE_MAX_LENGTH: 8, // Maximum room code length
  },

  // HTTP status codes
  HTTP_STATUS: {
    BAD_REQUEST: 400, // Client error
    UNAUTHORIZED: 401, // Authentication required
    FORBIDDEN: 403, // Access denied
    NOT_FOUND: 404, // Resource not found
    CONFLICT: 409, // Resource conflict
    INTERNAL_SERVER_ERROR: 500, // Server error
  },

  // Game types
  GAME_TYPES: {
    BLUFF_TRIVIA: 'bluff-trivia',
    FIBBING_IT: 'fibbing-it',
    WORD_ASSOCIATION: 'word-association',
  },

  // Room configuration
  ROOM: {
    CLEANUP: {
      INACTIVE_MINUTES: 30, // Minutes before room is considered inactive
      EMPTY_ROOM_DELAY_MS: 0, // Delay before cleaning up empty rooms (0 = immediate)
    },
  },
} as const;

// Type-safe access to configuration
export type GameConfigType = typeof GameConfig;

// Helper functions for common calculations
export const GameConfigHelpers = {
  /**
   * Convert seconds to milliseconds
   */
  secondsToMs: (seconds: number): number =>
    seconds * GameConfig.TIMING.CONVERSIONS.SECONDS_TO_MS,

  /**
   * Convert minutes to milliseconds
   */
  minutesToMs: (minutes: number): number =>
    minutes * GameConfig.TIMING.CONVERSIONS.MINUTES_TO_MS,

  /**
   * Convert minutes to seconds
   */
  minutesToSeconds: (minutes: number): number =>
    minutes * GameConfig.TIMING.CONVERSIONS.MINUTES_TO_SECONDS,

  /**
   * Check if a room code is valid
   */
  isValidRoomCode: (code: string): boolean =>
    GameConfig.VALIDATION.ROOM_CODE_PATTERN.test(code),

  /**
   * Check if a nickname is valid
   */
  isValidNickname: (nickname: string): boolean => {
    const { MIN_NICKNAME_LENGTH, MAX_NICKNAME_LENGTH } =
      GameConfig.RULES.PLAYERS;
    return (
      nickname.length >= MIN_NICKNAME_LENGTH &&
      nickname.length <= MAX_NICKNAME_LENGTH
    );
  },
};

// Legacy constants for backward compatibility (deprecated - use GameConfig instead)
export const DUR = {
  PROMPT: GameConfig.TIMING.PHASES.PROMPT,
  CHOOSE: GameConfig.TIMING.PHASES.CHOOSE,
  SCORING: GameConfig.TIMING.PHASES.SCORING,
} as const;

// Socket event types
export interface JoinRoomData {
  nickname: string;
  avatar?: string;
}

export interface SubmitAnswerData {
  answer: string;
}

export interface SubmitVoteData {
  choiceId: string;
}

export interface ScoreData {
  totals: Array<{
    playerId: string;
    score: number;
  }>;
}

// Game action types (union type for type safety)
export type GameActionType =
  | { type: 'startGame' }
  | { type: 'submitAnswer'; data: SubmitAnswerData }
  | { type: 'submitVote'; data: SubmitVoteData }
  | { type: 'join'; data: JoinRoomData };

// Game theming
export interface GameTheme {
  primary: string; // Main background color (e.g., 'bg-purple-600')
  accent: string; // Accent/button colors (e.g., 'bg-purple-400')
  background: string; // Background pattern/style (e.g., 'bg-purple-800')
  icon: string; // Game icon (e.g., '🎭')
  name: string; // Game display name (e.g., 'Fibbing It!')
}

// Socket event names
export type SocketEvent =
  | 'join'
  | 'startGame'
  | 'submitAnswer'
  | 'submitVote'
  | 'vote'
  | 'room'
  | 'timer'
  | 'prompt'
  | 'choices'
  | 'scores'
  | 'gameOver'
  | 'submitted'
  | 'error'
  | 'joined'
  | 'connect_error';

// API response types - Standardized format
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Game configuration types (deprecated - use GameConfig instead)
export interface GameConfigLegacy {
  maxRounds: number;
  promptTimeLimit: number;
  votingTimeLimit: number;
  scoringTimeLimit: number;
}

// Error types
export interface GameError {
  code: string;
  message: string;
  details?: any;
}

// Result pattern for consistent error handling
export type Result<T, E = GameError> = Success<T> | Failure<E>;

export class Success<T> {
  readonly _tag = 'Success';
  constructor(readonly value: T) {}

  isSuccess(): this is Success<T> {
    return true;
  }
  isFailure(): this is Failure<any> {
    return false;
  }

  map<U>(fn: (value: T) => U): Result<U, any> {
    return new Success(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Result<U, any>): Result<U, any> {
    return fn(this.value);
  }

  getOrElse<U>(defaultValue: U): T | U {
    return this.value;
  }

  getOrThrow(): T {
    return this.value;
  }
}

export class Failure<E> {
  readonly _tag = 'Failure';
  constructor(readonly error: E) {}

  isSuccess(): this is Success<any> {
    return false;
  }
  isFailure(): this is Failure<E> {
    return true;
  }

  map<U>(fn: (value: any) => U): Result<U, E> {
    return new Failure(this.error);
  }

  flatMap<U>(fn: (value: any) => Result<U, any>): Result<U, E> {
    return new Failure(this.error);
  }

  getOrElse<U>(defaultValue: U): U {
    return defaultValue;
  }

  getOrThrow(): never {
    if (this.error instanceof Error) {
      throw this.error;
    }
    throw new Error(
      typeof this.error === 'string' ? this.error : 'Unknown error'
    );
  }
}

// Helper functions for creating Results
export const success = <T>(value: T): Result<T, never> => new Success(value);
export const failure = <E>(error: E): Result<never, E> => new Failure(error);

// Async Result wrapper
export type AsyncResult<T, E = GameError> = Promise<Result<T, E>>;

// Error categories for consistent classification
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  AUTHENTICATION = 'AUTHENTICATION',
  NETWORK = 'NETWORK',
}

// Standardized error interface
export interface StandardError {
  code: string;
  message: string;
  category: ErrorCategory;
  statusCode: number;
  details?: any;
  timestamp: string;
  requestId?: string;
  context?: string;
}

// Error response for client communication
export interface ErrorResponse {
  success: false;
  error: StandardError;
}

// Success response for client communication
export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

// Command types
export interface GameCommand {
  type: string;
  data?: any;
  playerId?: string;
}

export interface GameCommandResult {
  success: boolean;
  events?: GameEvent[];
  error?: string;
  details?: any;
}
