import { Injectable } from '@nestjs/common';
import { GameConfig } from '../../config/game.config';
import { GameRegistry } from '../game-registry';
import { ImmutableRoomState, RoomState } from './room.state';
import { Player, GameAction, GameEvent } from '../game-engine.interface';
import { 
  RoomNotFoundError, 
  PlayerNotFoundError, 
  InsufficientPlayersError,
  RoomFullError,
  PlayerNameTakenError
} from '../errors';

@Injectable()
export class StateManagerService {
  private rooms = new Map<string, ImmutableRoomState>();
  private stateLocks = new Map<string, Promise<any>>();

  constructor(private readonly gameRegistry: GameRegistry) {}

  /**
   * Create a new room with immutable state
   */
  createRoom(code: string, gameType: string = GameConfig.GAME_TYPES.BLUFF_TRIVIA): ImmutableRoomState {

    
    const engine = this.gameRegistry.getGame(gameType)!;
    const gameState = engine.initialize([]);
    
    const immutableRoom = new ImmutableRoomState(
      code,
      gameType,
      gameState,
      [],
      gameState.phase,
      null,
      new Date(),
      0
    );
    
    this.rooms.set(code, immutableRoom);
    
    console.log(`🏠 Created room ${code} with game type ${gameType}`);
    return immutableRoom;
  }

  /**
   * Get a room by code
   */
  getRoom(code: string): ImmutableRoomState {
    const room = this.rooms.get(code);
    if (!room) {
      throw new RoomNotFoundError(code);
    }
    return room;
  }

  /**
   * Check if a room exists
   */
  hasRoom(code: string): boolean {
    return this.rooms.has(code);
  }

  /**
   * Get a room safely (returns undefined if not found)
   */
  getRoomSafe(code: string): ImmutableRoomState | undefined {
    return this.rooms.get(code);
  }

  /**
   * Delete a room
   */
  deleteRoom(code: string): boolean {
    return this.rooms.delete(code);
  }

  /**
   * Add a player to a room with state locking
   */
  async addPlayer(roomCode: string, player: Player): Promise<void> {
    return this.withStateLock(roomCode, async () => {
      const room = this.getRoom(roomCode);
      
      // Check if room is full
      if (room.players.length >= GameConfig.RULES.PLAYERS.MAX_PLAYERS_PER_ROOM) {
        throw new RoomFullError(roomCode, GameConfig.RULES.PLAYERS.MAX_PLAYERS_PER_ROOM);
      }
      
      // Check if player name is already taken
      if (room.players.some(p => p.name === player.name)) {
        throw new PlayerNameTakenError(player.name, roomCode);
      }
      
      // Create new state with player added
      let newState = room.withPlayerAdded(player);
      
      // Set the first player as the host
      if (newState.players.length === 1) {
        newState = new ImmutableRoomState(
          newState.code,
          newState.gameType,
          newState.gameState,
          newState.players,
          newState.phase,
          player.id,
          newState.lastActivity,
          newState.version + 1
        );
        console.log(`👑 Player ${player.name} (${player.id}) is now the host of room ${roomCode}`);
      }
      
      // Only reinitialize game state if we're in lobby phase
      // During active games, preserve the current game state
      if (newState.phase === 'lobby') {
        const engine = this.gameRegistry.getGame(newState.gameType)!;
        const updatedGameState = engine.initialize([...newState.players]);
        newState = newState.withGameStateUpdated(updatedGameState);
      }
      
      // Update the room
      this.rooms.set(roomCode, newState);
    });
  }

  /**
   * Remove a player from a room with state locking
   */
  async removePlayer(roomCode: string, playerId: string): Promise<ImmutableRoomState | null> {
    return this.withStateLock(roomCode, async () => {
      const room = this.getRoom(roomCode);
      const playerIndex = room.players.findIndex(p => p.id === playerId);
      
      if (playerIndex === -1) {
        throw new PlayerNotFoundError(playerId, roomCode);
      }
      
      // Create new state with player removed
      let newState = room.withPlayerRemoved(playerId);
      
      // Clean up empty rooms immediately
      if (newState.players.length === 0) {
        console.log(`🏠 Room ${roomCode} is empty, cleaning up`);
        this.deleteRoom(roomCode);
        return null; // Room was deleted
      }
      
      // Only reinitialize game state if we're in lobby phase
      // During active games, preserve the current game state
      if (newState.players.length > 0 && newState.phase === 'lobby') {
        const engine = this.gameRegistry.getGame(newState.gameType)!;
        const updatedGameState = engine.initialize([...newState.players]);
        newState = newState.withGameStateUpdated(updatedGameState);
      }
      
      // Update the room
      this.rooms.set(roomCode, newState);
      return newState;
    });
  }

