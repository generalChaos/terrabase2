// Core game types - Using const assertions for type safety and values
export const GAME_PHASES = {
  LOBBY: 'lobby',
  PROMPT: 'prompt',
  CHOOSE: 'choose',
  REVEAL: 'reveal',
  SCORING: 'scoring',
  ROUND_END: 'round-end',
  GAME_OVER: 'game-over'
} as const;

export type GamePhase = typeof GAME_PHASES[keyof typeof GAME_PHASES];

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  connected: boolean;
}

// Standardized game configuration
export interface GameConfig {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  phases: GamePhaseConfig[];
  defaultSettings: Record<string, any>;
  uiComponents: string[];
}

// Enhanced game phase interface
export interface GamePhaseConfig {
  name: GamePhase;
  duration: number;
  allowedActions: string[];
  autoAdvance: boolean; // Should phase auto-advance when timer expires?
  requiresAllPlayers: boolean; // Do all players need to complete action?
  canSkip: boolean; // Can host skip this phase?
  onEnter?: (state: any) => void;
  onExit?: (state: any) => void;
}

// Game state interfaces
export interface BaseGameState {
  phase: GamePhase;
  players: Player[];
  timeLeft: number;
  round: number;
  maxRounds: number;
  scores: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
  isRoundComplete: boolean;
  phaseStartTime: Date;
}

// Standardized action types that all games should support
export const STANDARD_ACTIONS = {
  START_GAME: 'start',
  SUBMIT_ANSWER: 'submitAnswer',
  SUBMIT_VOTE: 'submitVote',
  SKIP_PHASE: 'skipPhase',
  ADVANCE_PHASE: 'advancePhase',
  PLAYER_READY: 'playerReady',
  PLAYER_NOT_READY: 'playerNotReady'
} as const;

export type StandardActionType = typeof STANDARD_ACTIONS[keyof typeof STANDARD_ACTIONS];

// Enhanced game action interface
export interface GameAction {
  type: string;
  playerId: string;
  timestamp: number;
  data: Record<string, any>;
  phase?: string;
  round?: number;
}

// Standardized event types that all games should use
export const STANDARD_EVENTS = {
  PHASE_CHANGED: 'phaseChanged',
  TIMER_TICK: 'timerTick',
  TIMER_EXPIRED: 'timerExpired',
  PLAYER_ACTION: 'playerAction',
  ROUND_COMPLETE: 'roundComplete',
  ROUND_START: 'roundStart',
  GAME_OVER: 'gameOver',
  SCORES_UPDATED: 'scoresUpdated',
  ERROR: 'error',
  PLAYER_JOINED: 'playerJoined',
  PLAYER_LEFT: 'playerLeft',
  GAME_STARTED: 'gameStarted'
} as const;

export type StandardEventType = typeof STANDARD_EVENTS[keyof typeof STANDARD_EVENTS];

// Enhanced game event interface
export interface GameEvent {
  type: string;
  data: any;
  target: 'all' | 'player' | 'host' | 'room';
  playerId?: string;
  timestamp: number;
  phase?: string;
  round?: number;
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
  // Core lifecycle methods
  initialize(players: Player[]): TState;
  processAction(state: TState, action: TAction): GameResult<TState, TEvent>;
  
  // Phase management (required)
  advancePhase(state: TState): TState;
  
  // Game state queries (required)
  getCurrentPhase(state: TState): GamePhaseConfig;
  isGameOver(state: TState): boolean;
  getWinners(state: TState): Player[];
  getValidActions(state: TState, playerId: string): TAction[];
  
  // Event generation (required)
  generatePhaseEvents(state: TState): TEvent[];
  
  // Game configuration (required)
  getGameConfig(): GameConfig;
  
  // Optional methods with default implementations
  getPhaseDuration?(phase: string): number;
  canAdvancePhase?(state: TState): boolean;
  getNextPhase?(currentPhase: string): string;
  isPhaseComplete?(state: TState): boolean;
  updateTimer?(state: TState, delta: number): TState;
  shouldAutoAdvancePhase?(state: TState): boolean;
  getTimeLeft?(state: TState): number;
  generateTimerEvents?(state: TState): TEvent[];
  generateActionEvents?(state: TState, action: TAction): TEvent[];
  validateAction?(state: TState, action: TAction): boolean;
  calculateScores?(state: TState): TState;
  updatePlayerScores?(state: TState, playerId: string, points: number): TState;
}

