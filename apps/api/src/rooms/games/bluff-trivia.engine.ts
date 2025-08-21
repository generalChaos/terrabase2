import { Injectable } from '@nestjs/common';
import { GameEngine, GameAction, GameEvent, GameResult, GamePhase, BaseGameState, Player } from '../game-engine.interface';
import { GameConfig } from '../../config/game.config';
import { prompts } from '../prompts.seed';
import { TRUE, uid, shuffle } from '../utils';
import { GAME_PHASE_DURATIONS, GAME_CONFIG, PHASE_NAMES } from '../constants';

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
  isCorrect?: boolean; // Optional flag for correct answers
}

export interface BluffTriviaAction extends GameAction {
  type: 'join' | 'start' | 'submitAnswer' | 'submitVote';
  data: any;
}

export interface BluffTriviaEvent extends GameEvent {
  type: 'prompt' | 'choices' | 'scores' | 'gameOver' | 'roomUpdate' | 'timer' | 'submitted';
  data: any;
}

export class BluffTriviaEngine implements GameEngine<BluffTriviaState, BluffTriviaAction, BluffTriviaEvent> {
  private phases: GamePhase[] = [
    { name: PHASE_NAMES.LOBBY, duration: 0, allowedActions: ['join', 'start'] },
    { name: PHASE_NAMES.PROMPT, duration: GAME_PHASE_DURATIONS.PROMPT, allowedActions: ['submitAnswer'] },
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
    // Handle phase transitions based on current phase
    switch (state.phase) {
      case 'lobby':
        // Lobby → Prompt (start first round)
        return {
          ...state,
          phase: PHASE_NAMES.PROMPT,
          round: 1,
          timeLeft: GAME_PHASE_DURATIONS.PROMPT,
          currentRound: this.initializeRound(state.players, 1)
        };
        
      case 'prompt':
        // Prompt → Choose
        if (state.currentRound) {
          return {
            ...state,
            phase: PHASE_NAMES.CHOOSE,
            timeLeft: GAME_PHASE_DURATIONS.CHOOSE,
            currentRound: {
              ...state.currentRound,
              phase: 'choose',
              timeLeft: GAME_PHASE_DURATIONS.CHOOSE
            }
          };
        }
        break;
        
      case 'choose':
        // Choose → Scoring
        if (state.currentRound) {
          return {
            ...state,
            phase: PHASE_NAMES.SCORING,
            timeLeft: GAME_PHASE_DURATIONS.SCORING,
            currentRound: {
              ...state.currentRound,
              phase: 'scoring',
              timeLeft: GAME_PHASE_DURATIONS.SCORING
            }
          };
        }
        break;
        
      case 'scoring':
        // Scoring → Next Round or Game Over
        if (state.round < state.maxRounds) {
          // Start next round
          const nextRound = state.round + 1;
          return {
            ...state,
            phase: PHASE_NAMES.PROMPT,
            round: nextRound,
            timeLeft: GAME_PHASE_DURATIONS.PROMPT,
            currentRound: this.initializeRound(state.players, nextRound)
          };
        } else {
          // Game is over
          return {
            ...state,
            phase: 'over',
            timeLeft: 0
          };
        }
        
      case 'over':
        // Game is already over
        return state;
        
      default:
        console.warn(`Unknown phase: ${state.phase}`);
        return state;
    }
    
    // Fallback - shouldn't reach here
    console.error(`Failed to advance phase from ${state.phase}`);
    return state;
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
            data: { question: state.currentRound.prompt }, 
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
      currentRound: this.initializeRound(state.players, 1)
    };
    
