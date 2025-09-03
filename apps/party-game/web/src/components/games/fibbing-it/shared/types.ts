// Shared types for Fibbing It game components
export type Option = {
  id: string;
  text: string;
  color: string;
  playerId?: string;
  playerAvatar?: string;
};

export type Vote = {
  voter: string;
  choiceId: string;
};

export type Player = {
  id: string;
  name: string;
  avatar?: string;
  score: number;
};

export type ComponentState = 'waiting' | 'input' | 'options' | 'reveal' | 'scoring' | 'game-over';