// Base game engine class that provides common functionality
export abstract class BaseGameEngine<
  TState extends BaseGameState,
  TAction extends GameAction,
  TEvent extends GameEvent,
> implements GameEngine<TState, TAction, TEvent> {
  
  // Abstract methods that each game must implement
  abstract initialize(players: Player[]): TState;
  abstract processAction(state: TState, action: TAction): GameResult<TState, TEvent>;
  abstract getGameConfig(): GameConfig;
  
  // Common phase management logic
  getPhaseDuration(phase: string): number {
    const config = this.getGameConfig();
    const phaseConfig = config.phases.find(p => p.name === phase);
    return phaseConfig?.duration || 0;
  }
  
  canAdvancePhase(state: TState): boolean {
    const config = this.getGameConfig();
    const currentPhase = config.phases.find(p => p.name === state.phase);
    return currentPhase?.autoAdvance || false;
  }
  
  getNextPhase(currentPhase: string): string {
    const config = this.getGameConfig();
    const currentIndex = config.phases.findIndex(p => p.name === currentPhase);
    if (currentIndex < config.phases.length - 1) {
      return config.phases[currentIndex + 1].name;
    }
    return currentPhase;
  }
  
  advancePhase(state: TState): TState {
    const nextPhase = this.getNextPhase(state.phase);
    return {
      ...state,
      phase: nextPhase,
      timeLeft: this.getPhaseDuration(nextPhase) * 1000,
      phaseStartTime: new Date(),
      isRoundComplete: false
    };
  }
  
  isPhaseComplete(state: TState): boolean {
    const config = this.getGameConfig();
    const currentPhase = config.phases.find(p => p.name === state.phase);
    
    if (!currentPhase?.requiresAllPlayers) {
      return true;
    }
    
    // Check if all players have completed required actions
    // This is game-specific and should be overridden
    return this.checkPhaseCompletion(state);
  }
  
  // Timer management
  updateTimer(state: TState, delta: number): TState {
    const newTimeLeft = Math.max(0, state.timeLeft - delta);
    return {
      ...state,
      timeLeft: newTimeLeft
    };
  }
  
  shouldAutoAdvancePhase(state: TState): boolean {
    return state.timeLeft === 0 && this.canAdvancePhase(state);
  }
  
  getTimeLeft(state: TState): number {
    return state.timeLeft;
  }
  
  // Game state queries
  getCurrentPhase(state: TState): GamePhaseConfig {
    const config = this.getGameConfig();
    const phaseConfig = config.phases.find(p => p.name === state.phase);
    if (phaseConfig) {
      return phaseConfig;
    }
    
    // Fallback for unknown phases - convert string to enum if possible
    const fallbackName = this.convertStringToPhaseName(state.phase);
    return { 
      name: fallbackName, 
      duration: 0, 
      allowedActions: [], 
      autoAdvance: false, 
      requiresAllPlayers: false, 
      canSkip: false 
    };
  }

  // Helper method to convert string phase names to enum values
  private convertStringToPhaseName(phaseString: string): GamePhase {
    // Try to find a matching phase name
    const validPhases: GamePhase[] = [GAME_PHASES.LOBBY, GAME_PHASES.PROMPT, GAME_PHASES.CHOOSE, GAME_PHASES.REVEAL, GAME_PHASES.SCORING, GAME_PHASES.ROUND_END, GAME_PHASES.GAME_OVER];
    const validPhase = validPhases.find(value => value === phaseString);
    if (validPhase) {
      return validPhase;
    }
    
    // Default fallback
    return GAME_PHASES.LOBBY;
  }
  
  isGameOver(state: TState): boolean {
    return state.phase === GAME_PHASES.GAME_OVER || state.round >= state.maxRounds;
  }
  
  getWinners(state: TState): Player[] {
    return state.players
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }
  
  getValidActions(state: TState, playerId: string): TAction[] {
    const currentPhase = this.getCurrentPhase(state);
    return currentPhase.allowedActions.map(actionType => ({
      type: actionType,
      playerId,
      timestamp: Date.now(),
      data: {},
      phase: state.phase,
      round: state.round
    })) as TAction[];
  }
  
  // Event generation
  generatePhaseEvents(state: TState): TEvent[] {
    return [{
      type: STANDARD_EVENTS.PHASE_CHANGED,
      data: { phase: state.phase, round: state.round },
      target: 'all',
      timestamp: Date.now(),
      phase: state.phase,
      round: state.round
    } as TEvent];
  }
  
  generateTimerEvents(state: TState): TEvent[] {
    if (state.timeLeft === 0) {
      return [{
        type: STANDARD_EVENTS.TIMER_EXPIRED,
        data: { phase: state.phase, round: state.round },
        target: 'all',
        timestamp: Date.now(),
        phase: state.phase,
        round: state.round
      } as TEvent];
    }
    
    return [{
      type: STANDARD_EVENTS.TIMER_TICK,
      data: { timeLeft: state.timeLeft, phase: state.phase, round: state.round },
      target: 'all',
      timestamp: Date.now(),
      phase: state.phase,
      round: state.round
    } as TEvent];
  }
  
  generateActionEvents(state: TState, action: TAction): TEvent[] {
    return [{
      type: STANDARD_EVENTS.PLAYER_ACTION,
      data: { action: action.type, playerId: action.playerId },
      target: 'all',
      timestamp: Date.now(),
      phase: state.phase,
      round: state.round
    } as TEvent];
  }
  
  // Score management
  calculateScores(state: TState): TState {
    // Base implementation - games should override for specific scoring logic
    return state;
  }
  
  updatePlayerScores(state: TState, playerId: string, points: number): TState {
    const updatedScores = { ...state.scores };
    updatedScores[playerId] = (updatedScores[playerId] || 0) + points;
    
    return {
      ...state,
      scores: updatedScores
    };
  }
  
  // Validation
  validateAction(state: TState, action: TAction): boolean {
    const currentPhase = this.getCurrentPhase(state);
    return currentPhase.allowedActions.includes(action.type);
  }
  
  // Helper method for phase completion checking
  protected checkPhaseCompletion(state: TState): boolean {
    // Base implementation - games should override
    return true;
  }
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
  vote: string;
}

