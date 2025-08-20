import { GameEngine, GameAction, GameEvent, GameResult, GamePhase, BaseGameState, Player } from '../game-engine.interface';
import { prompts } from '../prompts.seed';
import { TRUE, uid, shuffle } from '../utils';
import { GAME_PHASE_DURATIONS, GAME_CONFIG, PHASE_NAMES } from '../constants';

export interface BluffTriviaState extends BaseGameState {
  round: number;
  maxRounds: number;
  currentRound?: RoundState;
  usedPromptIds: Set<string>;
}

export interface RoundState {
  number: number;
  promptId: string;
  question: string;
  answer: string;
  bluffs: Bluff[];
  votes: Vote[];
}

export interface Bluff {
  id: string;
  by: string;
  text: string;
}

export interface Vote {
  voter: string;
  choiceId: string;
}

export interface BluffTriviaAction extends GameAction {
  type: 'join' | 'start' | 'submitAnswer' | 'submitBluff' | 'submitVote';
  data: any;
}

export interface BluffTriviaEvent extends GameEvent {
  type: 'prompt' | 'choices' | 'scores' | 'gameOver' | 'roomUpdate' | 'timer';
  data: any;
}

export class BluffTriviaEngine implements GameEngine<BluffTriviaState, BluffTriviaAction, BluffTriviaEvent> {
  private phases: GamePhase[] = [
    { name: PHASE_NAMES.LOBBY, duration: 0, allowedActions: ['join', 'start'] },
    { name: PHASE_NAMES.PROMPT, duration: GAME_PHASE_DURATIONS.PROMPT, allowedActions: ['submitAnswer', 'submitBluff'] },
    { name: PHASE_NAMES.CHOOSE, duration: GAME_PHASE_DURATIONS.CHOOSE, allowedActions: ['submitVote'] },
    { name: PHASE_NAMES.SCORING, duration: GAME_PHASE_DURATIONS.SCORING, allowedActions: [] },
    { name: PHASE_NAMES.OVER, duration: 0, allowedActions: [] }
  ];

  initialize(players: Player[]): BluffTriviaState {
    return {
      phase: PHASE_NAMES.LOBBY,
      players: players.map(p => ({ ...p, score: 0 })),
      timeLeft: 0,
      round: 0,
      maxRounds: GAME_CONFIG.MAX_ROUNDS,
      usedPromptIds: new Set()
    };
  }

  processAction(state: BluffTriviaState, action: BluffTriviaAction): GameResult<BluffTriviaState, BluffTriviaEvent> {
    const currentPhase = this.getCurrentPhase(state);
    
    if (!currentPhase.allowedActions.includes(action.type)) {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: `Action ${action.type} not allowed in phase ${state.phase}`
      };
    }

