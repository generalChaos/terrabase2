import { Injectable } from '@nestjs/common';
import { GameEngine, GameAction, GameEvent } from './game-engine.interface';
import { BluffTriviaEngine } from './games/bluff-trivia.engine';
import { FibbingItEngine } from './games/fibbing-it.engine';
import { WordAssociationEngine } from './games/word-association.engine';
import { GAME_TYPES } from './constants';

@Injectable()
export class GameRegistry {
  private games = new Map<string, GameEngine<any, any, any>>();
  
  constructor() {
    // Register all available game engines
    this.register(GAME_TYPES.BLUFF_TRIVIA, new BluffTriviaEngine());
    this.register(GAME_TYPES.FIBBING_IT, new FibbingItEngine());
    this.register(GAME_TYPES.WORD_ASSOCIATION, new WordAssociationEngine());
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
