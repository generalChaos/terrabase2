import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ConnectionManagerService } from '../services/connection-manager.service';
import { RoomManager } from '../room-manager';
import { ErrorHandlerService } from '../error-handler.service';
import { ConnectionError, RoomCodeRequiredError } from '../errors';
import { Result, success, failure } from '@party/types';

@Injectable()
export class ConnectionGatewayService {
  private readonly logger = new Logger(ConnectionGatewayService.name);

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly roomManager: RoomManager,
    private readonly errorHandler: ErrorHandlerService
  ) {}

  /**
   * Handle WebSocket connection with proper error handling
   */
  async handleConnection(client: Socket): Promise<Result<void, any>> {
    try {
      const roomCode = client.handshake.query.roomCode as string;
      
      if (!roomCode) {
        throw new RoomCodeRequiredError();
      }

      // Validate room code format
      const validationResult = this.errorHandler.validateRoomCode(roomCode, 'connection');
      if (validationResult.isFailure()) {
        return failure(validationResult.error);
      }

      const code = roomCode.toUpperCase();
      
      // Attempt to establish connection
      const { success: connectionSuccess, room, isReconnection, error } = await this.connectionManager.handleConnection(code, client.id);
      
      if (connectionSuccess && room) {
        // Join the room namespace
        await client.join(code);
        
        if (isReconnection) {
          this.logger.log(`Player reconnected to room ${code}`);
          client.emit('reconnected', { roomCode: code, playerId: client.id });
        } else {
          this.logger.log(`Player connected to room ${code}`);
          client.emit('connected', { roomCode: code, playerId: client.id });
        }
        
        return success(undefined);
      } else if (error) {
        throw new ConnectionError(error);
      } else {
        throw new ConnectionError('Failed to establish connection');
      }
    } catch (error) {
      const errorResponse = this.errorHandler.createWebSocketErrorResponse(error, 'connection', client.id);
      this.logger.error(`Error in handleConnection:`, errorResponse);
      client.emit('error', errorResponse);
      return failure(errorResponse);
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  async handleDisconnection(client: Socket): Promise<Result<void, any>> {
    try {
      const roomCode = client.handshake.query.roomCode as string;
      if (roomCode) {
        await this.connectionManager.handleDisconnection(roomCode.toUpperCase(), client.id);
        this.logger.log(`Player disconnected from room ${roomCode}`);
      }
      return success(undefined);
    } catch (error) {
      this.logger.error(`Error in handleDisconnection:`, error);
      // Don't emit error on disconnect as client is gone
      return failure(error);
    }
  }

  /**
   * Handle player join with proper error handling
   */
  async handlePlayerJoin(client: Socket, body: { nickname: string }): Promise<Result<void, any>> {
    try {
      const roomCode = client.handshake.query.roomCode as string;
      
      if (!roomCode) {
        throw new RoomCodeRequiredError();
      }

      // Validate nickname
      const nicknameValidation = this.errorHandler.validateNickname(body.nickname, 'player-join');
      if (nicknameValidation.isFailure()) {
        return failure(nicknameValidation.error);
      }

      const code = roomCode.toUpperCase();
      
      // Attempt to join room
      const { success: joinSuccess, room, isReconnection, error } = await this.connectionManager.handlePlayerJoin(
        code,
        client.id,
        body.nickname
      );
      
      if (joinSuccess && room) {
        // Notify all players in the room
        client.to(code).emit('playerJoined', {
          playerId: client.id,
          nickname: body.nickname,
          roomCode: code
        });
        
        // Send success response to joining player
        client.emit('joined', {
          roomCode: code,
          playerId: client.id,
          nickname: body.nickname,
          isHost: room.hostId === client.id
        });
        
        this.logger.log(`Player ${body.nickname} joined room ${code}`);
        return success(undefined);
      } else {
        throw new ConnectionError(error || 'Failed to join room');
      }
    } catch (error) {
      const errorResponse = this.errorHandler.createWebSocketErrorResponse(error, 'player-join', client.id);
      this.logger.error(`Error in handlePlayerJoin:`, errorResponse);
      client.emit('error', errorResponse);
      return failure(errorResponse);
    }
  }
}
