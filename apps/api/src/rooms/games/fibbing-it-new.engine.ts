import {
  GameEngine,
  GameAction,
  GameEvent,
  GameResult,
  GamePhase,
  BaseGameState,
  Player,
  FIBBING_IT_CONFIG,
  GameConfig,
} from '@party/types';
import { prompts } from '../prompts.seed';
import { uid, shuffle } from '../utils';

// Simplified state that extends BaseGameState
export interface FibbingItGameState extends BaseGameState {
  round: number;
  maxRounds: number;
  currentRound?: FibbingItRound;
  usedPromptIds: Set<string>;
}

export interface FibbingItRound {
  roundNumber: number;
  promptId: string;
  prompt: string;
  answers: Map<string, string>; // playerId -> answer
  votes: Map<string, string>; // playerId -> choiceId
  timeLeft: number;
  phase: 'prompt' | 'voting' | 'reveal' | 'scoring';
}

export interface FibbingItAction extends GameAction {
  type: 'start' | 'submitAnswer' | 'submitVote';
  data: any;
}

export interface FibbingItEvent extends GameEvent {
  type: 'prompt' | 'answers' | 'scores' | 'gameOver' | 'roomUpdate' | 'timer' | 'submitted';
  data: any;
}

export class FibbingItNewEngine implements GameEngine<FibbingItGameState, FibbingItAction, FibbingItEvent> {
  
  // Required methods
  getGameConfig(): GameConfig {
    return FIBBING_IT_CONFIG;
  }

  initialize(players: Player[]): FibbingItGameState {
    const now = new Date();
    return {
      phase: 'lobby',
      players: players.map((p) => ({ ...p, score: 0 })),
      timeLeft: 0,
      round: 0,
      maxRounds: FIBBING_IT_CONFIG.defaultSettings.maxRounds,
      scores: {},
      createdAt: now,
      updatedAt: now,
      isRoundComplete: false,
      phaseStartTime: now,
      usedPromptIds: new Set(),
    };
  }

  processAction(state: FibbingItGameState, action: FibbingItAction): GameResult<FibbingItGameState, FibbingItEvent> {
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
      case 'submitVote':
        return this.handleSubmitVote(state, action);
      default:
        return {
          newState: state,
          events: [],
          isValid: false,
          error: `Unknown action type: ${action.type}`,
        };
    }
  }

  advancePhase(state: FibbingItGameState): FibbingItGameState {
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

  getCurrentPhase(state: FibbingItGameState): GamePhase {
    const config = this.getGameConfig();
    return config.phases.find((p) => p.name === state.phase) || config.phases[0];
  }

  isGameOver(state: FibbingItGameState): boolean {
    return state.phase === 'game-over';
  }

  getWinners(state: FibbingItGameState): Player[] {
    if (!this.isGameOver(state)) return [];
    return [...state.players].sort((a, b) => b.score - a.score).slice(0, 3);
  }

  getValidActions(state: FibbingItGameState, playerId: string): FibbingItAction[] {
    const currentPhase = this.getCurrentPhase(state);
    const player = state.players.find((p) => p.id === playerId);
    
    if (!player) return [];

    const actions: FibbingItAction[] = [];
    const now = Date.now();

    if (currentPhase.allowedActions.includes('start') && playerId === state.players[0]?.id) {
      actions.push({ type: 'start', playerId, data: {}, timestamp: now });
    }

    if (currentPhase.allowedActions.includes('submitAnswer') && state.phase === 'prompt') {
      actions.push({ type: 'submitAnswer', playerId, data: {}, timestamp: now });
    }

    if (currentPhase.allowedActions.includes('submitVote') && state.phase === 'voting') {
      actions.push({ type: 'submitVote', playerId, data: {}, timestamp: now });
    }

    return actions;
  }

  generatePhaseEvents(state: FibbingItGameState): FibbingItEvent[] {
    const events: FibbingItEvent[] = [];
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
      case 'voting':
        if (state.currentRound) {
          const answers = Array.from(state.currentRound.answers.entries()).map(([playerId, answer]) => ({
            playerId,
            answer,
          }));
          events.push({
            type: 'answers',
            data: { answers },
            target: 'all',
            timestamp: now,
          });
        }
        break;
      case 'scoring':
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
  updateTimer(state: FibbingItGameState, delta: number): FibbingItGameState {
    const newTimeLeft = Math.max(0, state.timeLeft - delta);
    return {
      ...state,
      timeLeft: newTimeLeft,
      updatedAt: new Date(),
    };
  }

  // Private helper methods
  private handleStart(state: FibbingItGameState, action: FibbingItAction): GameResult<FibbingItGameState, FibbingItEvent> {
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

  private handleSubmitAnswer(state: FibbingItGameState, action: FibbingItAction): GameResult<FibbingItGameState, FibbingItEvent> {
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

  private handleSubmitVote(state: FibbingItGameState, action: FibbingItAction): GameResult<FibbingItGameState, FibbingItEvent> {
    // Implementation for handling vote submission
    const now = Date.now();
    return {
      newState: state,
      events: [
        { type: 'submitted', data: { kind: 'vote' }, target: 'player', playerId: action.playerId, timestamp: now },
      ],
      isValid: true,
    };
  }
}
