import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ConnectionManagerService } from '../services/connection-manager.service';
import { RoomManager } from '../room-manager';
import { ErrorHandlerService } from '../error-handler.service';
import { EventGatewayService } from '../services/event-gateway.service';
import { ConnectionError, RoomCodeRequiredError } from '../errors';
import { Result, success, failure } from '@party/types';

@Injectable()
export class ConnectionGatewayService {
  private readonly logger = new Logger(ConnectionGatewayService.name);

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly roomManager: RoomManager,
    private readonly errorHandler: ErrorHandlerService,
    private readonly eventGateway: EventGatewayService,
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
      const validationResult = this.errorHandler.validateRoomCode(
        roomCode,
        'connection',
      );
      if (validationResult.isFailure()) {
        return failure(validationResult.error);
      }

      const code = roomCode.toUpperCase();

      // Attempt to establish connection
      const {
        success: connectionSuccess,
        room,
        isReconnection,
        error,
      } = await this.connectionManager.handleConnection(code, client.id);

      if (connectionSuccess && room) {
        // Join the room namespace
        await client.join(code);

        if (isReconnection) {
          this.logger.log(`Player reconnected to room ${code}`);
          client.emit('reconnected', { roomCode: code, playerId: client.id });

          // Broadcast updated room state to all clients when someone reconnects
          await this.eventGateway.broadcastRoomUpdate(code, room);
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
      const errorResponse = this.errorHandler.createWebSocketErrorResponse(
        error,
        'connection',
        client.id,
      );
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
        const code = roomCode.toUpperCase();
        await this.connectionManager.handleDisconnection(code, client.id);

        // Get updated room state after player disconnection
        const updatedRoom = this.roomManager.getRoomSafe(code);
        if (updatedRoom) {
          // Broadcast updated room state to remaining players
          await this.eventGateway.broadcastRoomUpdate(code, updatedRoom);
        }

        this.logger.log(`Player disconnected from room ${code}`);
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
  async handlePlayerJoin(
    client: Socket,
    body: { nickname: string; avatar?: string },
  ): Promise<Result<void, any>> {
    try {
      const roomCode = client.handshake.query.roomCode as string;

      if (!roomCode) {
        throw new RoomCodeRequiredError();
      }

      // Validate nickname
      const nicknameValidation = this.errorHandler.validateNickname(
        body.nickname,
        'player-join',
      );
      
      if (nicknameValidation.isFailure()) {
        const errorResponse = this.errorHandler.createWebSocketErrorResponse(
          nicknameValidation.error,
          'player-join',
          client.id,
        );
        client.emit('error', errorResponse);
        return failure(errorResponse);
      }

      const code = roomCode.toUpperCase();

      // Attempt to join room
      const {
        success: joinSuccess,
        room,
        isReconnection,
        error,
      } = await this.connectionManager.handlePlayerJoin(
        code,
        client.id,
        body.nickname,
        body.avatar,
      );

      if (joinSuccess && room) {
        // Broadcast updated room state to all clients in the room
        await this.eventGateway.broadcastRoomUpdate(code, room);

        // Notify all players in the room about the new player
        client.to(code).emit('playerJoined', {
          playerId: client.id,
          nickname: body.nickname,
          avatar: body.avatar || '🙂',
          roomCode: code,
        });

        // Send success response to joining player
        client.emit('joined', {
          roomCode: code,
          playerId: client.id,
          nickname: body.nickname,
          avatar: body.avatar || '🙂',
          isHost: room.hostId === client.id,
        });

        this.logger.log(`Player ${body.nickname} joined room ${code}`);
        return success(undefined);
      } else {
        throw new ConnectionError(error || 'Failed to join room');
      }
    } catch (error) {
      const errorResponse = this.errorHandler.createWebSocketErrorResponse(
        error,
        'player-join',
        client.id,
      );
      this.logger.error(`Error in handlePlayerJoin:`, errorResponse);
      client.emit('error', errorResponse);
      return failure(errorResponse);
    }
  }
}
