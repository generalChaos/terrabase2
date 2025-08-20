import { Injectable } from '@nestjs/common';
import { GameEngine, GameAction, GameEvent } from './game-engine.interface';
import { BluffTriviaEngine } from './games/bluff-trivia.engine';
import { GAME_TYPES } from './constants';

@Injectable()
export class GameRegistry {
  private games = new Map<string, GameEngine<any, any, any>>();
  
  constructor() {
    // Register the default BluffTrivia game
    this.register(GAME_TYPES.BLUFF_TRIVIA, new BluffTriviaEngine());
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
