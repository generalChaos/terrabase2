import { RoomManager } from './room-manager';
import { TimerService } from './timer.service';
import { GameAction, GameEvent, Player } from '@party/types';
import { BluffTriviaState } from './games/bluff-trivia-new.engine';
import {
  GAME_PHASE_DURATIONS,
  EventType,
  EventTarget,
  GAME_TYPES,
} from './constants';
import {
  GameError,
  InsufficientPlayersError,
  PlayerNotHostError,
  PlayerNotJoinedError,
  PlayerNameTakenError,
  RoomNotFoundError,
  InvalidGamePhaseError,
  ValidationError,
  EmptyInputError,
  RoomCodeRequiredError,
  ConnectionError,
} from './errors';
import { ErrorHandlerService } from './error-handler.service';
import { ImmutableRoomState } from './state/room.state';
import { Namespace, Socket } from 'socket.io';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { GameCommandHandler } from './commands/game-command.handler';
import { ConnectionManagerService } from './services/connection-manager.service';
import { EventBroadcasterService } from './services/event-broadcaster.service';
import { ConnectionGatewayService } from './services/connection-gateway.service';
import { GameGatewayService } from './services/game-gateway.service';
import { EventGatewayService } from './services/event-gateway.service';

@WebSocketGateway({ namespace: '/rooms', cors: { origin: '*' } })
export class RoomsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() nsp!: Namespace;
  private isReady = false;

  constructor(
    private roomManager: RoomManager,
    private timerService: TimerService,
    private errorHandler: ErrorHandlerService,
    private connectionManager: ConnectionManagerService,
    private eventBroadcaster: EventBroadcasterService,
    private connectionGateway: ConnectionGatewayService,
    private gameGateway: GameGatewayService,
    private eventGateway: EventGatewayService,
  ) {}

  afterInit(nsp: Namespace) {
    console.log('🚀 afterInit');
    console.log('nsp.constructor:', nsp?.constructor?.name);
    this.isReady = true;

    // Set the namespace for the event broadcaster
    this.eventBroadcaster.setNamespace(nsp);

    nsp.use((socket, next) => next());
    nsp.on('connection', (s) => {
      console.log('child nsp connected:', s.nsp.name, 'socket:', s.id);
    });
  }

  async handleConnection(client: Socket) {
    await this.connectionGateway.handleConnection(client);
  }

  async handleDisconnect(client: Socket) {
    await this.connectionGateway.handleDisconnection(client);
  }

  @SubscribeMessage('join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { nickname: string; avatar?: string },
  ) {
    await this.connectionGateway.handlePlayerJoin(client, body);
  }

  @SubscribeMessage('startGame')
  async start(@ConnectedSocket() client: Socket) {
    try {
      const roomCode = this.codeFromNs(client);
      const result = await this.gameGateway.startGame(client, roomCode);
      if (result.isSuccess()) {
        // Game started successfully
        console.log(`✅ Game started in room ${roomCode}`);
        
        // Handle the events returned from the game gateway
        const { events } = result.value;
        if (events && events.length > 0) {
          console.log(`📡 Emitting ${events.length} events for room ${roomCode}`);
          
          // Get the updated room state
          const room = this.roomManager.getRoom(roomCode);
          if (room) {
            // Use the event broadcaster to handle all event emission
            this.eventBroadcaster.broadcastEvents({
              roomCode,
              events,
              roomState: room,
            });
          }
        }
      } else {
        // Handle error
        const errorResponse = this.errorHandler.createWebSocketErrorResponse(
          result.error,
          'startGame',
          client.id,
        );
        client.emit('error', errorResponse);
      }
    } catch (error) {
      const errorResponse = this.errorHandler.createWebSocketErrorResponse(
        error,
        'startGame',
        client.id,
      );
      console.error(`❌ Error in startGame:`, errorResponse);
      client.emit('error', errorResponse);
    }
  }

  @SubscribeMessage('submitAnswer')
  async onAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { answer: string },
  ) {
    try {
      const roomCode = this.codeFromNs(client);
      const result = await this.gameGateway.submitAnswer(
        client,
        roomCode,
        body,
      );
      if (result.isSuccess()) {
        // Answer submitted successfully
        console.log(`✅ Answer submitted in room ${roomCode}`);
      } else {
        // Handle error
        const errorResponse = this.errorHandler.createWebSocketErrorResponse(
          result.error,
          'submitAnswer',
          client.id,
        );
        client.emit('error', errorResponse);
      }
    } catch (error) {
      const errorResponse = this.errorHandler.createWebSocketErrorResponse(
        error,
        'submitAnswer',
        client.id,
      );
      console.error(`❌ Error in submitAnswer:`, errorResponse);
      client.emit('error', errorResponse);
    }
  }

  @SubscribeMessage('submitVote')
  async onVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { vote: string },
  ) {
    try {
      const roomCode = this.codeFromNs(client);
      const result = await this.gameGateway.submitVote(client, roomCode, body);
      if (result.isSuccess()) {
        // Vote submitted successfully
        console.log(`✅ Vote submitted in room ${roomCode}`);
      } else {
        // Handle error
        const errorResponse = this.errorHandler.createWebSocketErrorResponse(
          result.error,
          'submitVote',
          client.id,
        );
        client.emit('error', errorResponse);
      }
    } catch (error) {
      const errorResponse = this.errorHandler.createWebSocketErrorResponse(
        error,
        'submitVote',
        client.id,
      );
      console.error(`❌ Error in submitVote:`, errorResponse);
      client.emit('error', errorResponse);
    }
  }

  @SubscribeMessage('getRooms')
  async getRooms(@ConnectedSocket() client: Socket) {
    try {
      const rooms = this.roomManager.getAllRooms();
      const roomList = rooms.map(room => ({
        code: room.code,
        gameType: room.gameType,
        phase: room.gameState.phase,
        players: room.players.map(player => ({
          id: player.id,
          name: player.name,
          isHost: room.hostId === player.id,
        })),
        createdAt: room.lastActivity, // Use lastActivity as creation time
        lastActivity: room.lastActivity,
      }));
      
      client.emit('roomList', roomList);
      console.log(`📋 Room list sent to dashboard client ${client.id}`);
    } catch (error) {
      console.error(`❌ Error getting room list:`, error);
      client.emit('error', 'Failed to get room list');
    }
  }

  @SubscribeMessage('createRoom')
  async createRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { code: string; gameType: string },
  ) {
    try {
      const { code, gameType } = body;
      
      // Validate room code
      const validationResult = this.errorHandler.validateRoomCode(code, 'createRoom');
      if (validationResult.isFailure()) {
        throw new Error(validationResult.error.message);
      }

      // Check if room already exists
      if (this.roomManager.getRoom(code)) {
        throw new Error('Room already exists');
      }

      // Create the room
      const room = this.roomManager.createRoom(code, gameType);
      console.log(`✅ Room ${code} created via dashboard`);
      
      // Notify all dashboard clients
      this.nsp.emit('roomCreated', {
        code: room.code,
        gameType: room.gameType,
        phase: room.gameState.phase,
        players: room.players.map(player => ({
          id: player.id,
          name: player.name,
          isHost: room.hostId === player.id,
        })),
        createdAt: room.lastActivity, // Use lastActivity as creation time
        lastActivity: room.lastActivity,
      });
    } catch (error) {
      console.error(`❌ Error creating room:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      client.emit('error', errorMessage);
    }
  }

  @SubscribeMessage('deleteRoom')
  async deleteRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomCode: string },
  ) {
    try {
      const { roomCode } = body;
      
      // Check if room exists
      if (!this.roomManager.getRoom(roomCode)) {
        throw new Error('Room not found');
      }

      // Delete the room
      this.roomManager.deleteRoom(roomCode);
      console.log(`🗑️ Room ${roomCode} deleted via dashboard`);
      
      // Notify all dashboard clients
      this.nsp.emit('roomDeleted', roomCode);
    } catch (error) {
      console.error(`❌ Error deleting room:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete room';
      client.emit('error', errorMessage);
    }
  }

  /**
   * Extract room code from socket handshake query
   * This is kept here for backward compatibility with existing code
   */
  private codeFromNs(client: Socket): string {
    const roomCode = client.handshake.query.roomCode as string;
    if (!roomCode) {
      throw new RoomCodeRequiredError();
    }

    // Validate room code format
    const validationResult = this.errorHandler.validateRoomCode(
      roomCode,
      'codeFromNs',
    );
    if (validationResult.isFailure()) {
      throw new Error(validationResult.error.message);
    }

    return roomCode;
  }
}