  /**
   * Process a game action with state locking
   */
  async processGameAction(roomCode: string, playerId: string, action: GameAction): Promise<GameEvent[]> {
    return this.withStateLock(roomCode, async () => {
      const room = this.getRoom(roomCode);
      
      const player = room.players.find(p => p.id === playerId);
      if (!player) {
        throw new PlayerNotFoundError(playerId, roomCode);
      }
      
      const engine = this.gameRegistry.getGame(room.gameType);
      if (!engine) {
        throw new Error(`Game engine not found for type: ${room.gameType}`);
      }
      
      const result = engine.processAction(room.gameState, action);
      
      if (result.isValid) {
        const newState = room
          .withGameStateUpdated(result.newState)
          .withPhaseUpdated(result.newState.phase)
          .withActivityUpdated();
        
        // Update the room
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
   * Advance the game phase with state locking
   */
  async advanceGamePhase(roomCode: string): Promise<GameEvent[]> {
    return this.withStateLock(roomCode, async () => {
      const room = this.getRoom(roomCode);
      
      const engine = this.gameRegistry.getGame(room.gameType);
      if (!engine) {
        return [];
      }
      
      // Let the game engine handle its own phase transitions
      const result = engine.advancePhase(room.gameState);
      const newState = room
        .withGameStateUpdated(result)
        .withPhaseUpdated(result.phase)
        .withActivityUpdated();
      
      // Update the room
      this.rooms.set(roomCode, newState);
      
      // Let the game engine generate its own events
      return engine.generatePhaseEvents(result);
    });
  }

  /**
   * Update timer for a room with state locking
   */
  async updateTimer(roomCode: string, delta: number): Promise<GameEvent[]> {
    return this.withStateLock(roomCode, async () => {
      const room = this.getRoom(roomCode);
      
      const engine = this.gameRegistry.getGame(room.gameType);
      if (!engine) {
        return [];
      }
      
      const updatedGameState = engine.updateTimer(room.gameState, delta);
      const newState = room
        .withGameStateUpdated(updatedGameState)
        .withActivityUpdated();
      
      // Update the room
      this.rooms.set(roomCode, newState);
      
      if (updatedGameState.timeLeft === 0) {
        return this.advanceGamePhase(roomCode);
      }
      
      return [{ type: 'timer', data: { timeLeft: updatedGameState.timeLeft }, target: 'all' }];
    });
  }

  /**
   * Clean up inactive rooms
   */
  cleanupInactiveRooms(maxInactiveMinutes: number = GameConfig.ROOM.CLEANUP.INACTIVE_MINUTES): number {
    const now = new Date();
    const inactiveRooms: string[] = [];
    
    // First, clean up completely empty rooms
    for (const [code, room] of this.rooms.entries()) {
      if (room.players.length === 0) {
        inactiveRooms.push(code);
        console.log(`🏠 Room ${code} is empty, marking for cleanup`);
      }
    }
    
    // Then check for inactive rooms
    for (const [code, room] of this.rooms.entries()) {
      if (room.players.length > 0) {
        const inactiveTime = now.getTime() - room.lastActivity.getTime();
        const inactiveMinutes = inactiveTime / GameConfig.TIMING.CONVERSIONS.MINUTES_TO_MS;
        
        if (inactiveMinutes > maxInactiveMinutes) {
          inactiveRooms.push(code);
          console.log(`🏠 Room ${code} inactive for ${inactiveMinutes.toFixed(1)} minutes, marking for cleanup`);
        }
      }
    }
    
    let cleanedCount = 0;
    for (const code of inactiveRooms) {
      if (this.deleteRoom(code)) {
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} inactive/empty rooms`);
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
    
    for (const room of this.rooms.values()) {
      stats.activePlayers += room.players.length;
      stats.gameTypes[room.gameType] = (stats.gameTypes[room.gameType] || 0) + 1;
    }
    
    return stats;
  }

  /**
   * Get room count for monitoring
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Get active player count
   */
  getActivePlayerCount(): number {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.players.filter(p => p.connected).length;
    }
    return count;
  }

  /**
   * Update player connection status
   */
  async updatePlayerConnection(roomCode: string, playerId: string, connected: boolean): Promise<void> {
    return this.withStateLock(roomCode, async () => {
      const room = this.getRoom(roomCode);
      const newState = room.withPlayerUpdated(playerId, { connected });
      this.rooms.set(roomCode, newState);
    });
  }

  /**
   * Update player socket ID for reconnections
   */
  async updatePlayerSocketId(roomCode: string, playerId: string, newSocketId: string): Promise<void> {
    return this.withStateLock(roomCode, async () => {
      const room = this.getRoom(roomCode);
      const newState = room.withPlayerUpdated(playerId, { id: newSocketId });
      this.rooms.set(roomCode, newState);
    });
  }

  /**
   * Clean up duplicate players to prevent React key collisions
   */
  async cleanupDuplicatePlayers(roomCode: string): Promise<void> {
    return this.withStateLock(roomCode, async () => {
      const room = this.getRoom(roomCode);
      
      // Find duplicate players by name (keep the most recent connected one)
      const playerMap = new Map<string, Player>();
      const duplicates: string[] = [];
      
      for (const player of room.players) {
        const existing = playerMap.get(player.name);
        if (existing) {
          // Keep the connected player, remove the disconnected one
          if (player.connected && !existing.connected) {
            duplicates.push(existing.id);
            playerMap.set(player.name, player);
          } else if (!player.connected && existing.connected) {
            duplicates.push(player.id);
          } else {
            // Both connected or both disconnected, keep the one with higher score
            if (player.score > existing.score) {
              duplicates.push(existing.id);
              playerMap.set(player.name, player);
            } else {
              duplicates.push(player.id);
            }
          }
        } else {
          playerMap.set(player.name, player);
        }
      }
      
      // Remove duplicate players
      if (duplicates.length > 0) {
        console.log(`🧹 Cleaning up ${duplicates.length} duplicate players in room ${roomCode}`);
        
        let newState = room;
        for (const duplicateId of duplicates) {
          newState = newState.withPlayerRemoved(duplicateId);
        }
        
        // Update the room
        this.rooms.set(roomCode, newState);
        console.log(`✅ Cleaned up duplicate players in room ${roomCode}`);
      }
    });
  }

  /**
   * Execute an operation with state locking to prevent race conditions
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
