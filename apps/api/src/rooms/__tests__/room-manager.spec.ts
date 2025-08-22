import { Test, TestingModule } from '@nestjs/testing';
import { RoomManager } from '../room-manager';
import { StateManagerService } from '../state/state-manager.service';
import { ImmutableRoomState } from '../state/room.state';
import { Player } from '@party/types';

describe('RoomManager', () => {
  let roomManager: RoomManager;
  let stateManager: jest.Mocked<StateManagerService>;

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
    const mockStateManager = {
      createRoom: jest.fn(),
      getRoom: jest.fn(),
      getRoomSafe: jest.fn(),
      hasRoom: jest.fn(),
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
      updatePlayerConnection: jest.fn(),
      updatePlayerSocketId: jest.fn(),
      cleanupDuplicatePlayers: jest.fn(),
      cleanupInactiveRooms: jest.fn(),
      advanceGamePhase: jest.fn(),
      updateTimer: jest.fn(),
      getRoomStats: jest.fn(),
      getRoomCount: jest.fn(),
      getActivePlayerCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomManager,
        {
          provide: StateManagerService,
          useValue: mockStateManager,
        },
      ],
    }).compile();

    roomManager = module.get<RoomManager>(RoomManager);
    stateManager = module.get(StateManagerService);
  });

  describe('createRoom', () => {
    it('should create a room successfully', async () => {
      const roomData = {
        code: 'TEST123',
        gameType: 'fibbing-it',
        hostId: 'player-1',
      };

      stateManager.createRoom.mockResolvedValue(mockRoom);

      const result = await roomManager.createRoom(roomData);

      expect(result).toBe(mockRoom);
      expect(stateManager.createRoom).toHaveBeenCalledWith(roomData);
    });

    it('should handle room creation errors gracefully', async () => {
      const roomData = {
        code: 'TEST123',
        gameType: 'fibbing-it',
        hostId: 'player-1',
      };

      stateManager.createRoom.mockRejectedValue(new Error('Creation failed'));

      await expect(roomManager.createRoom(roomData)).rejects.toThrow('Creation failed');
    });
  });

  describe('getRoom', () => {
    it('should return room when it exists', () => {
      stateManager.getRoom.mockReturnValue(mockRoom);

      const result = roomManager.getRoom('TEST123');

      expect(result).toBe(mockRoom);
      expect(stateManager.getRoom).toHaveBeenCalledWith('TEST123');
    });

    it('should return undefined when room does not exist', () => {
      stateManager.getRoom.mockReturnValue(undefined);

      const result = roomManager.getRoom('INVALID');

      expect(result).toBeUndefined();
    });
  });

  describe('getRoomSafe', () => {
    it('should return room when it exists', async () => {
      stateManager.getRoomSafe.mockResolvedValue(mockRoom);

      const result = await roomManager.getRoomSafe('TEST123');

      expect(result).toBe(mockRoom);
      expect(stateManager.getRoomSafe).toHaveBeenCalledWith('TEST123');
    });

    it('should return null when room does not exist', async () => {
      stateManager.getRoomSafe.mockResolvedValue(null);

      const result = await roomManager.getRoomSafe('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('hasRoom', () => {
    it('should return true when room exists', () => {
      stateManager.hasRoom.mockReturnValue(true);

      const result = roomManager.hasRoom('TEST123');

      expect(result).toBe(true);
      expect(stateManager.hasRoom).toHaveBeenCalledWith('TEST123');
    });

    it('should return false when room does not exist', () => {
      stateManager.hasRoom.mockReturnValue(false);

      const result = roomManager.hasRoom('INVALID');

      expect(result).toBe(false);
    });
  });

  describe('addPlayer', () => {
    it('should add player successfully', async () => {
      const newPlayer = {
        id: 'player-2',
        name: 'NewPlayer',
        avatar: '😎',
        connected: true,
        score: 0,
      };

      stateManager.addPlayer.mockResolvedValue(true);

      const result = await roomManager.addPlayer('TEST123', newPlayer);

      expect(result).toBe(true);
      expect(stateManager.addPlayer).toHaveBeenCalledWith('TEST123', newPlayer);
    });

    it('should handle add player errors gracefully', async () => {
      const newPlayer = {
        id: 'player-2',
        name: 'NewPlayer',
        avatar: '😎',
        connected: true,
        score: 0,
      };

      stateManager.addPlayer.mockRejectedValue(new Error('Add failed'));

      await expect(roomManager.addPlayer('TEST123', newPlayer)).rejects.toThrow('Add failed');
    });
  });

  describe('removePlayer', () => {
    it('should remove player successfully', async () => {
      stateManager.removePlayer.mockResolvedValue();

      await roomManager.removePlayer('TEST123', 'player-1');

      expect(stateManager.removePlayer).toHaveBeenCalledWith('TEST123', 'player-1');
    });

    it('should handle remove player errors gracefully', async () => {
      stateManager.removePlayer.mockRejectedValue(new Error('Remove failed'));

      await expect(roomManager.removePlayer('TEST123', 'player-1')).rejects.toThrow('Remove failed');
    });
  });

  describe('updatePlayerConnection', () => {
    it('should update player connection status successfully', async () => {
      stateManager.updatePlayerConnection.mockResolvedValue();

      await roomManager.updatePlayerConnection('TEST123', 'player-1', false);

      expect(stateManager.updatePlayerConnection).toHaveBeenCalledWith(
        'TEST123',
        'player-1',
        false
      );
    });

    it('should handle update connection errors gracefully', async () => {
      stateManager.updatePlayerConnection.mockRejectedValue(new Error('Update failed'));

      await expect(
        roomManager.updatePlayerConnection('TEST123', 'player-1', false)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('updatePlayerSocketId', () => {
    it('should update player socket ID successfully', async () => {
      stateManager.updatePlayerSocketId.mockResolvedValue();

      await roomManager.updatePlayerSocketId('TEST123', 'player-1', 'new-socket-id');

      expect(stateManager.updatePlayerSocketId).toHaveBeenCalledWith(
        'TEST123',
        'player-1',
        'new-socket-id'
      );
    });

    it('should handle update socket ID errors gracefully', async () => {
      stateManager.updatePlayerSocketId.mockRejectedValue(new Error('Update failed'));

      await expect(
        roomManager.updatePlayerSocketId('TEST123', 'player-1', 'new-socket-id')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('cleanupDuplicatePlayers', () => {
    it('should cleanup duplicate players successfully', async () => {
      stateManager.cleanupDuplicatePlayers.mockResolvedValue();

      await roomManager.cleanupDuplicatePlayers('TEST123');

      expect(stateManager.cleanupDuplicatePlayers).toHaveBeenCalledWith('TEST123');
    });

    it('should handle cleanup errors gracefully', async () => {
      stateManager.cleanupDuplicatePlayers.mockRejectedValue(new Error('Cleanup failed'));

      await expect(roomManager.cleanupDuplicatePlayers('TEST123')).rejects.toThrow('Cleanup failed');
    });
  });

  describe('cleanupInactiveRooms', () => {
    it('should cleanup inactive rooms and return count', () => {
      const expectedCount = 3;
      stateManager.cleanupInactiveRooms.mockReturnValue(expectedCount);

      const result = roomManager.cleanupInactiveRooms(30);

      expect(result).toBe(expectedCount);
      expect(stateManager.cleanupInactiveRooms).toHaveBeenCalledWith(30);
    });

    it('should use default timeout when none provided', () => {
      const expectedCount = 0;
      stateManager.cleanupInactiveRooms.mockReturnValue(expectedCount);

      const result = roomManager.cleanupInactiveRooms();

      expect(result).toBe(expectedCount);
      expect(stateManager.cleanupInactiveRooms).toHaveBeenCalledWith(30);
    });
  });

  describe('advanceGamePhase', () => {
    it('should advance game phase successfully', async () => {
      const mockEvents = [{ type: 'phaseChange', data: { phase: 'prompt' } }];
      stateManager.advanceGamePhase.mockResolvedValue(mockEvents);

      const result = await roomManager.advanceGamePhase('TEST123');

      expect(result).toEqual(mockEvents);
      expect(stateManager.advanceGamePhase).toHaveBeenCalledWith('TEST123');
    });

    it('should handle phase advancement errors gracefully', async () => {
      stateManager.advanceGamePhase.mockRejectedValue(new Error('Advance failed'));

      const result = await roomManager.advanceGamePhase('TEST123');

      expect(result).toEqual([]);
    });
  });

  describe('updateTimer', () => {
    it('should update timer successfully', async () => {
      const mockEvents = [{ type: 'timerUpdate', data: { timeLeft: 10 } }];
      stateManager.updateTimer.mockResolvedValue(mockEvents);

      const result = await roomManager.updateTimer('TEST123', -1);

      expect(result).toEqual(mockEvents);
      expect(stateManager.updateTimer).toHaveBeenCalledWith('TEST123', -1);
    });

    it('should handle timer update errors gracefully', async () => {
      stateManager.updateTimer.mockRejectedValue(new Error('Timer update failed'));

      const result = await roomManager.updateTimer('TEST123', -1);

      expect(result).toEqual([]);
    });
  });

  describe('getRoomStats', () => {
    it('should return room statistics', () => {
      const mockStats = {
        totalRooms: 5,
        activePlayers: 12,
        gameTypes: { 'fibbing-it': 3, 'bluff-trivia': 2 },
      };
      stateManager.getRoomStats.mockReturnValue(mockStats);

      const result = roomManager.getRoomStats();

      expect(result).toEqual(mockStats);
      expect(stateManager.getRoomStats).toHaveBeenCalled();
    });
  });

  describe('getRoomCount', () => {
    it('should return room count', () => {
      const expectedCount = 5;
      stateManager.getRoomCount.mockReturnValue(expectedCount);

      const result = roomManager.getRoomCount();

      expect(result).toBe(expectedCount);
      expect(stateManager.getRoomCount).toHaveBeenCalled();
    });
  });

  describe('getActivePlayerCount', () => {
    it('should return active player count', () => {
      const expectedCount = 12;
      stateManager.getActivePlayerCount.mockReturnValue(expectedCount);

      const result = roomManager.getActivePlayerCount();

      expect(result).toBe(expectedCount);
      expect(stateManager.getActivePlayerCount).toHaveBeenCalled();
    });
  });
});
