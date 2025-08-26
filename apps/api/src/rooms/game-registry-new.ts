import { GameEngine } from '@party/types';
import { BluffTriviaNewEngine } from './games/bluff-trivia-new.engine';
import { FibbingItNewEngine } from './games/fibbing-it-new.engine';

export class GameRegistryNew {
  private engines = new Map<string, GameEngine<any, any, any>>();

  constructor() {
    this.register('bluff-trivia', new BluffTriviaNewEngine());
    this.register('fibbing-it', new FibbingItNewEngine());
    // Temporarily disabled due to type issues
    // this.register('word-association', new WordAssociationNewEngine());
  }

  register(gameType: string, engine: GameEngine<any, any, any>): void {
    this.engines.set(gameType, engine);
  }

  getEngine(gameType: string): GameEngine<any, any, any> | undefined {
    return this.engines.get(gameType);
  }

  getAvailableGames(): string[] {
    return Array.from(this.engines.keys());
  }

  hasGame(gameType: string): boolean {
    return this.engines.has(gameType);
  }
}
