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
    switch (action.type) {
      case 'start':
        if (state.phase !== 'lobby') {
          return {
            newState: state,
            events: [],
            isValid: false,
            error: 'Game can only be started from lobby phase',
          };
        }
        
        // Transition to prompt phase and set up the first round
        const newState: FibbingItGameState = {
          ...state,
          phase: 'prompt',
          round: 1,
          timeLeft: this.getPhaseDuration('prompt') * 1000, // Convert to milliseconds
          currentPrompt: this.getRandomPrompt(),
        };
        
        return {
          newState,
          events: [
            {
              type: 'phaseChanged',
              data: { 
                phase: 'prompt', 
                round: 1,
                timeLeft: newState.timeLeft,
                prompt: newState.currentPrompt 
              },
              target: 'all',
            },
            {
              type: 'prompt',
              data: { 
                question: newState.currentPrompt,
                round: 1,
                timeLeft: newState.timeLeft 
              },
              target: 'all',
            },
          ],
          isValid: true,
        };
        
      case 'submitAnswer':
        if (state.phase !== 'prompt') {
          return {
            newState: state,
            events: [],
            isValid: false,
            error: 'Answers can only be submitted during prompt phase',
          };
        }
        
        // Add the answer to the state
        const answers = state.answers || [];
        const newAnswer = {
          id: `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: action.data.answer,
          playerId: action.playerId,
          isTruth: false, // Will be determined later
        };
        
        const updatedState = {
          ...state,
          answers: [...answers, newAnswer],
        };
        
        return {
          newState: updatedState,
          events: [
            {
              type: 'answerSubmitted',
              data: { 
                answerId: newAnswer.id,
                playerId: action.playerId 
              },
              target: 'all',
            },
          ],
          isValid: true,
        };
        
      case 'submitVote':
        if (state.phase !== 'voting') {
          return {
            newState: state,
            events: [],
            isValid: false,
            error: 'Votes can only be submitted during voting phase',
          };
        }
        
        // Add the vote to the state
        const votes = state.votes || [];
        const newVote = {
          playerId: action.playerId,
          answerId: action.data.choiceId,
        };
        
        const votedState = {
          ...state,
          votes: [...votes, newVote],
        };
        
        return {
          newState: votedState,
          events: [
            {
              type: 'voteSubmitted',
              data: { 
                voteId: newVote.answerId,
                playerId: action.playerId 
              },
              target: 'all',
            },
          ],
          isValid: true,
        };
        
      default:
        return {
          newState: state,
          events: [],
          isValid: false,
          error: `Unknown action type: ${action.type}`,
        };
    }
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

  /**
   * Get a random prompt for the game
   */
  private getRandomPrompt(): string {
    const prompts = [
      "What's the most embarrassing thing that happened to you in school?",
      "What's the weirdest food combination you actually enjoy?",
      "What's the most ridiculous thing you've ever done to avoid doing something else?",
      "What's the strangest dream you've ever had?",
      "What's the most embarrassing thing you've ever said to someone?",
      "What's the weirdest thing you've ever eaten?",
      "What's the most ridiculous thing you've ever bought?",
      "What's the strangest thing you've ever done to impress someone?",
      "What's the most embarrassing thing that happened to you at work?",
      "What's the weirdest thing you've ever done to stay awake?",
    ];
    
    return prompts[Math.floor(Math.random() * prompts.length)];
  }
}
