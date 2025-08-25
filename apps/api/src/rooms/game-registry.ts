import { Injectable } from '@nestjs/common';
import { GameEngine, GameAction, GameEvent } from '@party/types';
import { BluffTriviaNewEngine } from './games/bluff-trivia-new.engine';
import { FibbingItNewEngine } from './games/fibbing-it-new.engine';
import { WordAssociationNewEngine } from './games/word-association-new.engine';
import { GAME_TYPES } from './constants';

@Injectable()
export class GameRegistry {
  private games = new Map<string, GameEngine<any, any, any>>();

  constructor() {
    // Register all available game engines
    this.register(GAME_TYPES.BLUFF_TRIVIA, new BluffTriviaNewEngine());
    this.register(GAME_TYPES.FIBBING_IT, new FibbingItNewEngine());
    this.register(GAME_TYPES.WORD_ASSOCIATION, new WordAssociationNewEngine());
  }

  register(gameType: string, engine: GameEngine<any, any, any>): void {
    this.games.set(gameType, engine);
    console.log(`🎮 Registered game type: ${gameType}`);
  }

  getGame(gameType: string): GameEngine<any, any, any> | undefined {
    return this.games.get(gameType);
  }

  listGames(): string[] {
    return Array.from(this.games.keys());
  }

  hasGame(gameType: string): boolean {
    return this.games.has(gameType);
  }

  getDefaultGame(): string {
    return GAME_TYPES.BLUFF_TRIVIA;
  }
}
