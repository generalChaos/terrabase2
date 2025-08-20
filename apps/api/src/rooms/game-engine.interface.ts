export interface Player {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  connected: boolean;
}

export interface BaseGameState {
  phase: string;
  players: Player[];
  timeLeft: number;
}

export interface GameAction {
  type: string;
  playerId: string;
  [key: string]: any;
}

export interface GameEvent {
  type: string;
  data: any;
  target?: 'all' | 'player' | 'host';
  playerId?: string;
}

export interface GameResult<TState, TEvent> {
  newState: TState;
  events: TEvent[];
  isValid: boolean;
  error?: string;
}

export interface GamePhase {
  name: string;
  duration: number;
  allowedActions: string[];
  onEnter?: (state: any) => void;
  onExit?: (state: any) => void;
}

export interface GameEngine<TState extends BaseGameState, TAction extends GameAction, TEvent extends GameEvent> {
  initialize(players: Player[]): TState;
  processAction(state: TState, action: TAction): GameResult<TState, TEvent>;
  getValidActions(state: TState, playerId: string): TAction[];
  isGameOver(state: TState): boolean;
  getWinners(state: TState): Player[];
  getCurrentPhase(state: TState): GamePhase;
  advancePhase(state: TState): TState;
  getTimeLeft(state: TState): number;
  updateTimer(state: TState, delta: number): TState;
  generatePhaseEvents(state: TState): TEvent[];
}
