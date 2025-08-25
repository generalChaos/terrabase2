import {
  GameEngine,
  GameAction,
  GameEvent,
  GameResult,
  GamePhase,
  BaseGameState,
  Player,
  BLUFF_TRIVIA_CONFIG,
  GameConfig,
} from '@party/types';
import { prompts } from '../prompts.seed';
import { uid, shuffle } from '../utils';

// Simplified state that extends BaseGameState
export interface BluffTriviaState extends BaseGameState {
  round: number;
  maxRounds: number;
  currentRound?: BluffTriviaRound;
  usedPromptIds: Set<string>;
}

export interface BluffTriviaRound {
  roundNumber: number;
  promptId: string;
  prompt: string;
  answer: string;
  bluffs: Bluff[];
  votes: Map<string, string>; // playerId -> choiceId
  correctAnswerPlayers: Set<string>; // Players who got the answer right
  timeLeft: number;
  phase: 'prompt' | 'choose' | 'scoring';
}

export interface Bluff {
  id: string;
  by: string;
  text: string;
  isCorrect?: boolean;
}

export interface BluffTriviaAction extends GameAction {
  type: 'start' | 'submitAnswer' | 'submitVote';
  data: any;
}

export interface BluffTriviaEvent extends GameEvent {
  type: 'prompt' | 'choices' | 'scores' | 'gameOver' | 'roomUpdate' | 'timer' | 'submitted';
  data: any;
}

export class BluffTriviaNewEngine implements GameEngine<BluffTriviaState, BluffTriviaAction, BluffTriviaEvent> {
  
  // Required methods
  getGameConfig(): GameConfig {
    return BLUFF_TRIVIA_CONFIG;
  }

  initialize(players: Player[]): BluffTriviaState {
    const now = new Date();
    return {
      phase: 'lobby',
      players: players.map((p) => ({ ...p, score: 0 })),
      timeLeft: 0,
      round: 0,
      maxRounds: BLUFF_TRIVIA_CONFIG.defaultSettings.maxRounds,
      scores: {},
      createdAt: now,
      updatedAt: now,
      isRoundComplete: false,
      phaseStartTime: now,
      usedPromptIds: new Set(),
    };
  }

  processAction(state: BluffTriviaState, action: BluffTriviaAction): GameResult<BluffTriviaState, BluffTriviaEvent> {
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

  advancePhase(state: BluffTriviaState): BluffTriviaState {
    const config = this.getGameConfig();
    const currentIndex = config.phases.findIndex(p => p.name === state.phase);
    
    if (currentIndex < config.phases.length - 1) {
      const nextPhase = config.phases[currentIndex + 1];
      
      // If transitioning from lobby to prompt, start a new round
      if (state.phase === 'lobby' && nextPhase.name === 'prompt') {
        const newRound = this.createNewRound(state.round + 1, state.usedPromptIds);
        return {
          ...state,
          phase: nextPhase.name,
          round: state.round + 1,
          currentRound: newRound,
          timeLeft: nextPhase.duration * 1000,
          phaseStartTime: new Date(),
          updatedAt: new Date(),
        };
      }
      
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

  getCurrentPhase(state: BluffTriviaState): GamePhase {
    const config = this.getGameConfig();
    return config.phases.find((p) => p.name === state.phase) || config.phases[0];
  }

  isGameOver(state: BluffTriviaState): boolean {
    return state.phase === 'over';
  }

  getWinners(state: BluffTriviaState): Player[] {
    if (!this.isGameOver(state)) return [];
    return [...state.players].sort((a, b) => b.score - a.score).slice(0, 3);
  }

  getValidActions(state: BluffTriviaState, playerId: string): BluffTriviaAction[] {
    const currentPhase = this.getCurrentPhase(state);
    const player = state.players.find((p) => p.id === playerId);
    
    if (!player) return [];

    const actions: BluffTriviaAction[] = [];
    const now = Date.now();

    if (currentPhase.allowedActions.includes('start') && playerId === state.players[0]?.id) {
      actions.push({ type: 'start', playerId, data: {}, timestamp: now });
    }

    if (currentPhase.allowedActions.includes('submitAnswer') && state.phase === 'prompt') {
      actions.push({ type: 'submitAnswer', playerId, data: {}, timestamp: now });
    }

    if (currentPhase.allowedActions.includes('submitVote') && state.phase === 'choose') {
      actions.push({ type: 'submitVote', playerId, data: {}, timestamp: now });
    }

    return actions;
  }

  generatePhaseEvents(state: BluffTriviaState): BluffTriviaEvent[] {
    const events: BluffTriviaEvent[] = [];
    const now = Date.now();

    switch (state.phase) {
      case 'over':
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
      case 'choose':
        if (state.currentRound) {
          const choices = this.generateChoices(state.currentRound);
          events.push({
            type: 'choices',
            data: { choices },
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
  updateTimer(state: BluffTriviaState, delta: number): BluffTriviaState {
    const newTimeLeft = Math.max(0, state.timeLeft - delta);
    return {
      ...state,
      timeLeft: newTimeLeft,
      updatedAt: new Date(),
    };
  }

  // Private helper methods
  private handleStart(state: BluffTriviaState, action: BluffTriviaAction): GameResult<BluffTriviaState, BluffTriviaEvent> {
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

  private handleSubmitAnswer(state: BluffTriviaState, action: BluffTriviaAction): GameResult<BluffTriviaState, BluffTriviaEvent> {
    // Implementation for handling answer submission
    const now = Date.now();
    return {
      newState: state,
      events: [
        { type: 'roomUpdate', data: state, target: 'all', timestamp: now },
        { type: 'submitted', data: { kind: 'answer' }, target: 'player', playerId: action.playerId, timestamp: now },
      ],
      isValid: true,
    };
  }

  private handleSubmitVote(state: BluffTriviaState, action: BluffTriviaAction): GameResult<BluffTriviaState, BluffTriviaEvent> {
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

  private generateChoices(round: BluffTriviaRound): Array<{ id: string; text: string }> {
    const choices = [
      { id: 'correct', text: round.answer },
      ...round.bluffs.map(b => ({ id: b.id, text: b.text }))
    ];
    return shuffle(choices);
  }

  private createNewRound(roundNumber: number, usedPromptIds: Set<string>): BluffTriviaRound {
    // Get a random prompt that hasn't been used
    const availablePrompts = prompts.filter(p => !usedPromptIds.has(p.id));
    if (availablePrompts.length === 0) {
      // Reset used prompts if we run out
      usedPromptIds.clear();
    }
    
    const prompt = shuffle(availablePrompts)[0];
    usedPromptIds.add(prompt.id);
    
    return {
      roundNumber,
      promptId: prompt.id,
      prompt: prompt.question,
      answer: prompt.answer,
      bluffs: [],
      votes: new Map(),
      correctAnswerPlayers: new Set(),
      timeLeft: this.getGameConfig().phases.find(p => p.name === 'prompt')?.duration || 15,
      phase: 'prompt',
    };
  }
}
