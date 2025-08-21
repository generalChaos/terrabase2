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

@WebSocketGateway({ namespace: '/rooms', cors: { origin: '*' } })
export class RoomsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() nsp!: Namespace;
  private isReady = false;

  constructor(
    private roomManager: RoomManager,
    private timerService: TimerService,
    private errorHandler: ErrorHandlerService
  ) {}

  afterInit(nsp: Namespace) {
    console.log('🚀 afterInit');
    console.log('nsp.constructor:', nsp?.constructor?.name);
    this.isReady = true;

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

  handleConnection(client: Socket) {
    try {
      const code = this.codeFromNs(client);
      console.log(`🔌 Player connected to room ${code} (ID: ${client.id})`);
      
      if (!this.roomManager.hasRoom(code)) {
        console.log(`🏠 Creating new room: ${code}`);
        this.roomManager.createRoom(code, GAME_TYPES.BLUFF_TRIVIA);
      }
      
      const room = this.roomManager.getRoomSafe(code);
      if (room) {
        // Check if this is a reconnection of the host
        if (room.hostId && room.players.some(p => p.id === room.hostId && !p.connected)) {
          const hostPlayer = room.players.find(p => p.id === room.hostId);
          if (hostPlayer) {
            console.log(`🔄 Host ${hostPlayer.name} reconnecting, updating socket ID from ${room.hostId} to ${client.id}`);
            // Use the new async method
            this.roomManager.updatePlayerSocketId(code, room.hostId, client.id);
            this.broadcastRoomUpdate(code);
          }
        }
        
        // Check if this is a reconnection of any other player
        // Look for disconnected players and update their socket ID
        const disconnectedPlayer = room.players.find(p => !p.connected);
        if (disconnectedPlayer) {
          console.log(`🔄 Player ${disconnectedPlayer.name} reconnecting, updating socket ID from ${disconnectedPlayer.id} to ${client.id}`);
          // Use the new async method
          this.roomManager.updatePlayerSocketId(code, disconnectedPlayer.id, client.id);
          this.broadcastRoomUpdate(code);
        }
        
        console.log(`🏠 Sending room state to ${client.id}:`, room);
        client.emit('room', this.serializeRoom(room));
      }
    } catch (error) {
      const errorResponse = this.errorHandler.handleWebSocketError(error, 'connection', client.id);
      console.error(`❌ Error in handleConnection:`, errorResponse);
      client.emit('error', errorResponse);
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const code = this.codeFromNs(client);
      console.log(`🔌 Player disconnected from room ${code} (ID: ${client.id})`);
      
      const room = this.roomManager.getRoomSafe(code);
      if (room) {
        const player = room.players.find(p => p.id === client.id);
        if (player) {
          // Use the new async method
          this.roomManager.updatePlayerConnection(code, client.id, false);
          this.broadcastRoomUpdate(code);
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
      
      const room = this.roomManager.getRoomSafe(code);
      if (!room) {
        throw new RoomNotFoundError(code);
      }
      
      // Check if this is a reconnection of an existing player
      const existingPlayer = room.players.find(p => p.name === body.nickname);
      if (existingPlayer && !existingPlayer.connected) {
        // Player is reconnecting - update their socket ID and connection status
        console.log(`🔄 Player ${body.nickname} reconnecting, updating socket ID from ${existingPlayer.id} to ${client.id}`);
        await this.roomManager.updatePlayerSocketId(code, existingPlayer.id, client.id);
        
        console.log(`✅ Player ${body.nickname} reconnected to room ${code}`);
        client.emit('joined', { ok: true });
        
        this.broadcastRoomUpdate(code);
        
        // Send additional context for mid-game joins
        if (room.gameState.phase !== 'lobby') {
          this.sendMidGameContext(client, room);
        }
        return;
      }
      
      // Check if name is already taken by a connected player
      if (existingPlayer && existingPlayer.connected) {
        throw new PlayerNameTakenError(body.nickname, code);
      }
      
      // New player joining
      const newPlayer: Player = {
        id: client.id,
        name: body.nickname,
        avatar: body.avatar,
        connected: true,
        score: 0,
      };
      
      const success = await this.roomManager.addPlayer(code, newPlayer);
      if (!success) {
        throw new GameError('Failed to add player to room', 'JOIN_FAILED', 500, { roomCode: code, player: newPlayer });
      }
      
      console.log(`✅ Player ${body.nickname} joined room ${code}`);
      client.emit('joined', { ok: true });
      
      this.broadcastRoomUpdate(code);
      
      // Send additional context for mid-game joins
      if (room.gameState.phase !== 'lobby') {
        this.sendMidGameContext(client, room);
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
      
      // Start timer for prompt phase with proper callbacks
      this.timerService.startTimer(code, GAME_PHASE_DURATIONS.PROMPT, {
        onExpire: () => this.handlePhaseTransition(code),
        onTick: (events) => this.handleTimerTick(code)
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

  @SubscribeMessage('submitBluff')
  async onBluff(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { text: string },
  ) {
    try {
      // Validate input
      this.errorHandler.validateInput(body.text, 'text', 'submitBluff');
      
      const code = this.codeFromNs(client);
      const room = this.roomManager.getRoomSafe(code);
      
      if (!room) {
        throw new RoomNotFoundError(code);
      }
      
      if (room.gameState.phase !== 'prompt') {
        throw new InvalidGamePhaseError(room.gameState.phase, 'prompt');
      }
      
      const action: GameAction = {
        type: 'submitBluff',
        playerId: client.id,
        data: { text: body.text }
      };
      
      const events = await this.roomManager.processGameAction(code, client.id, action);
      this.handleGameEvents(code, events);
      
    } catch (error) {
      const errorResponse = this.errorHandler.handleWebSocketError(error, 'submitBluff', client.id);
      console.error(`❌ Error in submitBluff:`, errorResponse);
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
          onTick: (events) => this.handleTimerTick(roomCode)
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
          nsp.emit(event.type, event.data);
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
    
    // Only send timer events, not full room updates
    for (const event of events) {
      if (event.type === EventType.TIMER) {
        nsp.emit(event.type, event.data);
      }
    }
  }

  private broadcastRoomUpdate(roomCode: string) {
    const nsp = this.getMainServer();
    if (!nsp) return;
    
    const room = this.roomManager.getRoom(roomCode);
    if (room) {
      nsp.emit('room', this.serializeRoom(room));
    }
  }

  private serializeRoom(room: ImmutableRoomState) {
    return {
      code: room.code,
      phase: room.phase,
      round: room.gameState.round,
      maxRounds: room.gameState.maxRounds,
      timeLeft: room.gameState.timeLeft,
      players: room.players.map((p: Player) => ({ ...p })),
      current: room.gameState.currentRound, // Use currentRound instead of current
      hostId: room.hostId,
    };
  }

  private sendMidGameContext(client: Socket, room: any) {
    if (room.gameState.current) {
      client.emit('prompt', { question: room.gameState.current.question });
      
      if (room.gameState.phase === 'choose' || room.gameState.phase === 'scoring') {
        // Generate choices for the current round
        const choices = this.generateChoices(room.gameState.current);
        client.emit('choices', { choices });
      }
      
      if (room.gameState.phase === 'scoring') {
        client.emit('scores', {
          totals: room.players.map((p: Player) => ({
            playerId: p.id,
            score: p.score,
          })),
        });
      }
    }
  }

  private generateChoices(round: any): Array<{ id: string; text: string }> {
    if (!round) return [];
    
    const truth = { id: `TRUE::${round.promptId}`, text: round.answer };
    const bluffChoices = round.bluffs.map((b: any) => ({ id: b.id, text: b.text }));
    
    // Simple shuffle for now
    const allChoices = [truth, ...bluffChoices];
    for (let i = allChoices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
    }
    
    return allChoices;
  }

  private codeFromNs(client: Socket): string {
    const roomCode = client.handshake.query.roomCode as string;
    if (!roomCode) {
      throw new RoomCodeRequiredError();
    }
    
    // Validate room code format
    this.errorHandler.validateRoomCode(roomCode);
    
    return roomCode;
  }
}
