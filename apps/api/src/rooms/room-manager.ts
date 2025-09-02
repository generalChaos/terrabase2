import { Injectable } from '@nestjs/common';
import { GameRegistry } from './game-registry';
import { Player, GameAction, GameEvent } from '@party/types';
import { GAME_CONFIG, GAME_TYPES } from './constants';
import {
  RoomNotFoundError,
  PlayerNotFoundError,
  InsufficientPlayersError,
} from './errors';
import { TimerService } from './timer.service';
import { StateManagerService } from './state/state-manager.service';
import { ImmutableRoomState } from './state/room.state';

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
  constructor(
    private readonly gameRegistry: GameRegistry,
    private readonly timerService: TimerService,
    private readonly stateManager: StateManagerService, // ADD: Inject StateManagerService
  ) {
    // GameRegistry will be injected by NestJS
  }

  createRoom(
    code: string,
    gameType: string = GAME_TYPES.BLUFF_TRIVIA,
  ): ImmutableRoomState {
    return this.stateManager.createRoom(code, gameType);
  }

  getRoom(code: string): ImmutableRoomState {
    return this.stateManager.getRoom(code);
  }

  hasRoom(code: string): boolean {
    return this.stateManager.hasRoom(code);
  }

  getRoomSafe(code: string): ImmutableRoomState | undefined {
    return this.stateManager.getRoomSafe(code);
  }

  getAllRooms(): ImmutableRoomState[] {
    return this.stateManager.getAllRooms();
  }

  // IMPROVED: Better room deletion with timer cleanup
  deleteRoom(code: string): boolean {
    // Stop timer first
    this.timerService.stopTimerForRoom(code);

    // Then delete from state manager
    return this.stateManager.deleteRoom(code);
  }

  async addPlayer(roomCode: string, player: Player): Promise<boolean> {
    try {
      await this.stateManager.addPlayer(roomCode, player);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to add player ${player.name} to room ${roomCode}:`,
        error,
      );
      return false;
    }
  }

  // IMPROVED: Better player removal with empty room cleanup
  async removePlayer(roomCode: string, playerId: string): Promise<boolean> {
    try {
      const result = await this.stateManager.removePlayer(roomCode, playerId);
      // If result is null, room was deleted (empty)
      return result !== null;
    } catch (error) {
      console.error(
        `❌ Failed to remove player ${playerId} from room ${roomCode}:`,
        error,
      );
      return false;
    }
  }

  async processGameAction(
    roomCode: string,
    playerId: string,
    action: GameAction,
  ): Promise<GameEvent[]> {
    try {
      return await this.stateManager.processGameAction(
        roomCode,
        playerId,
        action,
      );
    } catch (error) {
      console.error(
        `❌ Error processing game action in room ${roomCode}:`,
        error,
      );
      throw error;
    }
  }

  async advanceGamePhase(roomCode: string): Promise<GameEvent[]> {
    try {
      return await this.stateManager.advanceGamePhase(roomCode);
    } catch (error) {
      console.error(
        `❌ Error advancing game phase in room ${roomCode}:`,
        error,
      );
      return [];
    }
  }

  async updateTimer(roomCode: string, delta: number): Promise<GameEvent[]> {
    try {
      return await this.stateManager.updateTimer(roomCode, delta);
    } catch (error) {
      console.error(`❌ Error updating timer in room ${roomCode}:`, error);
      return [];
    }
  }

  // IMPROVED: Better cleanup with immediate empty room removal
  cleanupInactiveRooms(maxInactiveMinutes: number = 30): number {
    return this.stateManager.cleanupInactiveRooms(maxInactiveMinutes);
  }

  getRoomStats(): {
    totalRooms: number;
    activePlayers: number;
    gameTypes: Record<string, number>;
  } {
    return this.stateManager.getRoomStats();
  }

  // NEW: Method to get room count for monitoring
  getRoomCount(): number {
    return this.stateManager.getRoomCount();
  }

  // NEW: Method to get active player count
  getActivePlayerCount(): number {
    return this.stateManager.getActivePlayerCount();
  }

  // NEW: Update player connection status
  async updatePlayerConnection(
    roomCode: string,
    playerId: string,
    connected: boolean,
  ): Promise<void> {
    try {
      await this.stateManager.updatePlayerConnection(
        roomCode,
        playerId,
        connected,
      );
    } catch (error) {
      console.error(
        `❌ Error updating player connection in room ${roomCode}:`,
        error,
      );
    }
  }

  // NEW: Update player socket ID for reconnections
  async updatePlayerSocketId(
    roomCode: string,
    playerId: string,
    newSocketId: string,
  ): Promise<void> {
    try {
      await this.stateManager.updatePlayerSocketId(
        roomCode,
        playerId,
        newSocketId,
      );
    } catch (error) {
      console.error(
        `❌ Error updating player socket ID in room ${roomCode}:`,
        error,
      );
    }
  }

  // NEW: Clean up duplicate players to prevent React key collisions
  async cleanupDuplicatePlayers(roomCode: string): Promise<void> {
    try {
      await this.stateManager.cleanupDuplicatePlayers(roomCode);
    } catch (error) {
      console.error(
        `❌ Error cleaning up duplicate players in room ${roomCode}:`,
        error,
      );
    }
  }
}
