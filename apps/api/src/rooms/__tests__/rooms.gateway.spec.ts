import { Test, TestingModule } from '@nestjs/testing';
import { RoomsGateway } from '../rooms.gateway';
import { RoomManager } from '../room-manager';
import { TimerService } from '../timer.service';
import { ErrorHandlerService } from '../error-handler.service';
import { ConnectionManagerService } from '../services/connection-manager.service';
import { EventBroadcasterService } from '../services/event-broadcaster.service';
import { ConnectionGatewayService } from '../services/connection-gateway.service';
import { GameGatewayService } from '../services/game-gateway.service';
import { EventGatewayService } from '../services/event-gateway.service';
import { Socket, Namespace } from 'socket.io';
import { ImmutableRoomState } from '../state/room.state';
import { Player } from '@party/types';

describe('RoomsGateway', () => {
  let gateway: RoomsGateway;
  let roomManager: jest.Mocked<RoomManager>;
  let timerService: jest.Mocked<TimerService>;
  let errorHandler: jest.Mocked<ErrorHandlerService>;
  let connectionManager: jest.Mocked<ConnectionManagerService>;
  let eventBroadcaster: jest.Mocked<EventBroadcasterService>;
  let connectionGateway: jest.Mocked<ConnectionGatewayService>;
  let gameGateway: jest.Mocked<GameGatewayService>;
  let eventGateway: jest.Mocked<EventGatewayService>;

  const mockSocket = {
    id: 'socket-1',
    nsp: { name: '/rooms' },
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    handshake: {
      query: { roomCode: 'TEST123' },
    },
  } as any;

  const mockNamespace = {
    use: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
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
    const mockRoomManager = {
      hasRoom: jest.fn(),
      getRoomSafe: jest.fn(),
      createRoom: jest.fn(),
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
      updatePlayerConnection: jest.fn(),
      updatePlayerSocketId: jest.fn(),
      cleanupDuplicatePlayers: jest.fn(),
      cleanupInactiveRooms: jest.fn(),
      getRoomStats: jest.fn(),
      getRoomCount: jest.fn(),
      getActivePlayerCount: jest.fn(),
    };

    const mockTimerService = {
      startTimer: jest.fn(),
      stopTimer: jest.fn(),
      updateTimer: jest.fn(),
      getTimeLeft: jest.fn(),
    };

    const mockErrorHandler = {
      handleError: jest.fn(),
      createErrorResponse: jest.fn(),
    };

    const mockConnectionManager = {
      handleConnection: jest.fn(),
      handleDisconnection: jest.fn(),
      handlePlayerJoin: jest.fn(),
    };

    const mockEventBroadcaster = {
      broadcastToRoom: jest.fn(),
      broadcastToPlayer: jest.fn(),
      setNamespace: jest.fn(),
    };

    const mockConnectionGateway = {
      handleConnection: jest.fn(),
      handleDisconnection: jest.fn(),
      handlePlayerJoin: jest.fn(),
    };

    const mockGameGateway = {
      startGame: jest.fn(),
      handleGameAction: jest.fn(),
    };

    const mockEventGateway = {
      handleGameEvent: jest.fn(),
      handleTimerEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsGateway,
        {
          provide: RoomManager,
          useValue: mockRoomManager,
        },
        {
          provide: TimerService,
          useValue: mockTimerService,
        },
        {
          provide: ErrorHandlerService,
          useValue: mockErrorHandler,
        },
        {
          provide: ConnectionManagerService,
          useValue: mockConnectionManager,
        },
        {
          provide: EventBroadcasterService,
          useValue: mockEventBroadcaster,
        },
        {
          provide: ConnectionGatewayService,
          useValue: mockConnectionGateway,
        },
        {
          provide: GameGatewayService,
          useValue: mockGameGateway,
        },
        {
          provide: EventGatewayService,
          useValue: mockEventGateway,
        },
      ],
    }).compile();

    gateway = module.get<RoomsGateway>(RoomsGateway);
    roomManager = module.get(RoomManager);
    timerService = module.get(TimerService);
    errorHandler = module.get(ErrorHandlerService);
    connectionManager = module.get(ConnectionManagerService);
    eventBroadcaster = module.get(EventBroadcasterService);
    connectionGateway = module.get(ConnectionGatewayService);
    gameGateway = module.get(GameGatewayService);
    eventGateway = module.get(EventGatewayService);
  });

  describe('afterInit', () => {
    it('should initialize the gateway correctly', () => {
      gateway.afterInit(mockNamespace);

      expect(gateway['isReady']).toBe(true);
      expect(eventBroadcaster.setNamespace).toHaveBeenCalledWith(mockNamespace);
      expect(mockNamespace.use).toHaveBeenCalled();
      expect(mockNamespace.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('handleConnection', () => {
    it('should delegate connection handling to ConnectionGatewayService', async () => {
      await gateway.handleConnection(mockSocket);

      expect(connectionGateway.handleConnection).toHaveBeenCalledWith(mockSocket);
    });

    it('should handle connection errors gracefully', async () => {
      connectionGateway.handleConnection.mockRejectedValue(
        new Error('Connection failed')
      );

      await expect(gateway.handleConnection(mockSocket)).rejects.toThrow(
        'Connection failed'
      );
    });
  });

  describe('handleDisconnection', () => {
    it('should delegate disconnection handling to ConnectionGatewayService', async () => {
      await gateway.handleDisconnection(mockSocket);

      expect(connectionGateway.handleDisconnection).toHaveBeenCalledWith(mockSocket);
    });

    it('should handle disconnection errors gracefully', async () => {
      connectionGateway.handleDisconnection.mockRejectedValue(
        new Error('Disconnection failed')
      );

      await expect(gateway.handleDisconnection(mockSocket)).rejects.toThrow(
        'Disconnection failed'
      );
    });
  });

  describe('join event', () => {
    it('should handle player join successfully', async () => {
      const joinData = {
        nickname: 'TestPlayer',
        avatar: '😀',
      };

      await gateway.join(mockSocket, joinData);

      expect(connectionGateway.handlePlayerJoin).toHaveBeenCalledWith(
        mockSocket,
        joinData
      );
    });

    it('should handle join errors gracefully', async () => {
      const joinData = {
        nickname: 'TestPlayer',
        avatar: '😀',
      };

      connectionGateway.handlePlayerJoin.mockRejectedValue(
        new Error('Join failed')
      );

      await expect(gateway.join(mockSocket, joinData)).rejects.toThrow(
        'Join failed'
      );
    });
  });

  describe('startGame event', () => {
    it('should handle game start successfully', async () => {
      const mockResult = { isSuccess: () => true };
      gameGateway.startGame.mockResolvedValue(mockResult);

      await gateway.start(mockSocket);

      expect(gameGateway.startGame).toHaveBeenCalledWith(mockSocket, 'TEST123');
    });

    it('should handle game start failure', async () => {
      const mockResult = { isSuccess: () => false, getError: () => 'Game start failed' };
      gameGateway.startGame.mockResolvedValue(mockResult);

      await gateway.start(mockSocket);

      expect(gameGateway.startGame).toHaveBeenCalledWith(mockSocket, 'TEST123');
    });

    it('should handle game start errors gracefully', async () => {
      gameGateway.startGame.mockRejectedValue(new Error('Game start failed'));

      await expect(gateway.start(mockSocket)).rejects.toThrow('Game start failed');
    });
  });

  describe('utility methods', () => {
    it('should extract room code from socket namespace', () => {
      const roomCode = gateway['codeFromNs'](mockSocket);
      expect(roomCode).toBe('TEST123');
    });

    it('should handle missing room code gracefully', () => {
      const socketWithoutRoomCode = {
        ...mockSocket,
        handshake: { query: {} },
      };

      const roomCode = gateway['codeFromNs'](socketWithoutRoomCode);
      expect(roomCode).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should use ErrorHandlerService for error handling', () => {
      expect(errorHandler).toBeDefined();
      expect(errorHandler.handleError).toBeDefined();
      expect(errorHandler.createErrorResponse).toBeDefined();
    });
  });

  describe('service integration', () => {
    it('should have all required services injected', () => {
      expect(roomManager).toBeDefined();
      expect(timerService).toBeDefined();
      expect(connectionManager).toBeDefined();
      expect(eventBroadcaster).toBeDefined();
      expect(connectionGateway).toBeDefined();
      expect(gameGateway).toBeDefined();
      expect(eventGateway).toBeDefined();
    });
  });
});
