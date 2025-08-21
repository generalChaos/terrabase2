import { Injectable } from '@nestjs/common';
import { GameRegistry } from './game-registry';
import { Player, GameAction, GameEvent } from './game-engine.interface';
import { GAME_CONFIG, GAME_TYPES } from './constants';
import { RoomNotFoundError, PlayerNotFoundError, InsufficientPlayersError } from './errors';
import { TimerService } from './timer.service';

export interface Room {
  code: string;
  gameType: string;
  gameState: any;
  players: Player[];
  phase: string;
  hostId: string | null; // Track the host by socket ID
  timer?: NodeJS.Timeout;
  lastActivity: Date;
}

@Injectable()
export class RoomManager {
  private rooms = new Map<string, Room>();
  
  constructor(
    private readonly gameRegistry: GameRegistry,
    private readonly timerService: TimerService // ADD: Inject TimerService
  ) {
    // GameRegistry will be injected by NestJS
  }
  
  createRoom(code: string, gameType: string = GAME_TYPES.BLUFF_TRIVIA): Room {
    if (!this.gameRegistry.hasGame(gameType)) {
      throw new Error(`Unknown game type: ${gameType}`);
    }
    
    const engine = this.gameRegistry.getGame(gameType)!;
    const gameState = engine.initialize([]);
    
    const room: Room = {
      code,
      gameType,
      gameState,
      players: [],
      phase: gameState.phase,
      hostId: null, // Will be set when first player joins
      lastActivity: new Date()
    };
    
    this.rooms.set(code, room);
    console.log(`🏠 Created room ${code} with game type ${gameType}`);
    return room;
  }
  
  getRoom(code: string): Room {
    const room = this.rooms.get(code);
    if (!room) {
      throw new RoomNotFoundError(code);
    }
    return room;
  }
  
  hasRoom(code: string): boolean {
    return this.rooms.has(code);
  }
  
  getRoomSafe(code: string): Room | undefined {
    return this.rooms.get(code);
  }
  
  // IMPROVED: Better room deletion with timer cleanup
  deleteRoom(code: string): boolean {
    const room = this.rooms.get(code);
    if (room) {
      // Clear any room-specific timer
      if (room.timer) {
        clearInterval(room.timer);
      }
      
      // IMPORTANT: Stop TimerService timer for this room
      this.timerService.stopTimerForRoom(code);
      
      console.log(`🏠 Deleting room ${code} and cleaning up timers`);
    }
    return this.rooms.delete(code);
  }
  
  addPlayer(roomCode: string, player: Player): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    
    // Check if player name is already taken
    if (room.players.some(p => p.name === player.name)) {
      return false;
    }
    
    room.players.push(player);
    room.lastActivity = new Date();
    
    // Set the first player as the host
    if (room.players.length === 1) {
      room.hostId = player.id;
      console.log(`👑 Player ${player.name} (${player.id}) is now the host of room ${roomCode}`);
    }
    
    // Update game state with new player
    const engine = this.gameRegistry.getGame(room.gameType)!;
    room.gameState = engine.initialize(room.players);
    
    return true;
  }
  
  // IMPROVED: Better player removal with empty room cleanup
  removePlayer(roomCode: string, playerId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return false;
    
    room.players.splice(playerIndex, 1);
    room.lastActivity = new Date();
    
    // NEW: Clean up empty rooms immediately
    if (room.players.length === 0) {
      console.log(`🏠 Room ${roomCode} is empty, cleaning up`);
      this.deleteRoom(roomCode);
      return true;
    }
    
    // Update game state with remaining players
    if (room.players.length > 0) {
      const engine = this.gameRegistry.getGame(room.gameType)!;
      room.gameState = engine.initialize(room.players);
    }
    
    return true;
  }
  
  processGameAction(roomCode: string, playerId: string, action: GameAction): GameEvent[] {
    try {
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
        room.gameState = result.newState;
        room.phase = result.newState.phase;
        room.lastActivity = new Date();
        return result.events;
      } else {
        return [{ 
          type: 'error', 
          data: { error: result.error }, 
          target: 'player', 
          playerId 
        }];
      }
    } catch (error) {
      console.error(`❌ Error processing game action in room ${roomCode}:`, error);
      throw error;
    }
  }
  
  advanceGamePhase(roomCode: string): GameEvent[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    
    const engine = this.gameRegistry.getGame(room.gameType);
    if (!engine) return [];
    
    // Let the game engine handle its own phase transitions
    const result = engine.advancePhase(room.gameState);
    room.gameState = result;
    room.phase = result.phase;
    room.lastActivity = new Date();
    
    // Let the game engine generate its own events
    return engine.generatePhaseEvents(result);
  }
  
  // NEW: Update timer for a room (called by TimerService callbacks)
  updateTimer(roomCode: string, delta: number): GameEvent[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    
    const engine = this.gameRegistry.getGame(room.gameType);
    if (!engine) return [];
    
    room.gameState = engine.updateTimer(room.gameState, delta);
    room.lastActivity = new Date();
    
    if (room.gameState.timeLeft === 0) {
      return this.advanceGamePhase(roomCode);
    }
    
    return [{ type: 'timer', data: { timeLeft: room.gameState.timeLeft }, target: 'all' }];
  }
  
  // IMPROVED: Better cleanup with immediate empty room removal
  cleanupInactiveRooms(maxInactiveMinutes: number = 30): number {
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
        const inactiveMinutes = inactiveTime / (1000 * 60);
        
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
  
  // NEW: Method to get room count for monitoring
  getRoomCount(): number {
    return this.rooms.size;
  }
  
  // NEW: Method to get active player count
  getActivePlayerCount(): number {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.players.filter(p => p.connected).length;
    }
    return count;
  }
}