export interface Choice {
  id: string;
  by: string;
  text: string;
}

// Fibbing It specific types
export interface FibbingItAnswer {
  id: string;
  text: string;
  playerId: string;
  isTruth: boolean;
}

export interface FibbingItVote {
  playerId: string;
  vote: string;
}

export interface FibbingItGameState extends BaseGameState {
  phase: GamePhase;
  answers: FibbingItAnswer[];
  votes: FibbingItVote[];
  currentPrompt: string;
  usedPromptIds: Set<string>;
}

export interface FibbingItAction extends GameAction {
  type: 'start' | 'submitAnswer' | 'submitVote' | 'skipPhase' | 'advancePhase';
  data: {
    answer?: string;
    vote?: string;
  };
}

export interface FibbingItEvent extends GameEvent {
  type: StandardEventType | 'answerSubmitted' | 'voteSubmitted' | 'prompt';
  data: {
    answerId?: string;
    playerId?: string;
    question?: string;
    round?: number;
    timeLeft?: number;
    phase?: string;
  };
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
  phase: GamePhase;
}

export interface RoomState {
  code: string;
  gameType: string;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  timeLeft: number;
  players: Player[];
  current?: RoundState;
  hostId?: string;
  usedPromptIds: Set<string>;
  timer?: NodeJS.Timeout;
  choices?: Choice[]; // Choices for voting phases
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
  vote: string;
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

// Fibbing It game configuration
export const FIBBING_IT_CONFIG: GameConfig = {
  id: 'fibbing-it',
  name: 'Fibbing It',
  description: 'Players create answers and vote on the best ones',
  minPlayers: 2,
  maxPlayers: 8,
  phases: [
    {
      name: GAME_PHASES.LOBBY,
      duration: 0,
      allowedActions: ['start'],
      autoAdvance: false,
      requiresAllPlayers: false,
      canSkip: false
    },
    {
      name: GAME_PHASES.PROMPT,
      duration: 25,
      allowedActions: ['submitAnswer'],
      autoAdvance: true,
      requiresAllPlayers: true,
      canSkip: false
    },
    {
      name: GAME_PHASES.CHOOSE,
      duration: 15,
      allowedActions: ['submitVote'],
      autoAdvance: true,
      requiresAllPlayers: true,
      canSkip: false
    },
    {
      name: GAME_PHASES.REVEAL,
      duration: 15,
      allowedActions: [],
      autoAdvance: true,
      requiresAllPlayers: false,
      canSkip: false
    },
    {
      name: GAME_PHASES.SCORING,
      duration: 10,
      allowedActions: [],
      autoAdvance: true,
      requiresAllPlayers: false,
      canSkip: false
    },
    {
      name: GAME_PHASES.ROUND_END,
      duration: 5,
      allowedActions: [],
      autoAdvance: true,
      requiresAllPlayers: false,
      canSkip: false
    },
    {
      name: GAME_PHASES.GAME_OVER,
      duration: 0,
      allowedActions: [],
      autoAdvance: false,
      requiresAllPlayers: false,
      canSkip: false
    }
  ],
  defaultSettings: {
    maxRounds: 5,
    pointsPerVote: 100,
    bonusForCorrect: 500
  },
  uiComponents: ['fibbing-it-phase-manager']
};

// Bluff Trivia game configuration
export const BLUFF_TRIVIA_CONFIG: GameConfig = {
  id: 'bluff-trivia',
  name: 'Bluff Trivia',
  description: 'Players create bluffs and vote on the correct answer',
  minPlayers: 2,
  maxPlayers: 8,
  phases: [
    {
      name: GAME_PHASES.LOBBY,
      duration: 0,
      allowedActions: ['start'],
      autoAdvance: false,
      requiresAllPlayers: false,
      canSkip: false
    },
    {
      name: GAME_PHASES.PROMPT,
      duration: 15,
      allowedActions: ['submitAnswer'],
      autoAdvance: true,
      requiresAllPlayers: true,
      canSkip: false
    },
    {
      name: GAME_PHASES.CHOOSE,
      duration: 20,
      allowedActions: ['submitVote'],
      autoAdvance: true,
      requiresAllPlayers: true,
      canSkip: false
    },
    {
      name: GAME_PHASES.SCORING,
      duration: 6,
      allowedActions: [],
      autoAdvance: true,
      requiresAllPlayers: false,
      canSkip: false
    },
    {
      name: GAME_PHASES.ROUND_END,
      duration: 0,
      allowedActions: [],
      autoAdvance: false,
      requiresAllPlayers: false,
      canSkip: false
    }
  ],
  defaultSettings: {
    maxRounds: 5,
    correctAnswerPoints: 1000,
    bluffPoints: 500
  },
  uiComponents: ['bluff-trivia-phase-manager']
};

// Word Association game configuration
export const WORD_ASSOCIATION_CONFIG: GameConfig = {
  id: 'word-association',
  name: 'Word Association',
  description: 'Players create word chains based on prompts',
  minPlayers: 2,
  maxPlayers: 8,
  phases: [
    {
      name: GAME_PHASES.LOBBY,
      duration: 0,
      allowedActions: ['start'],
      autoAdvance: false,
      requiresAllPlayers: false,
      canSkip: false
    },
    {
      name: GAME_PHASES.PROMPT,
      duration: 30,
      allowedActions: ['submitAnswer'],
      autoAdvance: true,
      requiresAllPlayers: true,
      canSkip: false
    },
    {
      name: GAME_PHASES.SCORING,
      duration: 10,
      allowedActions: [],
      autoAdvance: true,
      requiresAllPlayers: false,
      canSkip: false
    },
    {
      name: GAME_PHASES.ROUND_END,
      duration: 5,
      allowedActions: [],
      autoAdvance: true,
      requiresAllPlayers: false,
      canSkip: false
    },
    {
      name: GAME_PHASES.GAME_OVER,
      duration: 0,
      allowedActions: [],
      autoAdvance: false,
      requiresAllPlayers: false,
      canSkip: false
    }
  ],
  defaultSettings: {
    maxRounds: 5,
    pointsPerWord: 100,
    bonusForCreativity: 200
  },
  uiComponents: ['word-association-phase-manager']
};

// Game configuration registry
export const GAME_CONFIGS: Record<string, GameConfig> = {
  'fibbing-it': FIBBING_IT_CONFIG,
  'bluff-trivia': BLUFF_TRIVIA_CONFIG,
  'word-association': WORD_ASSOCIATION_CONFIG,
};

// Helper function to get game configuration by ID
export const getGameConfig = (gameId: string): GameConfig | undefined => {
  return GAME_CONFIGS[gameId];
};