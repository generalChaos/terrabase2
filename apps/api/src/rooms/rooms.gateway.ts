import { RoomManager } from './room-manager';
import { TimerService } from './timer.service';
import { GameAction, GameEvent, Player } from './game-engine.interface';
import { BluffTriviaState } from './games/bluff-trivia.engine';
import { GAME_PHASE_DURATIONS, EventType, EventTarget, GAME_TYPES } from './constants';
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
  ConnectionError
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
    private eventBroadcaster: EventBroadcasterService
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

  private getMainServer(): Namespace | null {
    if (!this.nsp || !this.isReady) {
      console.log('❌ nsp not ready');
      return null;
    }
    return this.nsp;
  }

  async handleConnection(client: Socket) {
    try {
      const code = this.codeFromNs(client);
      console.log(`🔌 Player connected to room ${code} (ID: ${client.id})`);
      
      // Add client to socket.io room for this room code
      client.join(code);
      console.log(`🔌 Client ${client.id} joined socket.io room ${code}`);
      
      const { success, room, isReconnection, error } = await this.connectionManager.handleConnection(code, client.id);
      
      if (success && room) {
        this.eventBroadcaster.broadcastRoomUpdate(code, room);
        client.emit('room', this.eventBroadcaster.serializeRoom(room)); // Send initial room state to connecting client
      } else if (error) {
        throw new ConnectionError(error);
      } else {
        throw new ConnectionError('Failed to establish connection');
      }

    } catch (error) {
      const errorResponse = this.errorHandler.handleWebSocketError(error, 'connection', client.id);
      console.error(`❌ Error in handleConnection:`, errorResponse);
      client.emit('error', errorResponse);
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const code = this.codeFromNs(client);
      console.log(`🔌 Player disconnected from room ${code} (ID: ${client.id})`);
      
      const success = await this.connectionManager.handleDisconnection(code, client.id);
      if (success) {
        const room = this.roomManager.getRoomSafe(code);
        if (room) {
          this.eventBroadcaster.broadcastRoomUpdate(code, room);
        }
      }
    } catch (error) {
      console.error(`❌ Error in handleDisconnect:`, error);
      // Don't emit error on disconnect as client is gone
    }
  }

  @SubscribeMessage('join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { nickname: string; avatar?: string },
  ) {
    try {
      // Validate input
      this.errorHandler.validateNickname(body.nickname);
      
      const code = this.codeFromNs(client);
      console.log(`👋 Player ${body.nickname} joining room ${code} (ID: ${client.id})`);
      
      const { success, room, isReconnection, error } = await this.connectionManager.handlePlayerJoin(
        code,
        client.id,
        body.nickname,
        body.avatar
      );
      
      if (!success || !room) {
        throw new GameError(error || 'Failed to join room', 'JOIN_FAILED', 500);
      }
      
      console.log(`✅ Player ${body.nickname} ${isReconnection ? 'reconnected' : 'joined'} to room ${code}`);
      console.log(`🏠 Room state after join:`, room);
      console.log(`🏠 Players:`, room.players);
      console.log(`🏠 Host ID:`, room.hostId);
      client.emit('joined', { ok: true });
      
      this.eventBroadcaster.broadcastRoomUpdate(code, room);
      
      // Send additional context for mid-game joins
      if (room.gameState.phase !== 'lobby') {
        this.eventBroadcaster.sendMidGameContext(client.id, room);
      }
      
    } catch (error) {
      const errorResponse = this.errorHandler.handleWebSocketError(error, 'join', client.id);
      console.error(`❌ Error in join method:`, errorResponse);
      client.emit('error', errorResponse);
    }
  }

  @SubscribeMessage('startGame')
  async start(@ConnectedSocket() client: Socket) {
    try {
      console.log(`🎮 startGame called by client ${client.id}`);
      const code = this.codeFromNs(client);
      console.log(`🎮 Room code: ${code}`);
      
      const room = this.roomManager.getRoom(code);
      if (!room) {
        throw new RoomNotFoundError(code);
      }
      
      console.log(`🎮 Room found, players:`, room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected })));
      console.log(`🎮 Client ID: ${client.id}`);
      
      // Check if player has actually joined the room
      const currentPlayer = room.players.find(p => p.id === client.id);
      if (!currentPlayer) {
        throw new PlayerNotJoinedError(client.id, code);
      }
      
      // Check if player is the host using the hostId
      if (room.hostId !== client.id) {
        throw new PlayerNotHostError(client.id, code);
      }
      
      // Check if there are enough players to start
      if (room.players.length < 2) {
        throw new InsufficientPlayersError(2, room.players.length);
      }
      
      console.log(`✅ Starting game in room ${code}`);
      
      const action: GameAction = {
        type: 'start',
        playerId: client.id,
        data: {}
      };
      
      const events = await this.roomManager.processGameAction(code, client.id, action);
      console.log(`🎮 Game started, events generated:`, events.length);
      this.handleGameEvents(code, events);
      
      // Start timer for prompt phase
      this.timerService.startTimer(code, GAME_PHASE_DURATIONS.PROMPT, {
        onExpire: () => this.handlePhaseTransition(code),
        onTick: (events) => this.handleTimerEvents(code, events)
      });
      
    } catch (error) {
      const errorResponse = this.errorHandler.handleWebSocketError(error, 'startGame', client.id);
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
      // Validate input
      this.errorHandler.validateInput(body.answer, 'answer', 'submitAnswer');
      
      const code = this.codeFromNs(client);
      const room = this.roomManager.getRoomSafe(code);
      
      if (!room) {
        throw new RoomNotFoundError(code);
      }
      
      if (room.gameState.phase !== 'prompt') {
        throw new InvalidGamePhaseError(room.gameState.phase, 'prompt');
      }
      
      const action: GameAction = {
        type: 'submitAnswer',
        playerId: client.id,
        data: { answer: body.answer }
      };
      
      const events = await this.roomManager.processGameAction(code, client.id, action);
      this.handleGameEvents(code, events);
      
    } catch (error) {
      const errorResponse = this.errorHandler.handleWebSocketError(error, 'submitAnswer', client.id);
      console.error(`❌ Error in submitAnswer:`, errorResponse);
      client.emit('error', errorResponse);
    }
  }



  @SubscribeMessage('submitVote')
  async onVote(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { choiceId: string },
  ) {
    try {
      // Validate input
      this.errorHandler.validateInput(body.choiceId, 'choiceId', 'submitVote');
      
      const code = this.codeFromNs(client);
      const room = this.roomManager.getRoomSafe(code);
      
      if (!room) {
        throw new RoomNotFoundError(code);
      }
      
      if (room.gameState.phase !== 'choose') {
        throw new InvalidGamePhaseError(room.gameState.phase, 'choose');
      }
      
      const action: GameAction = {
        type: 'submitVote',
        playerId: client.id,
        data: { choiceId: body.choiceId }
      };
      
      const events = await this.roomManager.processGameAction(code, client.id, action);
      this.handleGameEvents(code, events);
      
    } catch (error) {
      const errorResponse = this.errorHandler.handleWebSocketError(error, 'submitVote', client.id);
      console.error(`❌ Error in submitVote:`, errorResponse);
      client.emit('error', errorResponse);
    }
  }

  private async handlePhaseTransition(roomCode: string) {
    try {
      const events = await this.roomManager.advanceGamePhase(roomCode);
      this.handleGameEvents(roomCode, events);
      
      // Start timer for next phase if needed
      const room = this.roomManager.getRoomSafe(roomCode);
      if (room && room.gameState.timeLeft > 0) {
        this.timerService.startTimer(roomCode, room.gameState.timeLeft, {
          onExpire: () => this.handlePhaseTransition(roomCode),
          onTick: (events) => this.handleTimerEvents(roomCode, events)
        });
      }
      
    } catch (error) {
      console.error(`❌ Error in phase transition:`, error);
    }
  }

  // NEW: Handle timer ticks
  private async handleTimerTick(roomCode: string) {
    try {
      const events = await this.roomManager.updateTimer(roomCode, 1);
      this.handleTimerEvents(roomCode, events);
    } catch (error) {
      console.error(`❌ Error in timer tick for room ${roomCode}:`, error);
      // Stop the timer if there's an error
      this.timerService.stopTimerForRoom(roomCode);
    }
  }

  private handleGameEvents(roomCode: string, events: GameEvent[]) {
    const nsp = this.getMainServer();
    if (!nsp) return;
    
    for (const event of events) {
      switch (event.target) {
        case 'all':
          nsp.to(roomCode).emit(event.type, event.data);
          break;
        case 'player':
          if (event.playerId) {
            nsp.to(event.playerId).emit(event.type, event.data);
          }
          break;
          case 'host':
          // Send to first player (host)
          const room = this.roomManager.getRoom(roomCode);
          if (room?.players[0]) {
            nsp.to(room.players[0].id).emit(event.type, event.data);
          }
          break;
      }
    }
    
    // Always broadcast room update after events
    this.broadcastRoomUpdate(roomCode);
  }

  private handleTimerEvents(roomCode: string, events: GameEvent[]) {
    const nsp = this.getMainServer();
    if (!nsp) return;
    
    // Send timer events to specific room
    for (const event of events) {
      if (event.type === EventType.TIMER) {
        nsp.to(roomCode).emit(event.type, event.data);
      }
    }
  }

  private broadcastRoomUpdate(roomCode: string) {
    const room = this.roomManager.getRoomSafe(roomCode);
    if (room) {
      this.eventBroadcaster.broadcastRoomUpdate(roomCode, room);
    }
  }



  private sendMidGameContext(client: Socket, room: any) {
    this.eventBroadcaster.sendMidGameContext(client.id, room);
  }

  private codeFromNs(client: Socket) {
    const roomCode = client.handshake.query.roomCode as string;
    if (!roomCode) {
      throw new RoomCodeRequiredError();
    }
    
    // Validate room code format
    this.errorHandler.validateRoomCode(roomCode);
    
    return roomCode;
  }
}
