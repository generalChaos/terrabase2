import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionManagerService } from '../connection-manager.service';
import { RoomManager } from '../../room-manager';
import { ImmutableRoomState } from '../../state/room.state';
import { Player } from '@tb2/shared-types';

describe('ConnectionManagerService', () => {
  let service: ConnectionManagerService;
  let roomManager: jest.Mocked<RoomManager>;
  let mockRoom: ImmutableRoomState;
  let mockPlayer: Player;

  beforeEach(async () => {
    mockPlayer = {
      id: 'client-1',
      name: 'TestPlayer',
      avatar: '😀',
      connected: true,
      score: 0,
    };

    mockRoom = new ImmutableRoomState(
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
      'client-1',
      new Date(),
      1,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionManagerService,
        {
          provide: RoomManager,
          useValue: {
            hasRoom: jest.fn(),
            getRoomSafe: jest.fn(),
            addPlayer: jest.fn(),
            removePlayer: jest.fn(),
            updatePlayerConnection: jest.fn(),
            cleanupDuplicatePlayers: jest.fn(),
            stateManager: {
              rooms: new Map(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ConnectionManagerService>(ConnectionManagerService);
    roomManager = module.get(RoomManager);
  });

  describe('handleConnection', () => {
    it('should handle successful connection', async () => {
      roomManager.hasRoom.mockReturnValue(true);
      roomManager.getRoomSafe.mockReturnValue(mockRoom);

      const result = await service.handleConnection('TEST123', 'client-1');

      expect(result.success).toBe(true);
      expect(result.room).toBe(mockRoom);
      expect(result.isReconnection).toBe(false);
    });

    it('should handle room not found', async () => {
      roomManager.hasRoom.mockReturnValue(false);

      const result = await service.handleConnection('TEST123', 'client-1');

      expect(result.success).toBe(false);
      expect(result.room).toBeNull();
      expect(result.isReconnection).toBe(false);
      expect(result.error).toContain('Room TEST123 not found');
    });

    it('should handle room retrieval failure', async () => {
      roomManager.hasRoom.mockReturnValue(true);
      roomManager.getRoomSafe.mockReturnValue(undefined);

      const result = await service.handleConnection('TEST123', 'client-1');

      expect(result.success).toBe(false);
      expect(result.room).toBeNull();
      expect(result.isReconnection).toBe(false);
      expect(result.error).toBe('Failed to create or retrieve room');
    });

    it('should handle reconnection of existing player', async () => {
      const disconnectedPlayer = {
        ...mockPlayer,
        connected: false,
      };
      const roomWithDisconnectedPlayer = new ImmutableRoomState(
        'TEST123',
        'bluff-trivia',
        {
          phase: 'lobby',
          players: [disconnectedPlayer],
          round: 1,
          maxRounds: 5,
          timeLeft: 0,
          scores: new Map(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isRoundComplete: false,
          phaseStartTime: new Date(),
        },
        [disconnectedPlayer],
        'lobby',
        'client-1',
        new Date(),
        1,
      );

      roomManager.hasRoom.mockReturnValue(true);
      roomManager.getRoomSafe.mockReturnValue(roomWithDisconnectedPlayer);
      roomManager.removePlayer.mockResolvedValue(true);
      roomManager.addPlayer.mockResolvedValue(true);

      const result = await service.handleConnection('TEST123', 'client-2');

      expect(result.success).toBe(true);
      expect(result.isReconnection).toBe(true);
      expect(result.reconnectedPlayerId).toBe('client-1');
    });
  });

  describe('handleDisconnection', () => {
    it('should handle successful disconnection', async () => {
      roomManager.getRoomSafe.mockReturnValue(mockRoom);
      roomManager.updatePlayerConnection.mockResolvedValue(undefined);

      const result = await service.handleDisconnection('TEST123', 'client-1');

      expect(result).toBe(true);
      expect(roomManager.updatePlayerConnection).toHaveBeenCalledWith('TEST123', 'client-1', false);
    });

    it('should handle room not found', async () => {
      roomManager.getRoomSafe.mockReturnValue(undefined);

      const result = await service.handleDisconnection('TEST123', 'client-1');

      expect(result).toBe(false);
    });

    it('should handle player not found', async () => {
      const roomWithoutPlayer = new ImmutableRoomState(
        'TEST123',
        'bluff-trivia',
        {
          phase: 'lobby',
          players: [],
          round: 1,
          maxRounds: 5,
          timeLeft: 0,
          scores: new Map(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isRoundComplete: false,
          phaseStartTime: new Date(),
        },
        [],
        'lobby',
        null,
        new Date(),
        1,
      );

      roomManager.getRoomSafe.mockReturnValue(roomWithoutPlayer);

      const result = await service.handleDisconnection('TEST123', 'client-1');

      expect(result).toBe(false);
    });
  });

  describe('handlePlayerJoin', () => {
    it('should handle new player joining successfully', async () => {
      roomManager.getRoomSafe.mockReturnValue(mockRoom);
      roomManager.addPlayer.mockResolvedValue(true);
      roomManager.cleanupDuplicatePlayers.mockResolvedValue(undefined);

      const result = await service.handlePlayerJoin('TEST123', 'client-2', 'Player2', '🎮');

      expect(result.success).toBe(true);
      expect(result.room).toBeDefined();
      expect(result.isReconnection).toBe(false);
      expect(roomManager.addPlayer).toHaveBeenCalledWith('TEST123', {
        id: 'client-2',
        name: 'Player2',
        avatar: '🎮',
        connected: true,
        score: 0,
      });
    });

    it('should handle reconnection of existing player', async () => {
      const disconnectedPlayer = {
        ...mockPlayer,
        connected: false,
      };
      const roomWithDisconnectedPlayer = new ImmutableRoomState(
        'TEST123',
        'bluff-trivia',
        {
          phase: 'lobby',
          players: [disconnectedPlayer],
          round: 1,
          maxRounds: 5,
          timeLeft: 0,
          scores: new Map(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isRoundComplete: false,
          phaseStartTime: new Date(),
        },
        [disconnectedPlayer],
        'lobby',
        'client-1',
        new Date(),
        1,
      );

      roomManager.getRoomSafe.mockReturnValue(roomWithDisconnectedPlayer);
      roomManager.removePlayer.mockResolvedValue(true);
      roomManager.addPlayer.mockResolvedValue(true);
      roomManager.cleanupDuplicatePlayers.mockResolvedValue(undefined);

      const result = await service.handlePlayerJoin('TEST123', 'client-2', 'TestPlayer', '😀');

      expect(result.success).toBe(true);
      expect(result.isReconnection).toBe(true);
      expect(result.reconnectedPlayerId).toBe('client-1');
    });

    it('should handle player name already taken by connected player', async () => {
      roomManager.getRoomSafe.mockReturnValue(mockRoom);

      const result = await service.handlePlayerJoin('TEST123', 'client-2', 'TestPlayer', '😀');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player name already taken');
    });

    it('should handle room not found', async () => {
      roomManager.getRoomSafe.mockReturnValue(undefined);

      const result = await service.handlePlayerJoin('TEST123', 'client-1', 'TestPlayer', '😀');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room not found');
    });

    it('should handle player addition failure', async () => {
      roomManager.getRoomSafe.mockReturnValue(mockRoom);
      roomManager.addPlayer.mockResolvedValue(false);

      const result = await service.handlePlayerJoin('TEST123', 'client-2', 'Player2', '😀');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to add player to room');
    });
  });
});
