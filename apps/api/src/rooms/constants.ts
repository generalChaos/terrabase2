import { GameConfig } from '@party/types';

// Re-export game configuration for backward compatibility
export const GAME_PHASE_DURATIONS = GameConfig.TIMING.PHASES;
export const GAME_CONFIG = {
  MAX_ROUNDS: GameConfig.RULES.ROUNDS.MAX_ROUNDS,
  CLEANUP_INTERVAL_MS: GameConfig.TIMING.TIMER.CLEANUP_INTERVAL_MS,
  TIMER_TICK_MS: GameConfig.TIMING.TIMER.TICK_MS,
};

export const PHASE_NAMES = {
  LOBBY: 'lobby',
  PROMPT: 'prompt',
  CHOOSE: 'choose',
  SCORING: 'scoring',
  OVER: 'over',
} as const;

export enum EventType {
  TIMER = 'timer',
  PROMPT = 'prompt',
  CHOICES = 'choices',
  SCORES = 'scores',
  ROOM_UPDATE = 'roomUpdate',
  GAME_OVER = 'gameOver',
  PHASE_CHANGED = 'phaseChanged',
  ANSWER_SUBMITTED = 'answerSubmitted',
  VOTE_SUBMITTED = 'voteSubmitted',
}

export enum EventTarget {
  ALL = 'all',
  PLAYER = 'player',
  HOST = 'host',
}

export const GAME_TYPES = GameConfig.GAME_TYPES;
