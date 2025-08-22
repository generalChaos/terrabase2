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
    connectionManager = module.get(ConnectionManagerService);
    roomManager = module.get(RoomManager);
    errorHandler = module.get(ErrorHandlerService);
    eventGateway = module.get(EventGatewayService);
  });

  describe('handleConnection', () => {
    it('should handle successful connection', async () => {
      // Mock validation methods
      errorHandler.validateRoomCode.mockReturnValue({ isFailure: () => false });
      
      connectionManager.handleConnection.mockResolvedValue({
        success: true,
        room: mockRoom,
        isReconnection: false,
      });

      await service.handleConnection(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('TEST123');
      expect(connectionManager.handleConnection).toHaveBeenCalledWith(
        'TEST123',
        'socket-1'
      );
    });

    it('should handle connection failure', async () => {
      // Mock validation methods
      errorHandler.validateRoomCode.mockReturnValue({ isFailure: () => false });
      errorHandler.createWebSocketErrorResponse.mockReturnValue({
        message: 'Room not found',
      });
      
      connectionManager.handleConnection.mockResolvedValue({
        success: false,
        room: null,
        isReconnection: false,
        error: 'Room not found',
      });

      await service.handleConnection(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Room not found',
      });
    });

    it('should handle connection errors', async () => {
      connectionManager.handleConnection.mockRejectedValue(
        new Error('Connection failed')
      );

      await service.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Connection failed',
      });
    });

    it('should handle missing room code', async () => {
      const socketWithoutRoomCode = {
        ...mockSocket,
        handshake: { query: {} },
      };

      await service.handleConnection(socketWithoutRoomCode);

      expect(socketWithoutRoomCode.disconnect).toHaveBeenCalled();
      expect(socketWithoutRoomCode.emit).toHaveBeenCalledWith('error', {
        message: 'Room code is required',
      });
    });
  });

  describe('handleDisconnection', () => {
    it('should handle successful disconnection', async () => {
      connectionManager.handleDisconnection.mockResolvedValue(true);

      await service.handleDisconnection(mockSocket);

      expect(mockSocket.leave).toHaveBeenCalledWith('TEST123');
      expect(connectionManager.handleDisconnection).toHaveBeenCalledWith(
        'TEST123',
        'socket-1'
      );
    });

    it('should handle disconnection failure', async () => {
      connectionManager.handleDisconnection.mockResolvedValue(false);

      await service.handleDisconnection(mockSocket);

      expect(mockSocket.leave).toHaveBeenCalledWith('TEST123');
      // Should still leave the room even if disconnection handling fails
    });

    it('should handle disconnection errors', async () => {
      connectionManager.handleDisconnection.mockRejectedValue(
        new Error('Disconnection failed')
      );

      await service.handleDisconnection(mockSocket);

      expect(mockSocket.leave).toHaveBeenCalledWith('TEST123');
      // Should still leave the room even if disconnection handling fails
    });
  });

  describe('handlePlayerJoin', () => {
    const joinData = {
      nickname: 'TestPlayer',
      avatar: '😀',
    };

    it('should handle successful player join', async () => {
      connectionManager.handlePlayerJoin.mockResolvedValue({
        success: true,
        room: mockRoom,
        isReconnection: false,
      });

      await service.handlePlayerJoin(mockSocket, joinData);

      expect(connectionManager.handlePlayerJoin).toHaveBeenCalledWith(
        'TEST123',
        'socket-1',
        'TestPlayer',
        '😀'
      );
      expect(eventGateway.broadcastRoomUpdate).toHaveBeenCalledWith(
        'TEST123',
        mockRoom
      );
    });

    it('should handle player join failure', async () => {
      connectionManager.handlePlayerJoin.mockResolvedValue({
        success: false,
        room: null,
        isReconnection: false,
        error: 'Player name already taken',
      });

      await service.handlePlayerJoin(mockSocket, joinData);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Player name already taken',
      });
    });

    it('should handle player reconnection', async () => {
      connectionManager.handlePlayerJoin.mockResolvedValue({
        success: true,
        room: mockRoom,
        isReconnection: true,
        reconnectedPlayerId: 'player-1',
      });

      await service.handlePlayerJoin(mockSocket, joinData);

      expect(eventGateway.broadcastRoomUpdate).toHaveBeenCalledWith(
        'TEST123',
        mockRoom
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('reconnected', {
        playerId: 'player-1',
        room: mockRoom,
      });
    });

    it('should handle join errors', async () => {
      connectionManager.handlePlayerJoin.mockRejectedValue(
        new Error('Join failed')
      );

      await service.handlePlayerJoin(mockSocket, joinData);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Join failed',
      });
    });

    it('should handle missing nickname', async () => {
      const invalidJoinData = { nickname: undefined, avatar: '😀' } as any;

      await service.handlePlayerJoin(mockSocket, invalidJoinData);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Nickname is required',
      });
    });

    it('should handle empty nickname', async () => {
      const invalidJoinData = { nickname: '', avatar: '😀' };

      await service.handlePlayerJoin(mockSocket, invalidJoinData);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Nickname cannot be empty',
      });
    });
  });


});
