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
  GamePhaseConfig,
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
  answers: Map<string, { playerId: string; text: string }>; // answerId -> { playerId, text }
  votes: Map<string, string>; // playerId -> answerId
  timeLeft: number;
  phase: 'prompt' | 'choose' | 'reveal' | 'scoring';
}

export interface FibbingItAction extends GameAction {
  type: 'start' | 'submitAnswer' | 'submitVote';
  data: any;
}

export interface FibbingItEvent extends GameEvent {
  type: 'prompt' | 'answers' | 'scores' | 'gameOver' | 'roomUpdate' | 'timer' | 'submitted' | 'allVoted' | 'reveal';
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
    
    console.log(`🔄 FibbingItNewEngine.advancePhase:`, {
      currentPhase: state.phase,
      currentIndex,
      totalPhases: config.phases.length,
      phases: config.phases.map(p => ({ name: p.name, duration: p.duration })),
      configId: config.id
    });
    
    if (currentIndex < config.phases.length - 1) {
      const nextPhase = config.phases[currentIndex + 1];
      console.log(`✅ Advancing to next phase: ${state.phase} → ${nextPhase.name}, duration: ${nextPhase.duration}s (${nextPhase.duration * 1000}ms)`);
      
      return {
        ...state,
        phase: nextPhase.name,
        timeLeft: nextPhase.duration * 1000,
        phaseStartTime: new Date(),
        updatedAt: new Date(),
      };
    }
    