    return {
      newState,
      events: [
        { type: 'roomUpdate', data: newState, target: 'all' },
        { type: 'prompt', data: { question: newState.currentRound!.prompt }, target: 'all' }
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
    
    // Check if this is the correct answer
    const isCorrectAnswer = text.toLowerCase() === state.currentRound.answer.toLowerCase();
    
    if (isCorrectAnswer) {
      // Player got the answer right - award points and track submission
      const player = state.players.find(p => p.id === action.playerId);
      if (player) {
        const newPlayers = state.players.map(p => 
          p.id === action.playerId 
            ? { ...p, score: p.score + GameConfig.RULES.SCORING.CORRECT_ANSWER }
            : p
        );
        
        // Create a special "correct answer" entry that doesn't get mixed with bluffs
        const correctAnswerEntry: Bluff = { 
          id: `CORRECT::${action.playerId}`, 
          by: action.playerId, 
          text: text,
          isCorrect: true // Mark this as a correct answer
        };
        
        const newCurrentRound = {
          ...state.currentRound,
          bluffs: [...state.currentRound.bluffs, correctAnswerEntry],
          correctAnswerPlayers: new Set([...state.currentRound.correctAnswerPlayers, action.playerId])
        };
        
        const newState: BluffTriviaState = {
          ...state,
          players: newPlayers,
          currentRound: newCurrentRound
        };
        
        return {
          newState,
          events: [
            { type: 'roomUpdate', data: newState, target: 'all' },
            { type: 'submitted', data: { kind: 'correct_answer' }, target: 'player', playerId: action.playerId }
          ],
          isValid: true
        };
      } else {
        // Player not found - this shouldn't happen but handle gracefully
        return {
          newState: state,
          isValid: false,
          events: [],
          error: 'Player not found'
        };
      }
    }
    
    // This is a bluff - add it to the bluffs array
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
        { type: 'submitted', data: { kind: 'bluff' }, target: 'player', playerId: action.playerId }
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
    if (state.currentRound.votes.has(action.playerId)) {
      return {
        newState: state,
        isValid: false,
        events: [],
        error: 'Already voted'
      };
    }
    
    // Check if player got the answer correct - they can't vote
    if (state.currentRound.correctAnswerPlayers.has(action.playerId)) {
      return {
        newState: state,
        isValid: false,
        events: [],
        error: 'You already know the correct answer - you cannot vote!'
      };
    }
    
    // Check if player is trying to vote for their own bluff
    const playerBluff = state.currentRound.bluffs.find(b => b.by === action.playerId);
    if (playerBluff && action.choiceId === playerBluff.id) {
      return {
        newState: state,
        isValid: false,
        events: [],
        error: 'Cannot vote for your own bluff'
      };
    }
    
    const newVote: Map<string, string> = new Map(state.currentRound.votes);
    newVote.set(action.playerId, choiceId);
    
    const newCurrentRound = {
      ...state.currentRound,
      votes: newVote
    };
    
    const newState: BluffTriviaState = {
      ...state,
      currentRound: newCurrentRound
    };
    
    return {
      newState,
      events: [
        { type: 'roomUpdate', data: newState, target: 'all' },
        { type: 'submitted', data: { kind: 'vote' }, target: 'player', playerId: action.playerId }
      ],
      isValid: true
    };
  }

  private initializeRound(players: Player[], roundNumber: number): BluffTriviaRound {
    const prompt = this.getRandomPrompt();
    
    return {
      roundNumber,
      promptId: prompt.id,
      prompt: prompt.question,
      answer: prompt.answer,
      bluffs: [],
      votes: new Map(),
      correctAnswerPlayers: new Set(),
      timeLeft: GameConfig.TIMING.PHASES.PROMPT,
      phase: 'prompt' as const
    };
  }

  private advanceToChoosePhase(round: BluffTriviaRound): BluffTriviaRound {
    return {
      ...round,
      phase: 'choose',
      timeLeft: GameConfig.TIMING.PHASES.CHOOSE
    };
  }

  private advanceToScoringPhase(round: BluffTriviaRound): BluffTriviaRound {
    return {
      ...round,
      phase: 'scoring',
      timeLeft: GameConfig.TIMING.PHASES.SCORING
    };
  }

  private generateNewRound(state: BluffTriviaState): BluffTriviaRound {
    const pool = prompts.filter(p => !state.usedPromptIds.has(p.id));
    const prompt = pool[Math.floor(Math.random() * pool.length)];
    
    const newState = { ...state };
    newState.usedPromptIds.add(prompt.id);
    
    return {
      roundNumber: state.round,
      promptId: prompt.id,
      prompt: prompt.question,
      answer: prompt.answer,
      bluffs: [],
      votes: new Map(),
      correctAnswerPlayers: new Set(),
      timeLeft: GameConfig.TIMING.PHASES.PROMPT,
      phase: 'prompt' as const
    };
  }

  // Game phase transition methods
  enterPromptPhase(state: BluffTriviaState): BluffTriviaEvent[] {
    const newRound = this.generateNewRound(state);
    const newState: BluffTriviaState = {
      ...state,
      phase: 'prompt',
      timeLeft: GameConfig.TIMING.PHASES.PROMPT,
      currentRound: newRound
    };
    
    return [
      { type: 'roomUpdate', data: newState, target: 'all' },
      { type: 'prompt', data: { question: newRound.prompt }, target: 'all' }
    ];
  }

  enterChoosePhase(state: BluffTriviaState): BluffTriviaEvent[] {
    if (!state.currentRound) return [];
    
    const choices = this.generateChoices(state.currentRound);
    const newState: BluffTriviaState = {
      ...state,
      phase: 'choose',
      timeLeft: GameConfig.TIMING.PHASES.CHOOSE
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
      timeLeft: GameConfig.TIMING.PHASES.SCORING
    };
    
    return [
      { type: 'roomUpdate', data: newState, target: 'all' },
      { type: 'scores', data: { scores: state.players.map(p => ({ id: p.id, name: p.name, score: p.score })) }, target: 'all' }
    ];
  }

  private generateChoices(round: BluffTriviaRound): Array<{ id: string; text: string }> {
    // Start with the truth - normalize text to prevent capitalization hints
    const choices = [{ id: TRUE(round.promptId), text: this.normalizeText(round.answer) }];
    
    // Add all bluffs, but skip duplicates of the correct answer
    for (const bluff of round.bluffs) {
      // If this is a correct answer submission, skip it to avoid duplication
      if (bluff.isCorrect) {
        continue;
      }
      // If this bluff text matches the correct answer, skip it
      if (bluff.text.toLowerCase() === round.answer.toLowerCase()) {
        continue;
      }
      // Normalize bluff text as well
      choices.push({ id: bluff.id, text: this.normalizeText(bluff.text) });
    }
    
    return shuffle(choices, round.roundNumber);
  }
  
  private normalizeText(text: string): string {
    // Convert to lowercase and trim, but preserve some readability
    return text.toLowerCase().trim();
  }

  private getRandomPrompt() {
    // Use a static method since we don't have instance state
    const pool = prompts.filter(p => true); // For now, just get any prompt
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private scoreRound(state: BluffTriviaState): void {
    if (!state.currentRound) return;
    
    const round = state.currentRound;
    const fooledCount: Record<string, number> = {};
    
    for (const [playerId, choiceId] of round.votes) {
      if (choiceId.startsWith('TRUE::')) {
        const player = state.players.find(p => p.id === playerId);
        if (player) player.score += GameConfig.RULES.SCORING.CORRECT_ANSWER;
      } else {
        const bluff = round.bluffs.find(b => b.id === choiceId);
        if (bluff) {
          fooledCount[bluff.by] = (fooledCount[bluff.by] || 0) + 1;
        }
      }
    }
    
    // Award bluff points
    for (const [playerId, count] of Object.entries(fooledCount)) {
      const player = state.players.find(p => p.id === playerId);
      if (player) player.score += count * GameConfig.RULES.SCORING.BLUFF_POINTS;
    }
  }

  private calculateScores(players: Player[], round: BluffTriviaRound): Player[] {
    const updatedPlayers = [...players];
    
    // Award points for correct answers
    for (const [playerId, vote] of round.votes) {
      if (vote === `TRUE::${round.promptId}`) {
        const player = updatedPlayers.find(p => p.id === playerId);
        if (player) player.score += GameConfig.RULES.SCORING.CORRECT_ANSWER;
      }
    }
    
    // Award points for successful bluffs
    const fooledCount = new Map<string, number>();
    for (const [playerId, vote] of round.votes) {
      if (vote !== `TRUE::${round.promptId}`) {
        const bluffId = vote;
        const bluff = round.bluffs.find(b => b.id === bluffId);
        if (bluff) {
          const currentCount = fooledCount.get(bluff.by) || 0;
          fooledCount.set(bluff.by, currentCount + 1);
        }
      }
    }
    
    // Award bluff points
    for (const [playerId, count] of fooledCount) {
      const player = updatedPlayers.find(p => p.id === playerId);
      if (player) player.score += count * GameConfig.RULES.SCORING.BLUFF_POINTS;
    }
    
    return updatedPlayers;
  }
}
