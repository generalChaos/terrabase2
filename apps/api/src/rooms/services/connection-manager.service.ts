import { Injectable, Logger } from '@nestjs/common';
import { RoomManager } from '../room-manager';
import { GAME_TYPES } from '../constants';
import { ImmutableRoomState } from '../state/room.state';

export interface ConnectionResult {
  success: boolean;
  room: ImmutableRoomState | null;
  isReconnection: boolean;
  reconnectedPlayerId?: string;
  error?: string;
}

@Injectable()
export class ConnectionManagerService {
  private readonly logger = new Logger(ConnectionManagerService.name);

  constructor(private readonly roomManager: RoomManager) {}

  /**
   * Handle player connection to a room
   */
  async handleConnection(roomCode: string, clientId: string): Promise<ConnectionResult> {
    try {
      // Create room if it doesn't exist
      if (!this.roomManager.hasRoom(roomCode)) {
        this.logger.log(`🏠 Creating new room: ${roomCode}`);
        this.roomManager.createRoom(roomCode, GAME_TYPES.BLUFF_TRIVIA);
      }

      const room = this.roomManager.getRoomSafe(roomCode);
      if (!room) {
        return {
          success: false,
          room: null,
          isReconnection: false,
          error: 'Failed to create or retrieve room'
        };
      }

      // Check for reconnections
      const reconnectionResult = await this.handleReconnection(roomCode, clientId, room);
      if (reconnectionResult.isReconnection) {
        return reconnectionResult;
      }

      return {
        success: true,
        room,
        isReconnection: false
      };

    } catch (error) {
      this.logger.error(`❌ Error handling connection for room ${roomCode}:`, error);
      return {
        success: false,
        room: null,
        isReconnection: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle player disconnection from a room
   */
  async handleDisconnection(roomCode: string, clientId: string): Promise<boolean> {
    try {
      const room = this.roomManager.getRoomSafe(roomCode);
      if (!room) {
        return false;
      }

      const player = room.players.find(p => p.id === clientId);
      if (!player) {
        return false;
      }

      // Update player connection status
      await this.roomManager.updatePlayerConnection(roomCode, clientId, false);
      return true;

    } catch (error) {
      this.logger.error(`❌ Error handling disconnection for room ${roomCode}:`, error);
      return false;
    }
  }

  /**
   * Handle player joining a room
   */
  async handlePlayerJoin(
    roomCode: string, 
    clientId: string, 
    nickname: string, 
    avatar?: string
  ): Promise<ConnectionResult> {
    try {
      const room = this.roomManager.getRoomSafe(roomCode);
      if (!room) {
        return {
          success: false,
          room: null,
          isReconnection: false,
          error: 'Room not found'
        };
      }

      // Check if this is a reconnection of an existing player
      const existingPlayer = room.players.find(p => p.name === nickname);
      if (existingPlayer && !existingPlayer.connected) {
        // Player is reconnecting - update their socket ID and connection status
        this.logger.log(`🔄 Player ${nickname} reconnecting, updating socket ID from ${existingPlayer.id} to ${clientId}`);
        await this.roomManager.updatePlayerSocketId(roomCode, existingPlayer.id, clientId);
        
        const updatedRoom = this.roomManager.getRoomSafe(roomCode);
        return {
          success: true,
          room: updatedRoom || room,
          isReconnection: true,
          reconnectedPlayerId: existingPlayer.id
        };
      }

      // Check if name is already taken by a connected player
      if (existingPlayer && existingPlayer.connected) {
        return {
          success: false,
          room: null,
          isReconnection: false,
          error: 'Player name already taken'
        };
      }

      // New player joining
      const newPlayer = {
        id: clientId,
        name: nickname,
        avatar: avatar || '🙂',
        connected: true,
        score: 0,
      };

      const success = await this.roomManager.addPlayer(roomCode, newPlayer);
      if (!success) {
        return {
          success: false,
          room: null,
          isReconnection: false,
          error: 'Failed to add player to room'
        };
      }

      const updatedRoom = this.roomManager.getRoomSafe(roomCode);
      return {
        success: true,
        room: updatedRoom || room,
        isReconnection: false
      };

    } catch (error) {
      this.logger.error(`❌ Error handling player join for room ${roomCode}:`, error);
      return {
        success: false,
        room: null,
        isReconnection: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle reconnection logic
   */
  private async handleReconnection(
    roomCode: string, 
    clientId: string, 
    room: ImmutableRoomState
  ): Promise<ConnectionResult> {
    try {
      // Check if this is a reconnection of the host
      if (room.hostId && room.players.some(p => p.id === room.hostId && !p.connected)) {
        const hostPlayer = room.players.find(p => p.id === room.hostId);
        if (hostPlayer) {
          this.logger.log(`🔄 Host ${hostPlayer.name} reconnecting, updating socket ID from ${room.hostId} to ${clientId}`);
          await this.roomManager.updatePlayerSocketId(roomCode, room.hostId, clientId);
          
          const updatedRoom = this.roomManager.getRoomSafe(roomCode);
          return {
            success: true,
            room: updatedRoom || room,
            isReconnection: true,
            reconnectedPlayerId: room.hostId
          };
        }
      }

      // Check if this is a reconnection of any other player
      const disconnectedPlayer = room.players.find(p => !p.connected);
      if (disconnectedPlayer) {
        this.logger.log(`🔄 Player ${disconnectedPlayer.name} reconnecting, updating socket ID from ${disconnectedPlayer.id} to ${clientId}`);
        await this.roomManager.updatePlayerSocketId(roomCode, disconnectedPlayer.id, clientId);
        
        const updatedRoom = this.roomManager.getRoomSafe(roomCode);
        return {
          success: true,
          room: updatedRoom || room,
          isReconnection: true,
          reconnectedPlayerId: disconnectedPlayer.id
        };
      }

      return {
        success: true,
        room,
        isReconnection: false
      };

    } catch (error) {
      this.logger.error(`❌ Error handling reconnection for room ${roomCode}:`, error);
      return {
        success: true,
        room,
        isReconnection: false
      };
    }
  }
}
