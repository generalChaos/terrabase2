import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionGatewayService } from '../connection-gateway.service';
import { ConnectionManagerService } from '../connection-manager.service';
import { RoomManager } from '../../room-manager';
import { ErrorHandlerService } from '../../error-handler.service';
import { EventGatewayService } from '../event-gateway.service';
import { ImmutableRoomState } from '../../state/room.state';
import { Player, Result, success } from '@party/types';
import { Socket } from 'socket.io';

describe('ConnectionGatewayService - Integration Tests', () => {
  let service: ConnectionGatewayService;
  let connectionManager: jest.Mocked<ConnectionManagerService>;
  let roomManager: jest.Mocked<RoomManager>;
  let errorHandler: jest.Mocked<ErrorHandlerService>;
  let eventGateway: jest.Mocked<EventGatewayService>;

  // Simple mock socket
  const createMockSocket = (roomCode?: string): jest.Mocked<Socket> => ({
    id: 'test-socket-id',
    handshake: {
      query: roomCode ? { roomCode } : {},
    },
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    nsp: { name: '/rooms' } as any,
    client: {} as any,
    recovered: false,
    data: {} as any,
  } as any);

  // Simple mock room
  const createMockRoom = () => {
    const mockPlayer: Player = {
      id: 'test-socket-id',
      name: 'TestPlayer',
      avatar: '😀',
      connected: true,
      score: 0,
    };

    return new ImmutableRoomState(
      'TEST123',
      'bluff-trivia',
      {
        phase: 'lobby',
        players: [mockPlayer],
        round: 1,
        maxRounds: 5,
        timeLeft: 0,
        scores: new Map(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isRoundComplete: false,
        phaseStartTime: new Date(),
      },
      [mockPlayer],
      'lobby',
      'test-socket-id',
      new Date(),
      1,
    );
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionGatewayService,
        {
          provide: ConnectionManagerService,
          useValue: {
            handleConnection: jest.fn(),
            handleDisconnection: jest.fn(),
            handlePlayerJoin: jest.fn(),
          },
        },
        {
          provide: RoomManager,
          useValue: {
            getRoomSafe: jest.fn(),
            hasRoom: jest.fn(),
          },
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            validateRoomCode: jest.fn(),
            validateNickname: jest.fn(),
            createWebSocketErrorResponse: jest.fn(),
          },
        },
        {
          provide: EventGatewayService,
          useValue: {
            broadcastRoomUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConnectionGatewayService>(ConnectionGatewayService);
    connectionManager = module.get(ConnectionManagerService) as jest.Mocked<ConnectionManagerService>;
    roomManager = module.get(RoomManager) as jest.Mocked<RoomManager>;
    errorHandler = module.get(ErrorHandlerService) as jest.Mocked<ErrorHandlerService>;
    eventGateway = module.get(EventGatewayService) as jest.Mocked<EventGatewayService>;
  });

  describe('handleConnection - Basic Flow', () => {
    it('should handle successful connection with minimal mocking', async () => {
      const mockSocket = createMockSocket('TEST123');
      const mockRoom = createMockRoom();

      // Set up minimal mocks
      errorHandler.validateRoomCode.mockReturnValue(success(undefined));
      connectionManager.handleConnection.mockResolvedValue({
        success: true,
        room: mockRoom,
        isReconnection: false,
      });

      // Test the service
      const result = await service.handleConnection(mockSocket);

      // Log what happened
      console.log('Test result:', result);
      console.log('Socket emit calls:', mockSocket.emit.mock.calls);
      console.log('Socket join calls:', mockSocket.join.mock.calls);

      // Basic assertions
      expect(mockSocket.join).toHaveBeenCalledWith('TEST123');
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', {
        roomCode: 'TEST123',
        playerId: 'test-socket-id',
      });
    });

    it('should handle connection failure with minimal mocking', async () => {
      const mockSocket = createMockSocket('TEST123');

      // Set up minimal mocks
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
      connectionManager.handleConnection.mockResolvedValue({
        success: false,
        room: null,
        isReconnection: false,
        error: 'Room not found',
      });

      // Test the service
      const result = await service.handleConnection(mockSocket);

      // Log what happened
      console.log('Test result:', result);
      console.log('Socket emit calls:', mockSocket.emit.mock.calls);

      // Basic assertions
      expect(result.isFailure()).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.any(Object));
    });

    it('should handle missing room code', async () => {
      const mockSocket = createMockSocket(); // No room code

      // Set up error handler mock for missing room code
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

      // Test the service
      const result = await service.handleConnection(mockSocket);

      // Log what happened
      console.log('Test result:', result);
      console.log('Socket emit calls:', mockSocket.emit.mock.calls);

      // Basic assertions
      expect(result.isFailure()).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.any(Object));
    });
  });

  describe('handlePlayerJoin - Basic Flow', () => {
    it('should handle successful player join with minimal mocking', async () => {
      const mockSocket = createMockSocket('TEST123');
      const mockRoom = createMockRoom();
      const joinData = { nickname: 'TestPlayer', avatar: '😀' };

      // Set up minimal mocks
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
      connectionManager.handlePlayerJoin.mockResolvedValue({
        success: true,
        room: mockRoom,
        isReconnection: false,
      });

      // Test the service
      const result = await service.handlePlayerJoin(mockSocket, joinData);

      // Log what happened
      console.log('Test result:', result);
      console.log('Socket emit calls:', mockSocket.emit.mock.calls);

      // Basic assertions
      expect(result.isSuccess()).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('joined', expect.objectContaining({
        roomCode: 'TEST123',
        playerId: 'test-socket-id',
        nickname: 'TestPlayer',
        avatar: '😀',
      }));
    });
  });
});
