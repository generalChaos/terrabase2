import { Test, TestingModule } from '@nestjs/testing';
import { StateManagerService } from '../state-manager.service';
import { RoomManager } from '../../room-manager';
import { GameRegistry } from '../../game-registry';
import { TimerService } from '../../timer.service';
import { GameAction, GameEvent, Player } from '@party/types';
import { BluffTriviaNewEngine } from '../../games/bluff-trivia-new.engine';

describe('StateManagerService', () => {
  let service: StateManagerService;
  let roomManager: jest.Mocked<RoomManager>;
  let gameRegistry: jest.Mocked<GameRegistry>;
  let timerService: jest.Mocked<TimerService>;

  const mockPlayer: Player = {
    id: 'player-1',
    name: 'TestPlayer',
    avatar: '😀',
    score: 0,
    connected: true,
  };

  const mockRoom = {
    code: 'TEST123',
    gameType: 'bluff-trivia',
    phase: 'lobby',
    players: [mockPlayer],
    hostId: 'player-1',
    round: 0,
    maxRounds: 5,
    current: null,
    timer: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    gameState: {
      phase: 'lobby',
      players: [mockPlayer],
      round: 0,
      maxRounds: 5,
      timeLeft: 0,
      scores: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      isRoundComplete: false,
      phaseStartTime: new Date(),
    },
    withGameStateUpdated: jest.fn().mockReturnThis(),
    withPlayerAdded: jest.fn().mockReturnThis(),
    withPlayerRemoved: jest.fn().mockReturnThis(),
    withPlayerUpdated: jest.fn().mockReturnThis(),
    withPhaseChanged: jest.fn().mockReturnThis(),
    withRoundAdvanced: jest.fn().mockReturnThis(),
    withTimerUpdated: jest.fn().mockReturnThis(),
    withCurrentUpdated: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const mockRoomManager = {
      getRoom: jest.fn(),
      hasRoom: jest.fn(),
      createRoom: jest.fn(),
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
      updatePlayerConnection: jest.fn(),
      updatePlayerSocketId: jest.fn(),
      cleanupDuplicatePlayers: jest.fn(),
      cleanupInactiveRooms: jest.fn(),
    };

    const mockGameRegistry = {
      getEngine: jest.fn(),
      hasGame: jest.fn(),
      getAvailableGames: jest.fn(),
    };

    const mockTimerService = {
      startTimer: jest.fn(),
      stopTimer: jest.fn(),
      updateTimer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StateManagerService,
        {
          provide: RoomManager,
          useValue: mockRoomManager,
        },
        {
          provide: GameRegistry,
          useValue: mockGameRegistry,
        },
        {
          provide: TimerService,
          useValue: mockTimerService,
        },
      ],
    }).compile();

    service = module.get<StateManagerService>(StateManagerService);
    roomManager = module.get(RoomManager);
    gameRegistry = module.get(GameRegistry);
    timerService = module.get(TimerService);
  });

  describe('createRoom', () => {
    it('should create a room successfully', async () => {
      const roomData = {
        code: 'TEST123',
        gameType: 'bluff-trivia',
        hostId: 'player-1',
      };

      roomManager.createRoom.mockResolvedValue(mockRoom as any);

      const result = await service.createRoom(roomData);

      expect(result).toBe(mockRoom);
      expect(roomManager.createRoom).toHaveBeenCalledWith(roomData);
    });

    it('should handle room creation errors gracefully', async () => {
      const roomData = {
        code: 'TEST123',
        gameType: 'bluff-trivia',
        hostId: 'player-1',
      };

      roomManager.createRoom.mockRejectedValue(new Error('Creation failed'));

      await expect(service.createRoom(roomData)).rejects.toThrow('Creation failed');
    });
  });

  describe('getRoom', () => {
    it('should return room if it exists', async () => {
      roomManager.getRoom.mockResolvedValue(mockRoom as any);

      const result = await service.getRoom('TEST123');

      expect(result).toBe(mockRoom);
      expect(roomManager.getRoom).toHaveBeenCalledWith('TEST123');
    });

    it('should return null if room does not exist', async () => {
      roomManager.getRoom.mockResolvedValue(null);

      const result = await service.getRoom('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('hasRoom', () => {
    it('should return true if room exists', () => {
      roomManager.hasRoom.mockReturnValue(true);

      const result = service.hasRoom('TEST123');

      expect(result).toBe(true);
      expect(roomManager.hasRoom).toHaveBeenCalledWith('TEST123');
    });

    it('should return false if room does not exist', () => {
      roomManager.hasRoom.mockReturnValue(false);

      const result = service.hasRoom('NONEXISTENT');

      expect(result).toBe(false);
    });
  });

  describe('addPlayer', () => {
    it('should add player to room successfully', async () => {
      const playerData = {
        nickname: 'TestPlayer',
        avatar: '😀',
      };

      roomManager.addPlayer.mockResolvedValue(mockRoom as any);

      const result = await service.addPlayer('TEST123', 'player-1', playerData);

      expect(result).toBe(mockRoom);
      expect(roomManager.addPlayer).toHaveBeenCalledWith('TEST123', 'player-1', playerData);
    });

    it('should handle player addition errors', async () => {
      const playerData = {
        nickname: 'TestPlayer',
        avatar: '😀',
      };

      roomManager.addPlayer.mockRejectedValue(new Error('Player addition failed'));

      await expect(service.addPlayer('TEST123', 'player-1', playerData)).rejects.toThrow('Player addition failed');
    });
  });

  describe('removePlayer', () => {
    it('should remove player from room successfully', async () => {
      roomManager.removePlayer.mockResolvedValue(mockRoom as any);

      const result = await service.removePlayer('TEST123', 'player-1');

      expect(result).toBe(mockRoom);
      expect(roomManager.removePlayer).toHaveBeenCalledWith('TEST123', 'player-1');
    });

    it('should handle player removal errors', async () => {
      roomManager.removePlayer.mockRejectedValue(new Error('Player removal failed'));

      await expect(service.removePlayer('TEST123', 'player-1')).rejects.toThrow('Player removal failed');
    });
  });

  describe('updatePlayerConnection', () => {
    it('should update player connection status successfully', async () => {
      roomManager.updatePlayerConnection.mockResolvedValue(mockRoom as any);

      const result = await service.updatePlayerConnection('TEST123', 'player-1', true);

      expect(result).toBe(mockRoom);
      expect(roomManager.updatePlayerConnection).toHaveBeenCalledWith('TEST123', 'player-1', true);
    });

    it('should handle connection update errors', async () => {
      roomManager.updatePlayerConnection.mockRejectedValue(new Error('Connection update failed'));

      await expect(service.updatePlayerConnection('TEST123', 'player-1', true)).rejects.toThrow('Connection update failed');
    });
  });

  describe('updatePlayerSocketId', () => {
    it('should update player socket ID successfully', async () => {
      roomManager.updatePlayerSocketId.mockResolvedValue(mockRoom as any);

      const result = await service.updatePlayerSocketId('TEST123', 'player-1', 'new-socket-id');

      expect(result).toBe(mockRoom);
      expect(roomManager.updatePlayerSocketId).toHaveBeenCalledWith('TEST123', 'player-1', 'new-socket-id');
    });

    it('should handle socket ID update errors', async () => {
      roomManager.updatePlayerSocketId.mockRejectedValue(new Error('Socket ID update failed'));

      await expect(service.updatePlayerSocketId('TEST123', 'player-1', 'new-socket-id')).rejects.toThrow('Socket ID update failed');
    });
  });

  describe('processGameAction', () => {
    it('should process game action successfully', async () => {
      const mockEngine = new BluffTriviaNewEngine();
      const action: GameAction = {
        type: 'start',
        playerId: 'player-1',
        data: {},
        timestamp: Date.now(),
      };

      roomManager.getRoom.mockResolvedValue(mockRoom as any);
      gameRegistry.getEngine.mockReturnValue(mockEngine);

      const result = await service.processGameAction('TEST123', action);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle invalid game actions', async () => {
      const action: GameAction = {
        type: 'invalid' as any,
        playerId: 'player-1',
        data: {},
        timestamp: Date.now(),
      };

      roomManager.getRoom.mockResolvedValue(mockRoom as any);

      const result = await service.processGameAction('TEST123', action);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('error');
    });

    it('should handle room not found', async () => {
      const action: GameAction = {
        type: 'start',
        playerId: 'player-1',
        data: {},
        timestamp: Date.now(),
      };

      roomManager.getRoom.mockResolvedValue(null);

      const result = await service.processGameAction('NONEXISTENT', action);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('error');
    });
  });

  describe('updateTimer', () => {
    it('should update timer successfully', async () => {
      const mockEngine = new BluffTriviaNewEngine();
      const delta = 1000; // 1 second

      roomManager.getRoom.mockResolvedValue(mockRoom as any);
      gameRegistry.getEngine.mockReturnValue(mockEngine);

      const result = await service.updateTimer('TEST123', delta);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle timer update when room not found', async () => {
      const delta = 1000;

      roomManager.getRoom.mockResolvedValue(null);

      const result = await service.updateTimer('NONEXISTENT', delta);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('error');
    });

    it('should handle timer update when engine not found', async () => {
      const delta = 1000;

      roomManager.getRoom.mockResolvedValue(mockRoom as any);
      gameRegistry.getEngine.mockReturnValue(null);

      const result = await service.updateTimer('TEST123', delta);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('error');
    });
  });

  describe('advanceGamePhase', () => {
    it('should advance game phase successfully', async () => {
      const mockEngine = new BluffTriviaNewEngine();

      roomManager.getRoom.mockResolvedValue(mockRoom as any);
      gameRegistry.getEngine.mockReturnValue(mockEngine);

      const result = await service.advanceGamePhase('TEST123');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle phase advancement when room not found', async () => {
      roomManager.getRoom.mockResolvedValue(null);

      const result = await service.advanceGamePhase('NONEXISTENT');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('error');
    });

    it('should handle phase advancement when engine not found', async () => {
      roomManager.getRoom.mockResolvedValue(mockRoom as any);
      gameRegistry.getEngine.mockReturnValue(null);

      const result = await service.advanceGamePhase('TEST123');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('error');
    });
  });

  describe('cleanup operations', () => {
    it('should cleanup duplicate players', async () => {
      roomManager.cleanupDuplicatePlayers.mockResolvedValue(2);

      const result = await service.cleanupDuplicatePlayers();

      expect(result).toBe(2);
      expect(roomManager.cleanupDuplicatePlayers).toHaveBeenCalled();
    });

    it('should cleanup inactive rooms', async () => {
      roomManager.cleanupInactiveRooms.mockResolvedValue(3);

      const result = await service.cleanupInactiveRooms();

      expect(result).toBe(3);
      expect(roomManager.cleanupInactiveRooms).toHaveBeenCalled();
    });
  });

  describe('getRoomStats', () => {
    it('should return room statistics', async () => {
      const mockStats = {
        totalRooms: 5,
        activeRooms: 3,
        totalPlayers: 15,
        activePlayers: 12,
      };

      roomManager.getRoomStats.mockResolvedValue(mockStats);

      const result = await service.getRoomStats();

      expect(result).toEqual(mockStats);
      expect(roomManager.getRoomStats).toHaveBeenCalled();
    });
  });

  describe('getRoomCount', () => {
    it('should return room count', async () => {
      roomManager.getRoomCount.mockResolvedValue(5);

      const result = await service.getRoomCount();

      expect(result).toBe(5);
      expect(roomManager.getRoomCount).toHaveBeenCalled();
    });
  });

  describe('getActivePlayerCount', () => {
    it('should return active player count', async () => {
      roomManager.getActivePlayerCount.mockResolvedValue(12);

      const result = await service.getActivePlayerCount();

      expect(result).toBe(12);
      expect(roomManager.getActivePlayerCount).toHaveBeenCalled();
    });
  });
});
