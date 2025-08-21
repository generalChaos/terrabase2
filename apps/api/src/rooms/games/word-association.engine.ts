import { GameEngine, BaseGameState, GameAction, GameEvent, GameResult, Player, GamePhase } from '../game-engine.interface';

export interface WordAssociationGameState extends BaseGameState {
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
  currentWord?: string;
  associations?: Array<{
    id: string;
    text: string;
    playerId: string;
  }>;
  votes?: Array<{
    playerId: string;
    associationId: string;
  }>;
}

export class WordAssociationEngine implements GameEngine<WordAssociationGameState, GameAction, GameEvent> {
  initialize(players: Array<{ id: string; name: string; avatar?: string; score: number; connected: boolean }>): WordAssociationGameState {
    return {
      phase: 'lobby',
      players,
      timeLeft: 0,
      round: 0,
      maxRounds: 5,
      usedPromptIds: new Set(),
    };
  }

  processAction(state: WordAssociationGameState, action: GameAction): GameResult<WordAssociationGameState, GameEvent> {
    // Basic implementation - can be expanded later
    return {
      newState: state,
      events: [],
      isValid: true
    };
  }

  getPhaseDuration(phase: string): number {
    const durations: Record<string, number> = {
      lobby: 0,
      prompt: 45, // 45 seconds to write associations
      voting: 25, // 25 seconds to vote
      scoring: 15, // 15 seconds to see results
      over: 0,
    };
    return durations[phase] || 0;
  }

  canAdvancePhase(state: WordAssociationGameState): boolean {
    // Basic logic - can be expanded
    return state.phase !== 'over';
  }

  getNextPhase(currentPhase: string): string {
    const phaseOrder = ['lobby', 'prompt', 'voting', 'scoring', 'over'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    return currentIndex < phaseOrder.length - 1 ? phaseOrder[currentIndex + 1] : currentPhase;
  }

  getValidActions(state: WordAssociationGameState, playerId: string): GameAction[] {
    return [];
  }

  isGameOver(state: WordAssociationGameState): boolean {
    return state.phase === 'over';
  }

  getWinners(state: WordAssociationGameState): Player[] {
    return state.players.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  getCurrentPhase(state: WordAssociationGameState): GamePhase {
    return {
      name: state.phase,
      duration: this.getPhaseDuration(state.phase),
      allowedActions: []
    };
  }

  advancePhase(state: WordAssociationGameState): WordAssociationGameState {
    const nextPhase = this.getNextPhase(state.phase) as WordAssociationGameState['phase'];
    return { ...state, phase: nextPhase };
  }

  getTimeLeft(state: WordAssociationGameState): number {
    return state.timeLeft;
  }

  updateTimer(state: WordAssociationGameState, delta: number): WordAssociationGameState {
    return { ...state, timeLeft: Math.max(0, state.timeLeft - delta) };
  }

  generatePhaseEvents(state: WordAssociationGameState): GameEvent[] {
    return [];
  }
}
