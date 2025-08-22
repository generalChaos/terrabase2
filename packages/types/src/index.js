'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ErrorCategory =
  exports.failure =
  exports.success =
  exports.Failure =
  exports.Success =
  exports.DUR =
  exports.GameConfigHelpers =
  exports.GameConfig =
    void 0;
// Game configuration - Single source of truth
exports.GameConfig = {
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
};
// Helper functions for common calculations
exports.GameConfigHelpers = {
  /**
   * Convert seconds to milliseconds
   */
  secondsToMs: seconds =>
    seconds * exports.GameConfig.TIMING.CONVERSIONS.SECONDS_TO_MS,
  /**
   * Convert minutes to milliseconds
   */
  minutesToMs: minutes =>
    minutes * exports.GameConfig.TIMING.CONVERSIONS.MINUTES_TO_MS,
  /**
   * Convert minutes to seconds
   */
  minutesToSeconds: minutes =>
    minutes * exports.GameConfig.TIMING.CONVERSIONS.MINUTES_TO_SECONDS,
  /**
   * Check if a room code is valid
   */
  isValidRoomCode: code =>
    exports.GameConfig.VALIDATION.ROOM_CODE_PATTERN.test(code),
  /**
   * Check if a nickname is valid
   */
  isValidNickname: nickname => {
    const { MIN_NICKNAME_LENGTH, MAX_NICKNAME_LENGTH } =
      exports.GameConfig.RULES.PLAYERS;
    return (
      nickname.length >= MIN_NICKNAME_LENGTH &&
      nickname.length <= MAX_NICKNAME_LENGTH
    );
  },
};
// Legacy constants for backward compatibility (deprecated - use GameConfig instead)
exports.DUR = {
  PROMPT: exports.GameConfig.TIMING.PHASES.PROMPT,
  CHOOSE: exports.GameConfig.TIMING.PHASES.CHOOSE,
  SCORING: exports.GameConfig.TIMING.PHASES.SCORING,
};
class Success {
  value;
  _tag = 'Success';
  constructor(value) {
    this.value = value;
  }
  isSuccess() {
    return true;
  }
  isFailure() {
    return false;
  }
  map(fn) {
    return new Success(fn(this.value));
  }
  flatMap(fn) {
    return fn(this.value);
  }
  getOrElse(defaultValue) {
    return this.value;
  }
  getOrThrow() {
    return this.value;
  }
}
exports.Success = Success;
class Failure {
  error;
  _tag = 'Failure';
  constructor(error) {
    this.error = error;
  }
  isSuccess() {
    return false;
  }
  isFailure() {
    return true;
  }
  map(fn) {
    return new Failure(this.error);
  }
  flatMap(fn) {
    return new Failure(this.error);
  }
  getOrElse(defaultValue) {
    return defaultValue;
  }
  getOrThrow() {
    if (this.error instanceof Error) {
      throw this.error;
    }
    throw new Error(
      typeof this.error === 'string' ? this.error : 'Unknown error'
    );
  }
}
exports.Failure = Failure;
// Helper functions for creating Results
const success = value => new Success(value);
exports.success = success;
const failure = error => new Failure(error);
exports.failure = failure;
// Error categories for consistent classification
var ErrorCategory;
(function (ErrorCategory) {
  ErrorCategory['VALIDATION'] = 'VALIDATION';
  ErrorCategory['BUSINESS_LOGIC'] = 'BUSINESS_LOGIC';
  ErrorCategory['SYSTEM'] = 'SYSTEM';
  ErrorCategory['AUTHENTICATION'] = 'AUTHENTICATION';
  ErrorCategory['NETWORK'] = 'NETWORK';
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
