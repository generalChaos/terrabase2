import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionManagerService } from '../connection-manager.service';
import { RoomManager } from '../../room-manager';
import { ImmutableRoomState } from '../../state/room.state';
import { Player } from '@party/types';

describe('ConnectionManagerService', () => {
  let service: ConnectionManagerService;
  let roomManager: jest.Mocked<RoomManager>;

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
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
      updatePlayerConnection: jest.fn(),
      updatePlayerSocketId: jest.fn(),
      cleanupDuplicatePlayers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionManagerService,
        {
          provide: RoomManager,
          useValue: mockRoomManager,
        },
      ],
    }).compile();

    service = module.get<ConnectionManagerService>(ConnectionManagerService);
    roomManager = module.get(RoomManager);
  });

  describe('handleConnection', () => {
    it('should return success when room exists', async () => {
      roomManager.hasRoom.mockReturnValue(true);
      roomManager.getRoomSafe.mockResolvedValue(mockRoom);

      const result = await service.handleConnection('TEST123', 'client-1');

      expect(result.success).toBe(true);
      expect(result.room).toBe(mockRoom);
      expect(result.isReconnection).toBe(false);
    });

    it('should return error when room does not exist', async () => {
      roomManager.hasRoom.mockReturnValue(false);

      const result = await service.handleConnection('INVALID', 'client-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Room INVALID not found');
      expect(result.room).toBeNull();
    });

    it('should handle reconnection attempts', async () => {
      roomManager.hasRoom.mockReturnValue(true);
      roomManager.getRoomSafe.mockResolvedValue(mockRoom);

      const result = await service.handleConnection('TEST123', 'client-1');

      expect(result.success).toBe(true);
      expect(result.isReconnection).toBe(false);
    });
  });

  describe('handleDisconnection', () => {
    it('should update player connection status to false', async () => {
      roomManager.getRoomSafe.mockResolvedValue(mockRoom);
      roomManager.updatePlayerConnection.mockResolvedValue();

      const result = await service.handleDisconnection('TEST123', 'player-1');

      expect(result).toBe(true);
      expect(roomManager.updatePlayerConnection).toHaveBeenCalledWith(
        'TEST123',
        'player-1',
        false
      );
    });

    it('should return false when room does not exist', async () => {
      roomManager.getRoomSafe.mockResolvedValue(null);

      const result = await service.handleDisconnection('INVALID', 'player-1');

      expect(result).toBe(false);
    });

    it('should return false when player does not exist', async () => {
      const roomWithoutPlayer = { ...mockRoom, players: [] };
      roomManager.getRoomSafe.mockResolvedValue(roomWithoutPlayer);

      const result = await service.handleDisconnection('TEST123', 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('handlePlayerJoin', () => {
    it('should handle new player joining', async () => {
      roomManager.getRoomSafe.mockResolvedValue(mockRoom);
      roomManager.addPlayer.mockResolvedValue(true);
      roomManager.cleanupDuplicatePlayers.mockResolvedValue();

      const result = await service.handlePlayerJoin(
        'TEST123',
        'client-2',
        'NewPlayer',
        '😎'
      );

      expect(result.success).toBe(true);
      expect(result.isReconnection).toBe(false);
      expect(roomManager.addPlayer).toHaveBeenCalledWith('TEST123', {
        id: 'client-2',
        name: 'NewPlayer',
        avatar: '😎',
        connected: true,
        score: 0,
      });
    });

    it('should handle player reconnection', async () => {
      const disconnectedPlayer = { ...mockPlayer, connected: false };
      const roomWithDisconnectedPlayer = {
        ...mockRoom,
        players: [disconnectedPlayer],
      };
      roomManager.getRoomSafe.mockResolvedValue(roomWithDisconnectedPlayer);
      roomManager.removePlayer.mockResolvedValue();
      roomManager.addPlayer.mockResolvedValue(true);

      const result = await service.handlePlayerJoin(
        'TEST123',
        'client-2',
        'TestPlayer',
        '😀'
      );

      expect(result.success).toBe(true);
      expect(result.isReconnection).toBe(true);
      expect(roomManager.removePlayer).toHaveBeenCalledWith(
        'TEST123',
        'player-1'
      );
      expect(roomManager.addPlayer).toHaveBeenCalledWith('TEST123', {
        id: 'client-2',
        name: 'TestPlayer',
        avatar: '😀',
        connected: true,
        score: 0,
      });
    });

    it('should reject when name is already taken by connected player', async () => {
      roomManager.getRoomSafe.mockResolvedValue(mockRoom);

      const result = await service.handlePlayerJoin(
        'TEST123',
        'client-2',
        'TestPlayer',
        '😎'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player name already taken');
    });

    it('should return error when room does not exist', async () => {
      roomManager.getRoomSafe.mockResolvedValue(null);

      const result = await service.handlePlayerJoin(
        'INVALID',
        'client-1',
        'TestPlayer'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room not found');
    });

    it('should return error when adding player fails', async () => {
      roomManager.getRoomSafe.mockResolvedValue(mockRoom);
      roomManager.addPlayer.mockResolvedValue(false);

      const result = await service.handlePlayerJoin(
        'TEST123',
        'client-2',
        'NewPlayer'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to add player to room');
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully in handleConnection', async () => {
      roomManager.hasRoom.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await service.handleConnection('TEST123', 'client-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle errors gracefully in handleDisconnection', async () => {
      roomManager.getRoomSafe.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await service.handleDisconnection('TEST123', 'player-1');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully in handlePlayerJoin', async () => {
      roomManager.getRoomSafe.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await service.handlePlayerJoin(
        'TEST123',
        'client-1',
        'TestPlayer'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