    console.log(`⚠️ Cannot advance phase: already at last phase (${state.phase})`);
    return state;
  }

  getCurrentPhase(state: FibbingItGameState): GamePhaseConfig {
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

    if (currentPhase.allowedActions.includes('submitVote') && state.phase === 'choose') {
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
      case 'choose':
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
      case 'reveal':
        if (state.currentRound) {
          // Get the correct answer from the prompt
          const correctAnswer = this.getPromptById(state.currentRound.promptId).answer;
          
          // Generate reveal event with all the data needed for the frontend
          events.push({
            type: 'reveal',
            data: {
              question: state.currentRound.prompt,
              correctAnswer: correctAnswer.toLowerCase(), // Use lowercase for consistency
              choices: this.generateChoicesForReveal(state.currentRound),
              votes: Array.from(state.currentRound.votes.entries()).map(([voterId, choiceId]) => ({
                voter: voterId,
                choiceId,
              })),
            },
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
    const now = Date.now();
    
    console.log(`🚀 FibbingItNewEngine.handleStart: Starting game, current phase: ${state.phase}`);
    
    // Advance to the first phase (prompt)
    const newState = this.advancePhase(state);
    
    console.log(`🔄 After advancePhase: phase=${newState.phase}, timeLeft=${newState.timeLeft}ms`);
    
    // Get the prompt phase config for duration
    const promptPhase = this.getGameConfig().phases.find(p => p.name === 'prompt');
    const promptDuration = promptPhase ? promptPhase.duration * 1000 : 25000; // fallback to 25s
    
    console.log(`⚙️ Config: promptPhase=${promptPhase?.name}, duration=${promptPhase?.duration}s, promptDuration=${promptDuration}ms`);
    
    // Initialize the first round
    const promptId = this.selectRandomPrompt(newState.usedPromptIds);
    const prompt = this.getPromptById(promptId);
    
    const updatedState: FibbingItGameState = {
      ...newState,
      round: 1,
      timeLeft: promptDuration, // Read from config instead of hardcoded
      currentRound: {
        roundNumber: 1,
        promptId,
        prompt: prompt.question,
        answers: new Map<string, { playerId: string; text: string }>(),
        votes: new Map<string, string>(),
        timeLeft: promptDuration, // Read from config instead of hardcoded
        phase: 'prompt',
      },
      updatedAt: new Date(),
    };
    
    console.log(`✅ Final state: phase=${updatedState.phase}, timeLeft=${updatedState.timeLeft}ms, currentRound.timeLeft=${updatedState.currentRound?.timeLeft}ms`);
    
    return {
      newState: updatedState,
      events: [
        { type: 'roomUpdate', data: updatedState, target: 'all', timestamp: now },
        { type: 'prompt', data: { question: prompt.question }, target: 'all', timestamp: now },
      ],
      isValid: true,
    };
  }

  private handleSubmitAnswer(state: FibbingItGameState, action: FibbingItAction): GameResult<FibbingItGameState, FibbingItEvent> {
    const now = Date.now();
    
    // Validate that we're in the prompt phase
    if (state.phase !== 'prompt') {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: 'Can only submit answers during prompt phase',
      };
    }

    // Validate that the player hasn't already submitted
    if (state.currentRound?.answers.has(action.playerId)) {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: 'Player has already submitted an answer',
      };
    }

    // Validate that the answer exists in the action data
    const answer = action.data?.answer;
    if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: 'Answer is required and cannot be empty',
      };
    }

    // Create or update the current round
    let currentRound = state.currentRound;
    if (!currentRound) {
      // Initialize the round if it doesn't exist
      const promptId = this.selectRandomPrompt(state.usedPromptIds);
      const prompt = this.getPromptById(promptId);
      const promptPhase = this.getGameConfig().phases.find(p => p.name === 'prompt');
      const promptDuration = promptPhase ? promptPhase.duration * 1000 : 25000; // fallback to 25s
      
      currentRound = {
        roundNumber: state.round,
        promptId,
        prompt: prompt.question,
        answers: new Map(),
        votes: new Map(),
        timeLeft: promptDuration, // Read from config instead of hardcoded
        phase: 'prompt',
      };
    }

    // Add the player's answer with a unique ID
    const answerId = `answer_${action.playerId}`;
    const updatedAnswers = new Map(currentRound.answers);
    updatedAnswers.set(answerId, {
      playerId: action.playerId,
      text: answer.trim().toLowerCase(), // Convert to lowercase for consistent processing and comparison
    });

    // Create updated round
    const updatedRound = {
      ...currentRound,
      answers: updatedAnswers,
    };

    // Check if all players have submitted
    const allSubmitted = updatedAnswers.size === state.players.length;
    
    console.log(`📝 Answer submission: playerId=${action.playerId}, allSubmitted=${allSubmitted}, answersCount=${updatedAnswers.size}, totalPlayers=${state.players.length}`);
    
    let newState: FibbingItGameState;
    let events: FibbingItEvent[] = [
      {
        type: 'submitted',
        data: { kind: 'answer', answer: answer.trim().toLowerCase() },
        target: 'player',
        playerId: action.playerId,
        timestamp: now,
      },
    ];

    if (allSubmitted) {
      // All players submitted - advance to choose phase
      const choosePhase = this.getGameConfig().phases.find(p => p.name === 'choose');
      const chooseDuration = choosePhase ? choosePhase.duration * 1000 : 45000; // fallback to 45s
      
      console.log(`🎯 All players submitted answers, advancing to choose phase with ${chooseDuration}ms timer`);
      console.log(`📊 Current answers:`, Array.from(updatedAnswers.entries()));
      
      // Update the round to choose phase
      const chooseRound = {
        ...updatedRound,
        phase: 'choose' as const,
        timeLeft: chooseDuration,
      };
      
      // Advance the game state to choose phase
      newState = {
        ...state,
        phase: 'choose',
        timeLeft: chooseDuration,
        currentRound: chooseRound,
        updatedAt: new Date(),
      };
      
      console.log(`✅ New state: phase=${newState.phase}, timeLeft=${newState.timeLeft}ms`);
      
      // Add phase change event
      events.push({
        type: 'roomUpdate',
        data: newState,
        target: 'all',
        timestamp: now,
      });
      
      // Add answers event for voting
      events.push({
        type: 'answers',
        data: { 
          answers: Array.from(updatedAnswers.entries()).map(([answerId, answerData]) => ({
            answerId,
            playerId: answerData.playerId,
            text: answerData.text,
          }))
        },
        target: 'all',
        timestamp: now,
      });
    } else {
      // Not all players submitted yet - stay in prompt phase
      console.log(`⏳ Waiting for more answers: ${updatedAnswers.size}/${state.players.length} submitted`);
      newState = {
        ...state,
        currentRound: updatedRound,
        updatedAt: new Date(),
      };
    }

    return {
      newState,
      events,
      isValid: true,
    };
  }

  private handleSubmitVote(state: FibbingItGameState, action: FibbingItAction): GameResult<FibbingItGameState, FibbingItEvent> {
    const now = Date.now();
    
    // Validate that we're in the choose phase
    if (state.phase !== 'choose') {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: 'Can only submit votes during choose phase',
      };
    }

    // Validate that the current round exists
    if (!state.currentRound) {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: 'No active round for voting',
      };
    }

    // Validate that the player hasn't already voted
    if (state.currentRound.votes.has(action.playerId)) {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: 'Player has already voted',
      };
    }

    // Validate that the vote exists in the action data
    const vote = action.data?.vote;
    if (!vote || typeof vote !== 'string') {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: 'Vote is required',
      };
    }

        // Validate that the vote is for a valid answer (including correct answer)
    const answerIds = Array.from(state.currentRound.answers.keys());
    const correctAnswerId = `TRUE::${state.currentRound.promptId}`;
    const validVoteIds = [correctAnswerId, ...answerIds];
    
    if (!validVoteIds.includes(vote)) {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: 'Invalid vote: must vote for an existing answer or the correct answer',
      };
    }
    
    // Validate that the player isn't voting for their own answer
    const playerAnswer = state.currentRound.answers.get(action.playerId);
    if (playerAnswer && vote === action.playerId) {
      return {
        newState: state,
        events: [],
        isValid: false,
        error: 'Cannot vote for your own answer',
      };
    }
    
    // Allow voting for the correct answer (always valid)
    if (vote === correctAnswerId) {
      // This is always valid - voting for the correct answer
    }

    // Add the player's vote
    const updatedVotes = new Map(state.currentRound.votes);
    updatedVotes.set(action.playerId, vote);

    // Create updated round
    const updatedRound = {
      ...state.currentRound,
      votes: updatedVotes,
    };

    // Check if all players have voted
    const allVoted = updatedVotes.size === state.players.length;
    
    console.log(`🗳️ Vote submission: playerId=${action.playerId}, allVoted=${allVoted}, votesCount=${updatedVotes.size}, totalPlayers=${state.players.length}`);
    
    let newState: FibbingItGameState;
    let events: FibbingItEvent[] = [
      {
        type: 'submitted',
        data: { kind: 'vote', vote },
        target: 'player',
        playerId: action.playerId,
        timestamp: now,
      },
    ];

    if (allVoted) {
      // All players voted - advance to reveal phase
      const revealPhase = this.getGameConfig().phases.find(p => p.name === 'reveal');
      const revealDuration = revealPhase ? revealPhase.duration * 1000 : 15000; // fallback to 15s
      
      console.log(`🎯 All players voted, advancing to reveal phase with ${revealDuration}ms timer`);
      console.log(`📊 Current votes:`, Array.from(updatedVotes.entries()));
      
      // Update the round to reveal phase
      const revealRound = {
        ...updatedRound,
        phase: 'reveal' as const,
        timeLeft: revealDuration,
      };
      
      // Advance the game state to reveal phase
      newState = {
        ...state,
        phase: 'reveal',
        timeLeft: revealDuration,
        currentRound: revealRound,
        updatedAt: new Date(),
      };
      
      console.log(`✅ New state: phase=${newState.phase}, timeLeft=${newState.timeLeft}ms`);
      
      // Add phase change event
      events.push({
        type: 'roomUpdate',
        data: newState,
        target: 'all',
        timestamp: now,
      });
      
      // Add all voted event
      events.push({
        type: 'allVoted',
        data: { 
          votes: Array.from(updatedVotes.entries()).map(([playerId, voteId]) => ({
            playerId,
            voteId,
          }))
        },
        target: 'all',
        timestamp: now,
      });
    } else {
      // Not all players voted yet - stay in choose phase
      console.log(`⏳ Waiting for more votes: ${updatedVotes.size}/${state.players.length} submitted`);
      newState = {
        ...state,
        currentRound: updatedRound,
        updatedAt: new Date(),
      };
    }

    return {
      newState,
      events,
      isValid: true,
    };
  }

  /**
   * Generate choices for the reveal phase
   */
  private generateChoicesForReveal(round: FibbingItRound): Array<{ id: string; text: string; by: string }> {
    // Get the correct answer from the prompt
    const correctAnswer = this.getPromptById(round.promptId).answer.toLowerCase();
    
    // Create truth choice
    const truth = {
      id: `TRUE::${round.promptId}`,
      text: correctAnswer,
      by: 'system',
    };

    // Convert player answers to choices
    const playerChoices = Array.from(round.answers.entries()).map((entry) => ({
      id: entry[0],
      text: entry[1].text, // Already in lowercase from input phase
      by: entry[1].playerId,
    }));

    // Combine and sort: truth first, then player answers
    const allChoices = [truth, ...playerChoices];
    
    // Sort by ID to ensure consistent order
    allChoices.sort((a, b) => {
      if (a.id.startsWith('TRUE::')) return -1;
      if (b.id.startsWith('TRUE::')) return 1;
      return a.by.localeCompare(b.by);
    });

    return allChoices;
  }

  // Helper methods for prompt management
  private selectRandomPrompt(usedPromptIds: Set<string>): string {
    const availablePrompts = prompts.filter(p => !usedPromptIds.has(p.id));
    if (availablePrompts.length === 0) {
      // If all prompts used, reset the used set
      usedPromptIds.clear();
      return prompts[0].id;
    }
    const randomIndex = Math.floor(Math.random() * availablePrompts.length);
    return availablePrompts[randomIndex].id;
  }

  private getPromptById(promptId: string): { question: string; answer: string } {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) {
      throw new Error(`Prompt with id ${promptId} not found`);
    }
    return prompt;
  }

  // Round management methods
  startNewRound(state: FibbingItGameState): FibbingItGameState {
    const nextRound = state.round + 1;
    
    if (nextRound > state.maxRounds) {
      // Game is over
      return {
        ...state,
        phase: 'game-over',
        round: nextRound,
        updatedAt: new Date(),
      };
    }

    // Select a new prompt for the next round
    const promptId = this.selectRandomPrompt(state.usedPromptIds);
    const prompt = this.getPromptById(promptId);
    
    // Get the prompt phase config for duration
    const promptPhase = this.getGameConfig().phases.find(p => p.name === 'prompt');
    const promptDuration = promptPhase ? promptPhase.duration * 1000 : 25000; // fallback to 25s
    
    // Add the prompt to used set
    const updatedUsedPromptIds = new Set(state.usedPromptIds);
    updatedUsedPromptIds.add(promptId);

    return {
      ...state,
      round: nextRound,
      phase: 'prompt',
      timeLeft: promptDuration, // Read from config instead of hardcoded
      phaseStartTime: new Date(),
      updatedAt: new Date(),
      usedPromptIds: updatedUsedPromptIds,
      currentRound: {
        roundNumber: nextRound,
        promptId,
        prompt: prompt.question,
        answers: new Map<string, { playerId: string; text: string }>(),
        votes: new Map<string, string>(),
        timeLeft: promptDuration, // Read from config instead of hardcoded
        phase: 'prompt',
      },
      isRoundComplete: false,
    };
  }

  calculateScores(state: FibbingItGameState): FibbingItGameState {
    if (!state.currentRound) return state;

    const { answers, votes } = state.currentRound;
    const correctAnswer = this.getPromptById(state.currentRound.promptId).answer;
    
    // Calculate scores for this round
    const roundScores = new Map<string, number>();
    
    // Players get points for correct answers (case-insensitive comparison)
    for (const [answerId, answerData] of answers.entries()) {
      if (answerData.text === correctAnswer.toLowerCase()) {
        roundScores.set(answerData.playerId, 1000); // Base points for correct answer
      }
    }
    
    // Players get points for votes received
    for (const [voterId, votedForAnswerId] of votes.entries()) {
      const votedAnswer = answers.get(votedForAnswerId);
      if (votedAnswer) {
        const currentScore = roundScores.get(votedAnswer.playerId) || 0;
        roundScores.set(votedAnswer.playerId, currentScore + 500); // Points for each vote received
      }
    }
    
    // Update player scores
    const updatedPlayers = state.players.map(player => {
      const roundScore = roundScores.get(player.id) || 0;
      return {
        ...player,
        score: player.score + roundScore,
      };
    });

    // Update overall scores
    const updatedScores = { ...state.scores };
    for (const [playerId, score] of roundScores.entries()) {
      updatedScores[playerId] = (updatedScores[playerId] || 0) + score;
    }

    return {
      ...state,
      players: updatedPlayers,
      scores: updatedScores,
      updatedAt: new Date(),
    };
  }

  isRoundComplete(state: FibbingItGameState): boolean {
    if (!state.currentRound) return false;
    
    // Round is complete when all players have submitted answers and votes
    const allAnswersSubmitted = state.currentRound.answers.size === state.players.length;
    const allVotesSubmitted = state.currentRound.votes.size === state.players.length;
    
    return allAnswersSubmitted && allVotesSubmitted;
  }
}
