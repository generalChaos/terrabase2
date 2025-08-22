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
  correctAnswerPlayers?: string[]; // Array of player IDs who got the answer correct
  timeLeft: number;
  phase: string;
};

export type RoomState = {
  code: string;
  gameType: string;
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

// Game theming
export interface GameTheme {
  primary: string;      // Main background color (e.g., 'bg-purple-600')
  accent: string;       // Accent/button colors (e.g., 'bg-purple-400')
  background: string;   // Background pattern/style (e.g., 'bg-purple-800')
  icon: string;         // Game icon (e.g., '🎭')
  name: string;         // Game display name (e.g., 'Fibbing It!')
}

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
