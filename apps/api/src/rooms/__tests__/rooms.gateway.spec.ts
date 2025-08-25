import { Test, TestingModule } from '@nestjs/testing';
import { RoomsGateway } from '../rooms.gateway';
import { ConnectionGatewayService } from '../services/connection-gateway.service';
import { GameGatewayService } from '../services/game-gateway.service';
import { RoomManager } from '../room-manager';
import { EventBroadcasterService } from '../services/event-broadcaster.service';
import { ErrorHandlerService } from '../error-handler.service';
import { Socket } from 'socket.io';
import { Result, success, failure, GameEvent } from '@party/types';
import { TimerService } from '../timer.service';
import { ConnectionManagerService } from '../services/connection-manager.service';
import { EventGatewayService } from '../services/event-gateway.service';

describe('RoomsGateway', () => {
  let gateway: RoomsGateway;
  let connectionGateway: jest.Mocked<ConnectionGatewayService>;
  let gameGateway: jest.Mocked<GameGatewayService>;
  let roomManager: jest.Mocked<RoomManager>;
  let eventBroadcaster: jest.Mocked<EventBroadcasterService>;
  let errorHandler: jest.Mocked<ErrorHandlerService>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(async () => {
    mockSocket = {
      id: 'test-socket-id',
      nsp: {
        name: '/rooms/TEST123',
      },
      handshake: {
        query: {
          roomCode: 'TEST123',
        },
      },
      emit: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsGateway,
        {
          provide: RoomManager,
          useValue: {
            getRoom: jest.fn(),
          },
        },
        {
          provide: TimerService,
          useValue: {
            startTimer: jest.fn(),
            stopTimer: jest.fn(),
            updateTimer: jest.fn(),
            getTimeLeft: jest.fn(),
          },
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            createWebSocketErrorResponse: jest.fn(),
            validateRoomCode: jest.fn().mockReturnValue({ isFailure: () => false }),
          },
        },
        {
          provide: ConnectionManagerService,
          useValue: {
            handleConnection: jest.fn(),
            handleDisconnection: jest.fn(),
            handlePlayerJoin: jest.fn(),
          },
        },
        {
          provide: EventBroadcasterService,
          useValue: {
            broadcastEvents: jest.fn(),
            setNamespace: jest.fn(),
          },
        },
        {
          provide: ConnectionGatewayService,
          useValue: {
            handleConnection: jest.fn(),
            handleDisconnection: jest.fn(),
            handlePlayerJoin: jest.fn(),
          },
        },
        {
          provide: GameGatewayService,
          useValue: {
            startGame: jest.fn(),
            submitAnswer: jest.fn(),
          },
        },
        {
          provide: EventGatewayService,
          useValue: {
            handleGameEvent: jest.fn(),
            handleTimerEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<RoomsGateway>(RoomsGateway);
    connectionGateway = module.get(ConnectionGatewayService);
    gameGateway = module.get(GameGatewayService);
    roomManager = module.get(RoomManager);
    eventBroadcaster = module.get(EventBroadcasterService);
    errorHandler = module.get(ErrorHandlerService);
  });

  describe('handleConnection', () => {
    it('should handle connection through connection gateway', async () => {
      await gateway.handleConnection(mockSocket);

      expect(connectionGateway.handleConnection).toHaveBeenCalledWith(mockSocket);
    });
  });

  describe('handleDisconnect', () => {
    it('should handle disconnection through connection gateway', async () => {
      await gateway.handleDisconnect(mockSocket);

      expect(connectionGateway.handleDisconnection).toHaveBeenCalledWith(mockSocket);
    });

    it('should handle disconnection errors gracefully', async () => {
      connectionGateway.handleDisconnection.mockRejectedValue(new Error('Connection error'));

      await expect(gateway.handleDisconnect(mockSocket)).rejects.toThrow(
        'Connection error',
      );
    });
  });

  describe('join', () => {
    it('should handle player join through connection gateway', async () => {
      const joinData = { nickname: 'TestPlayer', avatar: '😀' };

      await gateway.join(mockSocket, joinData);

      expect(connectionGateway.handlePlayerJoin).toHaveBeenCalledWith(mockSocket, joinData);
    });
  });

  describe('startGame', () => {
    it('should start game successfully and broadcast events', async () => {
      const mockEvents: GameEvent[] = [
        { 
          type: 'gameStarted', 
          data: { phase: 'prompt' }, 
          timestamp: Date.now(),
          target: 'room'
        },
      ];
      const mockResult = success({ events: mockEvents });
      const mockRoom = { code: 'TEST123', players: [{ id: 'test-socket-id' }] };

      gameGateway.startGame.mockResolvedValue(mockResult);
      roomManager.getRoom.mockReturnValue(mockRoom as any);

      await gateway.start(mockSocket);

      expect(gameGateway.startGame).toHaveBeenCalledWith(mockSocket, 'TEST123');
      expect(eventBroadcaster.broadcastEvents).toHaveBeenCalledWith({
        roomCode: 'TEST123',
        events: mockEvents,
        roomState: mockRoom,
      });
    });

    it('should handle game start failure and emit error', async () => {
      const mockError = new Error('Game start failed');
      const mockResult = failure(mockError);
      const mockErrorResponse = { 
        error: 'Game start failed', 
        code: 'GAME_START_ERROR',
        statusCode: 400,
        details: {},
        context: 'startGame',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'VALIDATION' as any,
        retryable: false,
        userActionRequired: false
      };

      gameGateway.startGame.mockResolvedValue(mockResult);
      errorHandler.createWebSocketErrorResponse.mockReturnValue(mockErrorResponse);

      await gateway.start(mockSocket);

      expect(gameGateway.startGame).toHaveBeenCalledWith(mockSocket, 'TEST123');
      expect(errorHandler.createWebSocketErrorResponse).toHaveBeenCalledWith(
        mockError,
        'startGame',
        'test-socket-id',
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('error', mockErrorResponse);
    });

    it('should handle unexpected errors during game start', async () => {
      const mockError = new Error('Unexpected error');
      const mockErrorResponse = { 
        error: 'Unexpected error', 
        code: 'UNEXPECTED_ERROR',
        statusCode: 500,
        details: {},
        context: 'startGame',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'SYSTEM' as any,
        retryable: false,
        userActionRequired: false
      };

      gameGateway.startGame.mockRejectedValue(mockError);
      errorHandler.createWebSocketErrorResponse.mockReturnValue(mockErrorResponse);

      await gateway.start(mockSocket);

      expect(errorHandler.createWebSocketErrorResponse).toHaveBeenCalledWith(
        mockError,
        'startGame',
        'test-socket-id',
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('error', mockErrorResponse);
    });
  });

  describe('submitAnswer', () => {
    it('should handle answer submission successfully', async () => {
      const mockResult = success(undefined);
      const answerData = { answer: 'Test answer' };

      gameGateway.submitAnswer.mockResolvedValue(mockResult);

      await gateway.onAnswer(mockSocket, answerData);

      expect(gameGateway.submitAnswer).toHaveBeenCalledWith(mockSocket, 'TEST123', answerData);
    });

    it('should handle answer submission failure and emit error', async () => {
      const mockError = new Error('Answer submission failed');
      const mockResult = failure(mockError);
      const mockErrorResponse = { 
        error: 'Answer submission failed', 
        code: 'ANSWER_ERROR',
        statusCode: 400,
        details: {},
        context: 'submitAnswer',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'VALIDATION' as any,
        retryable: false,
        userActionRequired: false
      };
      const answerData = { answer: 'Test answer' };

      gameGateway.submitAnswer.mockResolvedValue(mockResult);
      errorHandler.createWebSocketErrorResponse.mockReturnValue(mockErrorResponse);

      await gateway.onAnswer(mockSocket, answerData);

      expect(gameGateway.submitAnswer).toHaveBeenCalledWith(mockSocket, 'TEST123', answerData);
      expect(errorHandler.createWebSocketErrorResponse).toHaveBeenCalledWith(
        mockError,
        'submitAnswer',
        'test-socket-id',
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('error', mockErrorResponse);
    });

    it('should handle unexpected errors during answer submission', async () => {
      const mockError = new Error('Unexpected error');
      const mockErrorResponse = { 
        error: 'Unexpected error', 
        code: 'UNEXPECTED_ERROR',
        statusCode: 500,
        details: {},
        context: 'submitAnswer',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'SYSTEM' as any,
        retryable: false,
        userActionRequired: false
      };
      const answerData = { answer: 'Test answer' };

      gameGateway.submitAnswer.mockRejectedValue(mockError);
      errorHandler.createWebSocketErrorResponse.mockReturnValue(mockErrorResponse);

      await gateway.onAnswer(mockSocket, answerData);

      expect(errorHandler.createWebSocketErrorResponse).toHaveBeenCalledWith(
        mockError,
        'submitAnswer',
        'test-socket-id',
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('error', mockErrorResponse);
    });
  });

  describe('codeFromNs', () => {
    it('should extract room code from namespace', () => {
      const roomCode = (gateway as any).codeFromNs(mockSocket);
      expect(roomCode).toBe('TEST123');
    });
  });
});