    switch (action.type) {
      case 'join':
        return this.handleJoin(state, action);
      case 'start':
        return this.handleStart(state, action);
      case 'submitAnswer':
        return this.handleSubmitAnswer(state, action);
      case 'submitBluff':
        return this.handleSubmitBluff(state, action);
      case 'submitVote':
        return this.handleSubmitVote(state, action);
      default:
        return {
          newState: state,
          events: [],
          isValid: false,
          error: `Unknown action type: ${action.type}`
        };
    }
  }

  getValidActions(state: BluffTriviaState, playerId: string): BluffTriviaAction[] {
    const currentPhase = this.getCurrentPhase(state);
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) return [];

    const actions: BluffTriviaAction[] = [];
    
    if (currentPhase.allowedActions.includes('join')) {
      actions.push({ type: 'join', playerId, data: {} });
    }
    
    if (currentPhase.allowedActions.includes('start') && playerId === state.players[0]?.id) {
      actions.push({ type: 'start', playerId, data: {} });
    }
    
    if (currentPhase.allowedActions.includes('submitAnswer') && state.phase === PHASE_NAMES.PROMPT) {
      actions.push({ type: 'submitAnswer', playerId, data: {} });
    }
    
    if (currentPhase.allowedActions.includes('submitBluff') && state.phase === PHASE_NAMES.PROMPT) {
      actions.push({ type: 'submitBluff', playerId, data: {} });
    }
    
    if (currentPhase.allowedActions.includes('submitVote') && state.phase === PHASE_NAMES.CHOOSE) {
      actions.push({ type: 'submitVote', playerId, data: {} });
    }
    
    return actions;
  }

  isGameOver(state: BluffTriviaState): boolean {
    return state.phase === 'over';
  }

  getWinners(state: BluffTriviaState): Player[] {
    if (!this.isGameOver(state)) return [];
    
    return [...state.players]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  getCurrentPhase(state: BluffTriviaState): GamePhase {
    return this.phases.find(p => p.name === state.phase) || this.phases[0];
  }

  advancePhase(state: BluffTriviaState): BluffTriviaState {
    const currentPhaseIndex = this.phases.findIndex(p => p.name === state.phase);
    const nextPhaseIndex = currentPhaseIndex + 1;
    
    if (nextPhaseIndex >= this.phases.length) {
      return { ...state, phase: 'over' };
    }
    
    const nextPhase = this.phases[nextPhaseIndex];
    let newState: BluffTriviaState = { ...state, phase: nextPhase.name, timeLeft: nextPhase.duration };
    
    // Handle game-specific phase transitions
    switch (nextPhase.name) {
      case 'prompt':
        if (state.round < state.maxRounds) {
          newState = {
            ...newState,
            round: state.round + 1,
            currentRound: this.generateNewRound(newState)
          };
        }
        break;
      case 'choose':
        // No additional state changes needed for choose phase
        break;
      case 'scoring':
        // Score the current round
        if (state.currentRound) {
          this.scoreRound(newState);
        }
        break;
      case 'over':
        // Game is over, no additional state changes
        break;
    }
    
    return newState;
  }

  getTimeLeft(state: BluffTriviaState): number {
    return state.timeLeft;
  }

  updateTimer(state: BluffTriviaState, delta: number): BluffTriviaState {
    const newTimeLeft = Math.max(0, state.timeLeft - delta);
    return { ...state, timeLeft: newTimeLeft };
  }
  
  generatePhaseEvents(state: BluffTriviaState): BluffTriviaEvent[] {
    const events: BluffTriviaEvent[] = [];
    
    switch (state.phase) {
      case 'over':
        events.push({ 
          type: 'gameOver', 
          data: { winners: this.getWinners(state) }, 
          target: 'all' 
        });
        break;
      case 'prompt':
        if (state.currentRound) {
          events.push({ 
            type: 'prompt', 
            data: { question: state.currentRound.question }, 
            target: 'all' 
          });
        }
        break;
      case 'choose':
        if (state.currentRound) {
          const choices = this.generateChoices(state.currentRound);
          events.push({ 
            type: 'choices', 
            data: { choices }, 
            target: 'all' 
          });
        }
        break;
      case 'scoring':
        events.push({ 
          type: 'scores', 
          data: { 
            totals: state.players.map(p => ({ playerId: p.id, score: p.score }))
          }, 
          target: 'all' 
        });
        break;
    }
    
    return events;
  }

  // Private methods for handling specific actions
  private handleJoin(state: BluffTriviaState, action: BluffTriviaAction): GameResult<BluffTriviaState, BluffTriviaEvent> {
    const { nickname, avatar } = action.data;
    
    if (!nickname || nickname.trim().length === 0) {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: 'Nickname is required'
      };
    }
    
    const existingPlayer = state.players.find(p => p.name === nickname);
    if (existingPlayer) {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: 'Name already taken'
      };
    }
    
    const newPlayer: Player = {
      id: action.playerId,
      name: nickname,
      avatar,
      connected: true,
      score: 0
    };
    
    const newState: BluffTriviaState = {
      ...state,
      players: [...state.players, newPlayer]
    };
    
    return {
      newState,
      events: [
        { type: 'roomUpdate', data: newState, target: 'all' },
        { type: 'roomUpdate', data: { ok: true }, target: 'player', playerId: action.playerId }
      ],
      isValid: true
    };
  }

  private handleStart(state: BluffTriviaState, action: BluffTriviaAction): GameResult<BluffTriviaState, BluffTriviaEvent> {
    if (state.players.length < 2) {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: 'Need at least 2 players to start'
      };
    }
    
    const newState: BluffTriviaState = {
      ...state,
      phase: PHASE_NAMES.PROMPT,
      round: 1,
      timeLeft: GAME_PHASE_DURATIONS.PROMPT,
      currentRound: this.generateNewRound(state)
    };
    
    return {
      newState,
      events: [
        { type: 'roomUpdate', data: newState, target: 'all' },
        { type: 'prompt', data: { question: newState.currentRound!.question }, target: 'all' }
      ],
      isValid: true
    };
  }

  private handleSubmitAnswer(state: BluffTriviaState, action: BluffTriviaAction): GameResult<BluffTriviaState, BluffTriviaEvent> {
    if (state.phase !== PHASE_NAMES.PROMPT || !state.currentRound) {
      return {
        newState: state,
        isValid: false,
        events: [],
        error: 'Cannot submit answer in current phase'
      };
    }
    
    const { answer } = action.data;
    const text = (answer || '').trim();
    
    if (!text) {
      return {
        newState: state,
        isValid: false,
        events: [],
        error: 'Answer cannot be empty'
      };
    }
    
    // Check if player already submitted
    if (state.currentRound.bluffs.some(b => b.by === action.playerId)) {
      return {
        newState: state,
        isValid: false,
        events: [],
        error: 'Already submitted an answer'
      };
    }
    
    const newBluff: Bluff = { id: uid(), by: action.playerId, text };
    const newCurrentRound = {
      ...state.currentRound,
      bluffs: [...state.currentRound.bluffs, newBluff]
    };
    
    const newState: BluffTriviaState = {
      ...state,
      currentRound: newCurrentRound
    };
    
    return {
      newState,
      events: [
        { type: 'roomUpdate', data: newState, target: 'all' },
        { type: 'roomUpdate', data: { kind: 'answer' }, target: 'player', playerId: action.playerId }
      ],
      isValid: true
    };
  }

  private handleSubmitBluff(state: BluffTriviaState, action: BluffTriviaAction): GameResult<BluffTriviaState, BluffTriviaEvent> {
    if (state.phase !== PHASE_NAMES.PROMPT || !state.currentRound) {
      return {
        newState: state,
        isValid: false,
        events: [],
        error: 'Cannot submit bluff in current phase'
      };
    }
    
    const { text } = action.data;
    const bluffText = (text || '').trim();
    
    if (!bluffText) {
      return {
        newState: state,
        isValid: false,
        events: [],
        error: 'Bluff cannot be empty'
      };
    }
    
    // Check for duplicate bluffs
    if (state.currentRound.bluffs.some(b => b.text.toLowerCase() === bluffText.toLowerCase())) {
      return {
        newState: state,
        isValid: false,
        events: [],
        error: 'Identical bluff already submitted'
      };
    }
    
    const newBluff: Bluff = { id: uid(), by: action.playerId, text: bluffText };
    const newCurrentRound = {
      ...state.currentRound,
      bluffs: [...state.currentRound.bluffs, newBluff]
    };
    
    const newState: BluffTriviaState = {
      ...state,
      currentRound: newCurrentRound
    };
    
    return {
      newState,
      events: [
        { type: 'roomUpdate', data: newState, target: 'all' },
        { type: 'roomUpdate', data: { kind: 'bluff' }, target: 'player', playerId: action.playerId }
      ],
      isValid: true
    };
  }

  private handleSubmitVote(state: BluffTriviaState, action: BluffTriviaAction): GameResult<BluffTriviaState, BluffTriviaEvent> {
    if (state.phase !== PHASE_NAMES.CHOOSE || !state.currentRound) {
      return {
        newState: state,
        isValid: false,
        events: [],
        error: 'Cannot submit vote in current phase'
      };
    }
    
    const { choiceId } = action.data;
    
    if (!choiceId) {
      return {
        newState: state,
        isValid: false,
        events: [],
        error: 'Choice ID is required'
      };
    }
    
    // Check if player already voted
    if (state.currentRound.votes.some(v => v.voter === action.playerId)) {
      return {
        newState: state,
        isValid: false,
        events: [],
        error: 'Already voted'
      };
    }
    
    const newVote: Vote = { voter: action.playerId, choiceId };
    const newCurrentRound = {
      ...state.currentRound,
      votes: [...state.currentRound.votes, newVote]
    };
    
    const newState: BluffTriviaState = {
      ...state,
      currentRound: newCurrentRound
    };
    
    return {
      newState,
      events: [
        { type: 'roomUpdate', data: newState, target: 'all' },
        { type: 'roomUpdate', data: { kind: 'vote' }, target: 'player', playerId: action.playerId }
      ],
      isValid: true
    };
  }

  private generateNewRound(state: BluffTriviaState): RoundState {
    const pool = prompts.filter(p => !state.usedPromptIds.has(p.id));
    const prompt = pool[Math.floor(Math.random() * pool.length)];
    
    const newState = { ...state };
    newState.usedPromptIds.add(prompt.id);
    
    return {
      number: state.round,
      promptId: prompt.id,
      question: prompt.question,
      answer: prompt.answer,
      bluffs: [],
      votes: []
    };
  }

  // Game phase transition methods
  enterPromptPhase(state: BluffTriviaState): BluffTriviaEvent[] {
    const newRound = this.generateNewRound(state);
    const newState: BluffTriviaState = {
      ...state,
      phase: 'prompt',
      timeLeft: 15,
      currentRound: newRound
    };
    
    return [
      { type: 'roomUpdate', data: newState, target: 'all' },
      { type: 'prompt', data: { question: newRound.question }, target: 'all' }
    ];
  }

  enterChoosePhase(state: BluffTriviaState): BluffTriviaEvent[] {
    if (!state.currentRound) return [];
    
    const choices = this.generateChoices(state.currentRound);
    const newState: BluffTriviaState = {
      ...state,
      phase: 'choose',
      timeLeft: 20
    };
    
    return [
      { type: 'roomUpdate', data: newState, target: 'all' },
      { type: 'choices', data: { choices }, target: 'all' }
    ];
  }

  enterScoringPhase(state: BluffTriviaState): BluffTriviaEvent[] {
    if (!state.currentRound) return [];
    
    this.scoreRound(state);
    const newState: BluffTriviaState = {
      ...state,
      phase: 'scoring',
      timeLeft: 6
    };
    
    return [
      { type: 'roomUpdate', data: newState, target: 'all' },
      { type: 'scores', data: { totals: state.players.map(p => ({ playerId: p.id, score: p.score })) }, target: 'all' }
    ];
  }

  private generateChoices(round: RoundState): Array<{ id: string; text: string }> {
    const truth = { id: TRUE(round.promptId), text: round.answer };
    const bluffChoices = round.bluffs.map(b => ({ id: b.id, text: b.text }));
    return shuffle([truth, ...bluffChoices], round.number);
  }

  private scoreRound(state: BluffTriviaState): void {
    if (!state.currentRound) return;
    
    const round = state.currentRound;
    const fooledCount: Record<string, number> = {};
    
    for (const vote of round.votes) {
      if (vote.choiceId.startsWith('TRUE::')) {
        const player = state.players.find(p => p.id === vote.voter);
        if (player) player.score += 1000;
      } else {
        const bluff = round.bluffs.find(b => b.id === vote.choiceId);
        if (bluff) {
          fooledCount[bluff.by] = (fooledCount[bluff.by] || 0) + 1;
        }
      }
    }
    
    for (const playerId in fooledCount) {
      const player = state.players.find(p => p.id === playerId);
      if (player) player.score += fooledCount[playerId] * 500;
    }
  }
}
