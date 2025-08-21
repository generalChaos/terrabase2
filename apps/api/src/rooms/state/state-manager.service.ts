import { Injectable, Logger } from '@nestjs/common';
import { GameRegistry } from '../game-registry';
import { Player, GameAction, GameEvent } from '../game-engine.interface';
import { GAME_TYPES } from '../constants';
import { ImmutableRoomState, RoomState } from './room.state';
import { RoomNotFoundError, PlayerNotFoundError } from '../errors';

@Injectable()
export class StateManagerService {
  private readonly logger = new Logger(StateManagerService.name);
  private readonly rooms = new Map<string, ImmutableRoomState>();
  private readonly stateLocks = new Map<string, Promise<void>>();

  constructor(private readonly gameRegistry: GameRegistry) {}

  /**
   * Create a new room with immutable state
   */
  createRoom(code: string, gameType: string = GAME_TYPES.BLUFF_TRIVIA): ImmutableRoomState {
    if (!this.gameRegistry.hasGame(gameType)) {
      throw new Error(`Unknown game type: ${gameType}`);
    }

    const engine = this.gameRegistry.getGame(gameType)!;
    const gameState = engine.initialize([]);
    
    const roomState = ImmutableRoomState.create(code, gameType, gameState);
    this.rooms.set(code, roomState);
    
    this.logger.log(`🏠 Created room ${code} with game type ${gameType}`);
    return roomState;
  }

  /**
   * Get room state safely (returns undefined if not found)
   */
  getRoomSafe(code: string): ImmutableRoomState | undefined {
    return this.rooms.get(code);
  }

  /**
   * Get room state (throws if not found)
   */
  getRoom(code: string): ImmutableRoomState {
    const room = this.rooms.get(code);
    if (!room) {
      throw new RoomNotFoundError(code);
    }
    return room;
  }

  /**
   * Check if room exists
   */
  hasRoom(code: string): boolean {
    return this.rooms.has(code);
  }

  /**
   * Add player to room with immutable state update
   */
  async addPlayer(roomCode: string, player: Player): Promise<ImmutableRoomState> {
    return this.withStateLock(roomCode, async () => {
      const currentState = this.getRoom(roomCode);
      
      // Check if player name is already taken
      if (currentState.players.some(p => p.name === player.name)) {
        throw new Error(`Player name "${player.name}" is already taken`);
      }

      // Create new state with player added
      const newState = currentState.withPlayerAdded(player);
      
      // Update game state without losing progress
      const engine = this.gameRegistry.getGame(currentState.gameType);
      if (engine) {
        // Only initialize if this is the first player, otherwise preserve game state
        if (currentState.players.length === 0) {
          const newGameState = engine.initialize(newState.players);
          const finalState = newState.withGameStateUpdated(newGameState);
          this.rooms.set(roomCode, finalState);
          return finalState;
        } else {
          // Preserve existing game state, just update player list
          this.rooms.set(roomCode, newState);
          return newState;
        }
      }

      this.rooms.set(roomCode, newState);
      return newState;
    });
  }

  /**
   * Remove player from room with immutable state update
   */
  async removePlayer(roomCode: string, playerId: string): Promise<ImmutableRoomState | null> {
    return this.withStateLock(roomCode, async () => {
      const currentState = this.getRoom(roomCode);
      
      if (!currentState.hasPlayer(playerId)) {
        return null;
      }

      // Create new state with player removed
      const newState = currentState.withPlayerRemoved(playerId);
      
      // If room is empty, delete it
      if (newState.isEmpty()) {
        this.rooms.delete(roomCode);
        this.logger.log(`🏠 Room ${roomCode} is empty, deleted`);
        return null;
      }

      // Update game state for remaining players
      const engine = this.gameRegistry.getGame(currentState.gameType);
      if (engine) {
        const newGameState = engine.initialize(newState.players);
        const finalState = newState.withGameStateUpdated(newGameState);
        this.rooms.set(roomCode, finalState);
        return finalState;
      }

      this.rooms.set(roomCode, newState);
      return newState;
    });
  }

  /**
   * Update player connection status
   */
  async updatePlayerConnection(roomCode: string, playerId: string, connected: boolean): Promise<ImmutableRoomState> {
    return this.withStateLock(roomCode, async () => {
      const currentState = this.getRoom(roomCode);
      
      if (!currentState.hasPlayer(playerId)) {
        throw new PlayerNotFoundError(playerId, roomCode);
      }

      const newState = currentState.withPlayerUpdated(playerId, { connected });
      this.rooms.set(roomCode, newState);
      return newState;
    });
  }

  /**
   * Update player socket ID (for reconnections)
   */
  async updatePlayerSocketId(roomCode: string, playerId: string, newSocketId: string): Promise<ImmutableRoomState> {
    return this.withStateLock(roomCode, async () => {
      const currentState = this.getRoom(roomCode);
      
      if (!currentState.hasPlayer(playerId)) {
        throw new PlayerNotFoundError(playerId, roomCode);
      }

      const newState = currentState.withPlayerUpdated(playerId, { id: newSocketId });
      
      // If this was the host, update hostId
      let finalState = newState;
      if (currentState.isHost(playerId)) {
        finalState = new ImmutableRoomState(
          newState.code,
          newState.gameType,
          newState.gameState,
          newState.players,
          newState.phase,
          newSocketId,
          newState.lastActivity,
          newState.version + 1
        );
      }

      this.rooms.set(roomCode, finalState);
      return finalState;
    });
  }

