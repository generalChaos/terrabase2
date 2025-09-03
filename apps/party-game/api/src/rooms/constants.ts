import { GameConfig, getGameConfig, BLUFF_TRIVIA_CONFIG } from '../shared/types';

// Re-export game configuration for backward compatibility
export const GAME_PHASE_DURATIONS = {
  PROMPT: BLUFF_TRIVIA_CONFIG.phases.find(p => p.name === 'prompt')?.duration || 15,
  CHOOSE: BLUFF_TRIVIA_CONFIG.phases.find(p => p.name === 'choose')?.duration || 20,
  SCORING: BLUFF_TRIVIA_CONFIG.phases.find(p => p.name === 'scoring')?.duration || 6,
};

export const GAME_CONFIG = {
  MAX_ROUNDS: BLUFF_TRIVIA_CONFIG.defaultSettings.maxRounds || 5,
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
