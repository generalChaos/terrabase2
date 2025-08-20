export const GAME_PHASE_DURATIONS = {
  PROMPT: 15,
  CHOOSE: 20,
  SCORING: 6
} as const;

export const GAME_CONFIG = {
  MAX_ROUNDS: 5,
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  TIMER_TICK_MS: 1000 // 1 second
} as const;

export const PHASE_NAMES = {
  LOBBY: 'lobby',
  PROMPT: 'prompt',
  CHOOSE: 'choose',
  SCORING: 'scoring',
  OVER: 'over'
} as const;

export enum EventType {
  TIMER = 'timer',
  PROMPT = 'prompt',
  CHOICES = 'choices',
  SCORES = 'scores',
  ROOM_UPDATE = 'roomUpdate',
  GAME_OVER = 'gameOver'
}

export enum EventTarget {
  ALL = 'all',
  PLAYER = 'player',
  HOST = 'host'
}

export const GAME_TYPES = {
  BLUFF_TRIVIA: 'bluff-trivia'
} as const;
