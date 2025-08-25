import {
  GameEngine,
  GameAction,
  GameEvent,
  GameResult,
  GamePhase,
  BaseGameState,
  Player,
  WORD_ASSOCIATION_CONFIG,
  GameConfig,
} from '@party/types';
import { prompts } from '../prompts.seed';
import { uid, shuffle } from '../utils';

// Simplified state that extends BaseGameState
export interface WordAssociationGameState extends BaseGameState {
  round: number;
  maxRounds: number;
  currentRound?: WordAssociationRound;
  usedPromptIds: Set<string>;
}

export interface WordAssociationRound {
  roundNumber: number;
  promptId: string;
  prompt: string;
  words: Map<string, string>; // playerId -> word
  timeLeft: number;
  phase: 'prompt' | 'scoring';
}

export interface WordAssociationAction extends GameAction {
  type: 'start' | 'submitAnswer';
  data: any;
}

export interface WordAssociationEvent extends GameEvent {
  type: 'prompt' | 'words' | 'scores' | 'gameOver' | 'roomUpdate' | 'timer' | 'submitted';
  data: any;
}

export class WordAssociationNewEngine implements GameEngine<WordAssociationGameState, WordAssociationAction, WordAssociationEvent> {
  
  // Required methods
  getGameConfig(): GameConfig {
    return WORD_ASSOCIATION_CONFIG;
  }

  initialize(players: Player[]): WordAssociationGameState {
    const now = new Date();
    return {
      phase: 'lobby',
      players: players.map((p) => ({ ...p, score: 0 })),
      timeLeft: 0,
      round: 0,
      maxRounds: WORD_ASSOCIATION_CONFIG.defaultSettings.maxRounds,
      scores: {},
      createdAt: now,
      updatedAt: now,
      isRoundComplete: false,
      phaseStartTime: now,
      usedPromptIds: new Set(),
    };
  }

  processAction(state: WordAssociationGameState, action: WordAssociationAction): GameResult<WordAssociationGameState, WordAssociationEvent> {
    const currentPhase = this.getCurrentPhase(state);
    
    if (!currentPhase.allowedActions.includes(action.type)) {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: `Action ${action.type} not allowed in phase ${state.phase}`,
      };
    }

    switch (action.type) {
      case 'start':
        return this.handleStart(state, action);
      case 'submitAnswer':
        return this.handleSubmitAnswer(state, action);
      default:
        return {
          newState: state,
          events: [],
          isValid: false,
          error: `Unknown action type: ${action.type}`,
        };
    }
  }

  advancePhase(state: WordAssociationGameState): WordAssociationGameState {
    const config = this.getGameConfig();
    const currentIndex = config.phases.findIndex(p => p.name === state.phase);
    
    if (currentIndex < config.phases.length - 1) {
      const nextPhase = config.phases[currentIndex + 1];
      return {
        ...state,
        phase: nextPhase.name,
        timeLeft: nextPhase.duration * 1000,
        phaseStartTime: new Date(),
        updatedAt: new Date(),
      };
    }
    
    return state;
  }

  getCurrentPhase(state: WordAssociationGameState): GamePhase {
    const config = this.getGameConfig();
    return config.phases.find((p) => p.name === state.phase) || config.phases[0];
  }

  isGameOver(state: WordAssociationGameState): boolean {
    return state.phase === 'game-over';
  }

  getWinners(state: WordAssociationGameState): Player[] {
    if (!this.isGameOver(state)) return [];
    return [...state.players].sort((a, b) => b.score - a.score).slice(0, 3);
  }

  getValidActions(state: WordAssociationGameState, playerId: string): WordAssociationAction[] {
    const currentPhase = this.getCurrentPhase(state);
    const player = state.players.find((p) => p.id === playerId);
    
    if (!player) return [];

    const actions: WordAssociationAction[] = [];
    const now = Date.now();

    if (currentPhase.allowedActions.includes('start') && playerId === state.players[0]?.id) {
      actions.push({ type: 'start', playerId, data: {}, timestamp: now });
    }

    if (currentPhase.allowedActions.includes('submitAnswer') && state.phase === 'prompt') {
      actions.push({ type: 'submitAnswer', playerId, data: {}, timestamp: now });
    }

    return actions;
  }

  generatePhaseEvents(state: WordAssociationGameState): WordAssociationEvent[] {
    const events: WordAssociationEvent[] = [];
    const now = Date.now();

    switch (state.phase) {
      case 'game-over':
        events.push({
          type: 'gameOver',
          data: { winners: this.getWinners(state) },
          target: 'all',
          timestamp: now,
        });
        break;
      case 'prompt':
        if (state.currentRound) {
          events.push({
            type: 'prompt',
            data: { question: state.currentRound.prompt },
            target: 'all',
            timestamp: now,
          });
        }
        break;
      case 'scoring':
        if (state.currentRound) {
          const words = Array.from(state.currentRound.words.entries()).map(([playerId, word]) => ({
            playerId,
            word,
          }));
          events.push({
            type: 'words',
            data: { words },
            target: 'all',
            timestamp: now,
          });
        }
        events.push({
          type: 'scores',
          data: {
            totals: state.players.map((p) => ({
              playerId: p.id,
              score: p.score,
            })),
          },
          target: 'all',
          timestamp: now,
        });
        break;
    }

    return events;
  }

  // Optional methods with default implementations
  updateTimer(state: WordAssociationGameState, delta: number): WordAssociationGameState {
    const newTimeLeft = Math.max(0, state.timeLeft - delta);
    return {
      ...state,
      timeLeft: newTimeLeft,
      updatedAt: new Date(),
    };
  }

  // Private helper methods
  private handleStart(state: WordAssociationGameState, action: WordAssociationAction): GameResult<WordAssociationGameState, WordAssociationEvent> {
    const newState = this.advancePhase(state);
    const now = Date.now();
    
    return {
      newState,
      events: [
        { type: 'roomUpdate', data: newState, target: 'all', timestamp: now },
        { type: 'prompt', data: { question: 'Starting new round...' }, target: 'all', timestamp: now },
      ],
      isValid: true,
    };
  }

  private handleSubmitAnswer(state: WordAssociationGameState, action: WordAssociationAction): GameResult<WordAssociationGameState, WordAssociationEvent> {
    // Implementation for handling answer submission
    const now = Date.now();
    return {
      newState: state,
      events: [
        { type: 'submitted', data: { kind: 'answer' }, target: 'player', playerId: action.playerId, timestamp: now },
      ],
      isValid: true,
    };
  }
}
