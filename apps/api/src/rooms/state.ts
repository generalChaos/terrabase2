export type Phase = 'lobby' | 'prompt' | 'choose' | 'scoring' | 'over';

export type Player = {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  connected: boolean;
};
export type Bluff = { id: string; by: string; text: string };
export type Vote = { voter: string; choiceId: string }; // 'TRUE::<promptId>' or bluffId

export type RoundState = {
  number: number;
  promptId: string;
  question: string;
  answer: string;
  bluffs: Bluff[];
  votes: Vote[];
};

export type Room = {
  code: string;
  phase: Phase;
  round: number;
  maxRounds: number;
  timeLeft: number;
  players: Player[];
  current?: RoundState;
  usedPromptIds: Set<string>;
  timer?: NodeJS.Timeout;
};
