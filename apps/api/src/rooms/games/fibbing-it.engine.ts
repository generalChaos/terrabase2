import {
  GameEngine,
  BaseGameState,
  GameAction,
  GameEvent,
  GameResult,
  Player,
  GamePhase,
} from '@party/types';

export interface FibbingItGameState extends BaseGameState {
  phase: 'lobby' | 'prompt' | 'voting' | 'scoring' | 'over';
  players: Array<{
    id: string;
    name: string;
    avatar?: string;
    score: number;
    connected: boolean;
  }>;
  timeLeft: number;
  round: number;
  maxRounds: number;
  usedPromptIds: Set<string>;
  currentPrompt?: string;
  answers?: Array<{
    id: string;
    text: string;
    playerId: string;
    isTruth: boolean;
  }>;
  votes?: Array<{
    playerId: string;
    answerId: string;
  }>;
}

export class FibbingItEngine
  implements GameEngine<FibbingItGameState, GameAction, GameEvent>
{
  initialize(
    players: Array<{
      id: string;
      name: string;
      avatar?: string;
      score: number;
      connected: boolean;
    }>,
  ): FibbingItGameState {
    return {
      phase: 'lobby',
      players,
      timeLeft: 0,
      round: 0,
      maxRounds: 5,
      usedPromptIds: new Set(),
    };
  }

  processAction(
    state: FibbingItGameState,
    action: GameAction,
  ): GameResult<FibbingItGameState, GameEvent> {
    // Basic implementation - can be expanded later
    return {
      newState: state,
      events: [],
      isValid: true,
    };
  }

  getPhaseDuration(phase: string): number {
    const durations: Record<string, number> = {
      lobby: 0,
      prompt: 60, // 60 seconds to write answers
      voting: 30, // 30 seconds to vote
      scoring: 15, // 15 seconds to see results
      over: 0,
    };
    return durations[phase] || 0;
  }

  canAdvancePhase(state: FibbingItGameState): boolean {
    // Basic logic - can be expanded
    return state.phase !== 'over';
  }

  getNextPhase(currentPhase: string): string {
    const phaseOrder = ['lobby', 'prompt', 'voting', 'scoring', 'over'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    return currentIndex < phaseOrder.length - 1
      ? phaseOrder[currentIndex + 1]
      : currentPhase;
  }

  getValidActions(state: FibbingItGameState, playerId: string): GameAction[] {
    return [];
  }

  isGameOver(state: FibbingItGameState): boolean {
    return state.phase === 'over';
  }

  getWinners(state: FibbingItGameState): Player[] {
    return state.players.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  getCurrentPhase(state: FibbingItGameState): GamePhase {
    return {
      name: state.phase,
      duration: this.getPhaseDuration(state.phase),
      allowedActions: [],
    };
  }

  advancePhase(state: FibbingItGameState): FibbingItGameState {
    const nextPhase = this.getNextPhase(
      state.phase,
    ) as FibbingItGameState['phase'];
    return { ...state, phase: nextPhase };
  }

  getTimeLeft(state: FibbingItGameState): number {
    return state.timeLeft;
  }

  updateTimer(state: FibbingItGameState, delta: number): FibbingItGameState {
    return { ...state, timeLeft: Math.max(0, state.timeLeft - delta) };
  }

  generatePhaseEvents(state: FibbingItGameState): GameEvent[] {
    return [];
  }
}
