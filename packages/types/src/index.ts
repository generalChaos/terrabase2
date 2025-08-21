export type Phase = 'lobby' | 'prompt' | 'choose' | 'scoring' | 'over';

export type Player = {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  connected: boolean;
};

export type Bluff = {
  id: string;
  by: string;
  text: string;
};

export type Vote = {
  voter: string;
  choiceId: string;
};

export type Choice = {
  id: string;
  by: string;
  text: string;
};

export type RoundState = {
  roundNumber: number;
  promptId: string;
  prompt: string;
  answer: string;
  bluffs: Bluff[];
  votes: Vote[];
  timeLeft: number;
  phase: string;
};

export type RoomState = {
  code: string;
  phase: Phase;
  round: number;
  maxRounds: number;
  timeLeft: number;
  players: Player[];
  current?: RoundState;
  hostId?: string;
  usedPromptIds: Set<string>;
  timer?: NodeJS.Timeout;
};

// Game configuration
export const DUR = {
  PROMPT: 15, // seconds to submit bluff
  CHOOSE: 20, // seconds to vote
  SCORING: 6, // reveal + tally
} as const;

// Socket event types
export type JoinRoomData = {
  nickname: string;
  avatar?: string;
};

export type SubmitAnswerData = {
  answer: string;
};

export type SubmitVoteData = {
  choiceId: string;
};

export type ScoreData = {
  totals: Array<{
    playerId: string;
    score: number;
  }>;
};

export type GameAction = 
  | { type: 'startGame' }
  | { type: 'submitAnswer'; data: SubmitAnswerData }
  | { type: 'submitVote'; data: SubmitVoteData };

// Socket event names
export type SocketEvent = 
  | 'join'
  | 'startGame'
  | 'submitAnswer'
  | 'submitVote'
  | 'vote'
  | 'room'
  | 'timer'
  | 'prompt'
  | 'choices'
  | 'scores'
  | 'gameOver'
  | 'submitted'
  | 'error'
  | 'joined'
  | 'connect_error';

// API response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Game configuration types
export type GameConfig = {
  maxRounds: number;
  promptTimeLimit: number;
  votingTimeLimit: number;
  scoringTimeLimit: number;
};
