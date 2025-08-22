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
      this.logger.log(`🔌 Connection attempt for room: ${roomCode}, client: ${clientId}`);
      
      // Room should already exist if created by controller
      if (!this.roomManager.hasRoom(roomCode)) {
        this.logger.log(`🏠 Room ${roomCode} not found - should be created by controller first`);
        this.logger.log(`🔍 Available rooms: ${Array.from(this.roomManager['stateManager']['rooms'].keys()).join(', ')}`);
        return {
          success: false,
          room: null,
          isReconnection: false,
          error: `Room ${roomCode} not found. Make sure the host has created the room and the room code is correct.`
        };
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
        // Player is reconnecting - remove old entry and add new one
        this.logger.log(`🔄 Player ${nickname} reconnecting, updating socket ID from ${existingPlayer.id} to ${clientId}`);
        
        // Remove the old disconnected player
        await this.roomManager.removePlayer(roomCode, existingPlayer.id);
        
        // Add the reconnected player with new socket ID
        const newPlayer = {
          id: clientId,
          name: existingPlayer.name,
          avatar: existingPlayer.avatar || avatar || '🙂',
          connected: true,
          score: existingPlayer.score,
        };
        
        await this.roomManager.addPlayer(roomCode, newPlayer);
        
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

      // Clean up any duplicate players that might exist
      await this.roomManager.cleanupDuplicatePlayers(roomCode);

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
          
          // Remove the old disconnected host player and add the reconnected one
          await this.roomManager.removePlayer(roomCode, room.hostId);
          
          const newHostPlayer = {
            id: clientId,
            name: hostPlayer.name,
            avatar: hostPlayer.avatar,
            connected: true,
            score: hostPlayer.score,
          };
          
          await this.roomManager.addPlayer(roomCode, newHostPlayer);
          
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
        
        // Remove the old disconnected player and add the reconnected one
        await this.roomManager.removePlayer(roomCode, disconnectedPlayer.id);
        
        const newPlayer = {
          id: clientId,
          name: disconnectedPlayer.name,
          avatar: disconnectedPlayer.avatar,
          connected: true,
          score: disconnectedPlayer.score,
        };
        
        await this.roomManager.addPlayer(roomCode, newPlayer);
        
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