  /**
   * Process game action with immutable state update
   */
  async processGameAction(roomCode: string, playerId: string, action: GameAction): Promise<GameEvent[]> {
    return this.withStateLock(roomCode, async () => {
      const currentState = this.getRoom(roomCode);
      
      if (!currentState.hasPlayer(playerId)) {
        throw new PlayerNotFoundError(playerId, roomCode);
      }

      const engine = this.gameRegistry.getGame(currentState.gameType);
      if (!engine) {
        throw new Error(`Game engine not found for type: ${currentState.gameType}`);
      }

      const result = engine.processAction(currentState.gameState, action);
      
      if (result.isValid) {
        const newState = currentState
          .withGameStateUpdated(result.newState)
          .withPhaseUpdated(result.newState.phase)
          .withActivityUpdated();
        
        this.rooms.set(roomCode, newState);
        return result.events;
      } else {
        return [{ 
          type: 'error', 
          data: { error: result.error }, 
          target: 'player', 
          playerId 
        }];
      }
    });
  }

  /**
   * Advance game phase with immutable state update
   */
  async advanceGamePhase(roomCode: string): Promise<GameEvent[]> {
    return this.withStateLock(roomCode, async () => {
      const currentState = this.getRoom(roomCode);
      
      const engine = this.gameRegistry.getGame(currentState.gameType);
      if (!engine) {
        return [];
      }

      const result = engine.advancePhase(currentState.gameState);
      const newState = currentState
        .withGameStateUpdated(result)
        .withPhaseUpdated(result.phase)
        .withActivityUpdated();
      
      this.rooms.set(roomCode, newState);
      
      return engine.generatePhaseEvents(result);
    });
  }

  /**
   * Update timer for a room
   */
  async updateTimer(roomCode: string, delta: number): Promise<GameEvent[]> {
    return this.withStateLock(roomCode, async () => {
      const currentState = this.getRoom(roomCode);
      
      const engine = this.gameRegistry.getGame(currentState.gameType);
      if (!engine) {
        return [];
      }

      const newGameState = engine.updateTimer(currentState.gameState, delta);
      const newState = currentState
        .withGameStateUpdated(newGameState)
        .withActivityUpdated();
      
      this.rooms.set(roomCode, newState);
      
      if (newGameState.timeLeft === 0) {
        return this.advanceGamePhase(roomCode);
      }
      
      return [{ type: 'timer', data: { timeLeft: newGameState.timeLeft }, target: 'all' }];
    });
  }

  /**
   * Delete room
   */
  deleteRoom(code: string): boolean {
    return this.rooms.delete(code);
  }

  /**
   * Clean up inactive rooms
   */
  cleanupInactiveRooms(maxInactiveMinutes: number = 30): number {
    const now = new Date();
    const inactiveRooms: string[] = [];
    
    for (const [code, state] of this.rooms.entries()) {
      // Clean up empty rooms immediately
      if (state.isEmpty()) {
        inactiveRooms.push(code);
        continue;
      }
      
      // Check for inactive rooms
      const inactiveTime = now.getTime() - state.lastActivity.getTime();
      const inactiveMinutes = inactiveTime / (1000 * 60);
      
      if (inactiveMinutes > maxInactiveMinutes) {
        inactiveRooms.push(code);
      }
    }
    
    let cleanedCount = 0;
    for (const code of inactiveRooms) {
      if (this.deleteRoom(code)) {
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.log(`🧹 Cleaned up ${cleanedCount} inactive/empty rooms`);
    }
    
    return cleanedCount;
  }

  /**
   * Get room statistics
   */
  getRoomStats(): { totalRooms: number; activePlayers: number; gameTypes: Record<string, number> } {
    const stats = {
      totalRooms: this.rooms.size,
      activePlayers: 0,
      gameTypes: {} as Record<string, number>
    };
    
    for (const state of this.rooms.values()) {
      stats.activePlayers += state.getConnectedPlayerCount();
      stats.gameTypes[state.gameType] = (stats.gameTypes[state.gameType] || 0) + 1;
    }
    
    return stats;
  }

  /**
   * Get room count
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Get active player count
   */
  getActivePlayerCount(): number {
    let count = 0;
    for (const state of this.rooms.values()) {
      count += state.getConnectedPlayerCount();
    }
    return count;
  }

  /**
   * Execute operation with state lock to prevent race conditions
   */
  private async withStateLock<T>(roomCode: string, operation: () => Promise<T>): Promise<T> {
    // Get or create lock for this room
    let lock = this.stateLocks.get(roomCode);
    if (!lock) {
      lock = Promise.resolve();
    }

    // Create new lock that waits for current operation to complete
    const newLock = lock.then(operation);
    this.stateLocks.set(roomCode, newLock);

    try {
      const result = await newLock;
      return result;
    } finally {
      // Clean up lock if it's still the current one
      if (this.stateLocks.get(roomCode) === newLock) {
        this.stateLocks.delete(roomCode);
      }
    }
  }
}
