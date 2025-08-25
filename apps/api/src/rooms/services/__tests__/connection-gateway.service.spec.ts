import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionGatewayService } from '../connection-gateway.service';
import { ConnectionManagerService } from '../connection-manager.service';
import { EventBroadcasterService } from '../event-broadcaster.service';
import { RoomManager } from '../../room-manager';
import { ErrorHandlerService } from '../../error-handler.service';
import { EventGatewayService } from '../event-gateway.service';
import { Socket } from 'socket.io';
import { ImmutableRoomState } from '../../state/room.state';
import { Player } from '@party/types';
import { success, failure, ErrorCategory } from '@party/types';

describe('ConnectionGatewayService', () => {
  let service: ConnectionGatewayService;
  let connectionManager: jest.Mocked<ConnectionManagerService>;
  let roomManager: jest.Mocked<RoomManager>;
  let errorHandler: jest.Mocked<ErrorHandlerService>;
  let eventGateway: jest.Mocked<EventGatewayService>;

  const mockSocket = {
    id: 'socket-1',
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    to: jest.fn().mockReturnThis(),
    handshake: {
      query: { roomCode: 'TEST123' },
    },
  } as any;

  const mockPlayer: Player = {
    id: 'player-1',
    name: 'TestPlayer',
    avatar: '😀',
    score: 0,
    connected: true,
  };

  const mockRoom: ImmutableRoomState = {
    code: 'TEST123',
    gameType: 'fibbing-it',
    phase: 'lobby',
    players: [mockPlayer],
    hostId: 'player-1',
    round: 1,
    maxRounds: 5,
    current: null,
    timer: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    withPlayerAdded: jest.fn(),
    withPlayerRemoved: jest.fn(),
    withPlayerUpdated: jest.fn(),
    withPhaseChanged: jest.fn(),
    withRoundAdvanced: jest.fn(),
    withTimerUpdated: jest.fn(),
    withCurrentUpdated: jest.fn(),
  } as any;

  beforeEach(async () => {
    const mockConnectionManager = {
      handleConnection: jest.fn(),
      handleDisconnection: jest.fn(),
      handlePlayerJoin: jest.fn(),
    };

    const mockRoomManager = {
      getRoomSafe: jest.fn(),
      hasRoom: jest.fn(),
      createRoom: jest.fn(),
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
    };

    const mockErrorHandler = {
      validateRoomCode: jest.fn(),
      validateNickname: jest.fn(),
      createWebSocketErrorResponse: jest.fn(),
    };

    const mockEventGateway = {
      broadcastRoomUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionGatewayService,
        {
          provide: ConnectionManagerService,
          useValue: mockConnectionManager,
        },
        {
          provide: RoomManager,
          useValue: mockRoomManager,
        },
        {
          provide: ErrorHandlerService,
          useValue: mockErrorHandler,
        },
        {
          provide: EventGatewayService,
          useValue: mockEventGateway,
        },
      ],
    }).compile();

    service = module.get<ConnectionGatewayService>(ConnectionGatewayService);
    
    // Assign the mocks for test assertions
    connectionManager = mockConnectionManager as any;
    roomManager = mockRoomManager as any;
    errorHandler = mockErrorHandler as any;
    eventGateway = mockEventGateway as any;

    // Reset socket mocks between tests for proper isolation
    mockSocket.emit.mockClear();
    mockSocket.join.mockClear();
    mockSocket.leave.mockClear();
    mockSocket.disconnect.mockClear();
    mockSocket.to.mockClear();
  });

  afterEach(() => {
    // Ensure complete cleanup after each test
    jest.clearAllTimers();
    
    // Don't clear mocks - this was causing the isolation issue!
    // jest.clearAllMocks(); // REMOVED THIS LINE
  });

  describe('handleConnection', () => {
    it('should handle successful connection', async () => {
      const mockResult = {
        success: true,
        room: mockRoom,
        isReconnection: false,
      };

      errorHandler.validateRoomCode.mockReturnValue(success(undefined));
      connectionManager.handleConnection.mockResolvedValue(mockResult);
      eventGateway.broadcastRoomUpdate.mockResolvedValue(success(undefined));

      const result = await service.handleConnection(mockSocket);

      expect(result.isSuccess()).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith('TEST123');
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', {
        roomCode: 'TEST123',
        playerId: 'socket-1',
      });
    });

    it('should handle connection failure', async () => {
      const mockResult = {
        success: false,
        room: null,
        isReconnection: false,
        error: 'Room not found',
      };

      errorHandler.validateRoomCode.mockReturnValue(success(undefined));
      errorHandler.createWebSocketErrorResponse.mockReturnValue({
        error: 'Room not found',
        code: 'CONNECTION_ERROR',
        statusCode: 500,
        details: undefined,
        context: 'connection',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'SYSTEM' as any,
        retryable: true,
        userActionRequired: false,
      });
      connectionManager.handleConnection.mockResolvedValue(mockResult);

      const result = await service.handleConnection(mockSocket);

      expect(result.isFailure()).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error: 'Room not found',
        code: 'CONNECTION_ERROR',
      }));
    });

    it('should handle connection errors', async () => {
      errorHandler.validateRoomCode.mockReturnValue(success(undefined));
      errorHandler.createWebSocketErrorResponse.mockReturnValue({
        error: 'Connection failed',
        code: 'CONNECTION_ERROR',
        statusCode: 500,
        details: undefined,
        context: 'connection',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'SYSTEM' as any,
        retryable: true,
        userActionRequired: false,
      });
      connectionManager.handleConnection.mockRejectedValue(new Error('Connection failed'));

      const result = await service.handleConnection(mockSocket);

      expect(result.isFailure()).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error: 'Connection failed',
        code: 'CONNECTION_ERROR',
      }));
    });

    it('should handle missing room code', async () => {
      const socketWithoutRoomCode = {
        ...mockSocket,
        handshake: { query: {} },
      };

      errorHandler.createWebSocketErrorResponse.mockReturnValue({
        error: 'Room code is required',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: undefined,
        context: 'connection',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'VALIDATION' as any,
        retryable: false,
        userActionRequired: true,
      });

      const result = await service.handleConnection(socketWithoutRoomCode);

      expect(result.isFailure()).toBe(true);
      expect(socketWithoutRoomCode.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error: 'Room code is required',
        code: 'VALIDATION_ERROR',
      }));
    });
  });

  describe('handleDisconnection', () => {
    it('should handle successful disconnection', async () => {
      roomManager.getRoomSafe.mockReturnValue(mockRoom);
      eventGateway.broadcastRoomUpdate.mockResolvedValue(success(undefined));

      const result = await service.handleDisconnection(mockSocket);

      expect(result.isSuccess()).toBe(true);
      expect(connectionManager.handleDisconnection).toHaveBeenCalledWith(
        'TEST123',
        'socket-1',
      );
      expect(eventGateway.broadcastRoomUpdate).toHaveBeenCalledWith('TEST123', mockRoom);
    });

    it('should handle disconnection failure', async () => {
      connectionManager.handleDisconnection.mockRejectedValue(new Error('Disconnection failed'));

      const result = await service.handleDisconnection(mockSocket);

      expect(result.isFailure()).toBe(true);
      // Should still attempt to handle disconnection even if it fails
    });

    it('should handle disconnection errors', async () => {
      connectionManager.handleDisconnection.mockRejectedValue(new Error('Disconnection failed'));

      const result = await service.handleDisconnection(mockSocket);

      expect(result.isFailure()).toBe(true);
      // Should still attempt to handle disconnection even if it fails
    });
  });

  describe('handlePlayerJoin', () => {
    const joinData = {
      nickname: 'TestPlayer',
      avatar: '😀',
    };

    it('should handle successful player join', async () => {
      const mockResult = {
        success: true,
        room: mockRoom,
        isReconnection: false,
      };

      errorHandler.validateRoomCode.mockReturnValue(success(undefined));
      errorHandler.validateNickname.mockReturnValue(success(undefined));
      eventGateway.broadcastRoomUpdate.mockResolvedValue(success(undefined));
      connectionManager.handlePlayerJoin.mockResolvedValue(mockResult);

      const result = await service.handlePlayerJoin(mockSocket, joinData);

      expect(result.isSuccess()).toBe(true);
      expect(connectionManager.handlePlayerJoin).toHaveBeenCalledWith(
        'TEST123',
        'socket-1',
        'TestPlayer',
        '😀',
      );
      expect(eventGateway.broadcastRoomUpdate).toHaveBeenCalledWith('TEST123', mockRoom);
      expect(mockSocket.emit).toHaveBeenCalledWith('joined', expect.objectContaining({
        roomCode: 'TEST123',
        playerId: 'socket-1',
        nickname: 'TestPlayer',
        avatar: '😀',
      }));
    });

    it('should handle player join failure', async () => {
      const mockResult = {
        success: false,
        room: null,
        isReconnection: false,
        error: 'Player name already taken',
      };

      errorHandler.validateRoomCode.mockReturnValue(success(undefined));
      errorHandler.validateNickname.mockReturnValue(success(undefined));
      errorHandler.createWebSocketErrorResponse.mockReturnValue({
        error: 'Player name already taken',
        code: 'CONNECTION_ERROR',
        statusCode: 500,
        details: undefined,
        context: 'player-join',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'SYSTEM' as any,
        retryable: true,
        userActionRequired: false,
      });
      connectionManager.handlePlayerJoin.mockResolvedValue(mockResult);

      const result = await service.handlePlayerJoin(mockSocket, joinData);

      expect(result.isFailure()).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error: 'Player name already taken',
        code: 'CONNECTION_ERROR',
      }));
    });

    it('should handle player reconnection', async () => {
      const mockResult = {
        success: true,
        room: mockRoom,
        isReconnection: true,
      };

      errorHandler.validateRoomCode.mockReturnValue(success(undefined));
      errorHandler.validateNickname.mockReturnValue(success(undefined));
      eventGateway.broadcastRoomUpdate.mockResolvedValue(success(undefined));
      connectionManager.handlePlayerJoin.mockResolvedValue(mockResult);

      const result = await service.handlePlayerJoin(mockSocket, joinData);

      expect(result.isSuccess()).toBe(true);
      expect(eventGateway.broadcastRoomUpdate).toHaveBeenCalledWith('TEST123', mockRoom);
    });

    it('should handle join errors', async () => {
      errorHandler.validateRoomCode.mockReturnValue(success(undefined));
      errorHandler.validateNickname.mockReturnValue(success(undefined));
      errorHandler.createWebSocketErrorResponse.mockReturnValue({
        error: 'Join failed',
        code: 'CONNECTION_ERROR',
        statusCode: 500,
        details: undefined,
        context: 'player-join',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'SYSTEM' as any,
        retryable: true,
        userActionRequired: false,
      });
      connectionManager.handlePlayerJoin.mockRejectedValue(new Error('Join failed'));

      const result = await service.handlePlayerJoin(mockSocket, joinData);

      expect(result.isFailure()).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error: 'Join failed',
        code: 'CONNECTION_ERROR',
      }));
    });

    it('should handle missing nickname', async () => {
      const invalidJoinData = { nickname: undefined, avatar: '😀' } as any;

      errorHandler.validateRoomCode.mockReturnValue(success(undefined));
      errorHandler.validateNickname.mockReturnValue(failure({
        message: 'Nickname is required',
        error: 'Nickname is required',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: undefined,
        context: 'player-join',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'VALIDATION' as any,
        retryable: false,
        userActionRequired: true,
      }));
      errorHandler.createWebSocketErrorResponse.mockReturnValue({
        error: 'Nickname is required',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: undefined,
        context: 'player-join',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'VALIDATION' as any,
        retryable: false,
        userActionRequired: true,
      });

      const result = await service.handlePlayerJoin(mockSocket, invalidJoinData);

      expect(result.isFailure()).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error: 'Nickname is required',
        code: 'VALIDATION_ERROR',
      }));
    });

    it('should handle empty nickname', async () => {
      const invalidJoinData = { nickname: '', avatar: '😀' };

      errorHandler.validateRoomCode.mockReturnValue(success(undefined));
      errorHandler.validateNickname.mockReturnValue(failure({
        message: 'Nickname cannot be empty',
        error: 'Nickname cannot be empty',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: undefined,
        context: 'player-join',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'VALIDATION' as any,
        retryable: false,
        userActionRequired: true,
      }));
      errorHandler.createWebSocketErrorResponse.mockReturnValue({
        error: 'Nickname cannot be empty',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: undefined,
        context: 'player-join',
        timestamp: new Date().toISOString(),
        requestId: undefined,
        category: 'VALIDATION' as any,
        retryable: false,
        userActionRequired: true,
      });

      const result = await service.handlePlayerJoin(mockSocket, invalidJoinData);

      expect(result.isFailure()).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        error: 'Nickname cannot be empty',
        code: 'VALIDATION_ERROR',
      }));
    });
  });


});
