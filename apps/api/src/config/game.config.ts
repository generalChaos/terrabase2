/**
 * Centralized game configuration
 * All magic numbers and game parameters should be defined here
 */

export const GameConfig = {
  // Game timing configuration
  TIMING: {
    // Phase durations in seconds
    PHASES: {
      PROMPT: 15,    // Time to submit answer/bluff
      CHOOSE: 20,    // Time to vote
      SCORING: 6,    // Time to show results
    },
    
    // Timer configuration
    TIMER: {
      TICK_MS: 1000,           // Timer tick interval in milliseconds
      CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // Room cleanup interval (5 minutes)
    },
    
    // Time conversion constants
    CONVERSIONS: {
      SECONDS_TO_MS: 1000,     // Convert seconds to milliseconds
      MINUTES_TO_SECONDS: 60,  // Convert minutes to seconds
      MINUTES_TO_MS: 60 * 1000, // Convert minutes to milliseconds
    }
  },

  // Game rules and limits
  RULES: {
    // Round configuration
    ROUNDS: {
      MAX_ROUNDS: 5,           // Maximum number of rounds per game
      MIN_PLAYERS_TO_START: 2, // Minimum players required to start
    },
    
    // Scoring configuration
    SCORING: {
      CORRECT_ANSWER: 1000,    // Points for correct answer
      BLUFF_POINTS: 500,       // Points per player fooled by bluff
    },
    
    // Player configuration
    PLAYERS: {
      MAX_PLAYERS_PER_ROOM: 8, // Maximum players in a room
      MIN_NICKNAME_LENGTH: 2,  // Minimum nickname length
      MAX_NICKNAME_LENGTH: 20, // Maximum nickname length
    }
  },

  // Input validation limits
  VALIDATION: {
    MAX_INPUT_LENGTH: 1000,    // Maximum length for any text input
    ROOM_CODE_PATTERN: /^[a-zA-Z0-9]{4,8}$/, // Room code format
    ROOM_CODE_MIN_LENGTH: 4,   // Minimum room code length
    ROOM_CODE_MAX_LENGTH: 8,   // Maximum room code length
  },

  // HTTP status codes
  HTTP_STATUS: {
    BAD_REQUEST: 400,          // Client error
    UNAUTHORIZED: 401,         // Authentication required
    FORBIDDEN: 403,            // Access denied
    NOT_FOUND: 404,            // Resource not found
    CONFLICT: 409,             // Resource conflict
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
      INACTIVE_MINUTES: 30,    // Minutes before room is considered inactive
      EMPTY_ROOM_DELAY_MS: 0,  // Delay before cleaning up empty rooms (0 = immediate)
    }
  }
} as const;

// Type-safe access to configuration
export type GameConfigType = typeof GameConfig;

// Helper functions for common calculations
export const GameConfigHelpers = {
  /**
   * Convert seconds to milliseconds
   */
  secondsToMs: (seconds: number): number => seconds * GameConfig.TIMING.CONVERSIONS.SECONDS_TO_MS,
  
  /**
   * Convert minutes to milliseconds
   */
  minutesToMs: (minutes: number): number => minutes * GameConfig.TIMING.CONVERSIONS.MINUTES_TO_MS,
  
  /**
   * Convert minutes to seconds
   */
  minutesToSeconds: (minutes: number): number => minutes * GameConfig.TIMING.CONVERSIONS.MINUTES_TO_SECONDS,
  
  /**
   * Check if a room code is valid
   */
  isValidRoomCode: (code: string): boolean => GameConfig.VALIDATION.ROOM_CODE_PATTERN.test(code),
  
  /**
   * Check if a nickname is valid
   */
  isValidNickname: (nickname: string): boolean => {
    const { MIN_NICKNAME_LENGTH, MAX_NICKNAME_LENGTH } = GameConfig.RULES.PLAYERS;
    return nickname.length >= MIN_NICKNAME_LENGTH && nickname.length <= MAX_NICKNAME_LENGTH;
  }
};
