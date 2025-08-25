import { Test, TestingModule } from '@nestjs/testing';
import { RoomManager } from '../room-manager';
import { GameRegistry } from '../game-registry';
import { TimerService } from '../timer.service';
import { StateManagerService } from '../state/state-manager.service';
import { ImmutableRoomState } from '../state/room.state';
import { Player, GameAction, GameEvent } from '@party/types';

describe('RoomManager', () => {
  let roomManager: RoomManager;
  let gameRegistry: jest.Mocked<GameRegistry>;
  let timerService: jest.Mocked<TimerService>;
  let stateManager: jest.Mocked<StateManagerService>;
  let mockRoom: ImmutableRoomState;
  let mockPlayer: Player;

  beforeEach(async () => {
    mockPlayer = {
      id: 'player-1',
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
      'player-1',
      new Date(),
      1,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomManager,
        {
          provide: GameRegistry,
          useValue: {
            getGame: jest.fn(),
            register: jest.fn(),
            listGames: jest.fn(),
            hasGame: jest.fn(),
            getDefaultGame: jest.fn(),
          },
        },
        {
          provide: TimerService,
          useValue: {
            startTimer: jest.fn(),
            stopTimer: jest.fn(),
            stopTimerForRoom: jest.fn(),
            updateTimer: jest.fn(),
            getTimeLeft: jest.fn(),
          },
        },
        {
          provide: StateManagerService,
          useValue: {
            createRoom: jest.fn(),
            getRoom: jest.fn(),
            hasRoom: jest.fn(),
            getRoomSafe: jest.fn(),
            deleteRoom: jest.fn(),
            addPlayer: jest.fn(),
            removePlayer: jest.fn(),
            processGameAction: jest.fn(),
            advanceGamePhase: jest.fn(),
            updateTimer: jest.fn(),
            cleanupDuplicatePlayers: jest.fn(),
            cleanupInactiveRooms: jest.fn(),
            getRoomStats: jest.fn(),
          },
        },
      ],
    }).compile();

    roomManager = module.get<RoomManager>(RoomManager);
    gameRegistry = module.get(GameRegistry);
    timerService = module.get(TimerService);
    stateManager = module.get(StateManagerService);
  });

  describe('createRoom', () => {
    it('should create room successfully', async () => {
      stateManager.createRoom.mockReturnValue(mockRoom);

      const result = await roomManager.createRoom('TEST123', 'bluff-trivia');

      expect(result).toBe(mockRoom);
      expect(stateManager.createRoom).toHaveBeenCalledWith('TEST123', 'bluff-trivia');
    });

    it('should create room with default game type', async () => {
      stateManager.createRoom.mockReturnValue(mockRoom);

      const result = await roomManager.createRoom('TEST123');

      expect(result).toBe(mockRoom);
      expect(stateManager.createRoom).toHaveBeenCalledWith('TEST123', 'bluff-trivia');
    });

    it('should handle room creation failure', () => {
      stateManager.createRoom.mockImplementation(() => {
        throw new Error('Creation failed');
      });

      expect(() => roomManager.createRoom('TEST123')).toThrow('Creation failed');
    });
  });

  describe('getRoom', () => {
    it('should get room successfully', () => {
      stateManager.getRoom.mockReturnValue(mockRoom);

      const result = roomManager.getRoom('TEST123');

      expect(result).toBe(mockRoom);
      expect(stateManager.getRoom).toHaveBeenCalledWith('TEST123');
    });

    it('should throw error when room not found', () => {
      stateManager.getRoom.mockImplementation(() => {
        throw new Error('Room not found');
      });

      expect(() => roomManager.getRoom('INVALID')).toThrow('Room not found');
    });
  });

  describe('getRoomSafe', () => {
    it('should get room safely', () => {
      stateManager.getRoomSafe.mockReturnValue(mockRoom);

      const result = roomManager.getRoomSafe('TEST123');

      expect(result).toBe(mockRoom);
      expect(stateManager.getRoomSafe).toHaveBeenCalledWith('TEST123');
    });

    it('should return undefined when room not found', () => {
      stateManager.getRoomSafe.mockReturnValue(undefined);

      const result = roomManager.getRoomSafe('INVALID');

      expect(result).toBeUndefined();
    });
  });

  describe('hasRoom', () => {
    it('should check if room exists', () => {
      stateManager.hasRoom.mockReturnValue(true);

      const result = roomManager.hasRoom('TEST123');

      expect(result).toBe(true);
      expect(stateManager.hasRoom).toHaveBeenCalledWith('TEST123');
    });
  });

  describe('deleteRoom', () => {
    it('should delete room successfully', () => {
      stateManager.deleteRoom.mockReturnValue(true);
      timerService.stopTimerForRoom.mockReturnValue(true);

      const result = roomManager.deleteRoom('TEST123');

      expect(result).toBe(true);
      expect(timerService.stopTimerForRoom).toHaveBeenCalledWith('TEST123');
      expect(stateManager.deleteRoom).toHaveBeenCalledWith('TEST123');
    });
  });

  describe('addPlayer', () => {
    it('should add player successfully', async () => {
      stateManager.addPlayer.mockResolvedValue(undefined);

      const result = await roomManager.addPlayer('TEST123', mockPlayer);

      expect(result).toBe(true);
      expect(stateManager.addPlayer).toHaveBeenCalledWith('TEST123', mockPlayer);
    });

    it('should handle player addition failure', async () => {
      stateManager.addPlayer.mockRejectedValue(new Error('Add failed'));

      const result = await roomManager.addPlayer('TEST123', mockPlayer);

      expect(result).toBe(false);
    });
  });

  describe('removePlayer', () => {
    it('should remove player successfully', async () => {
      stateManager.removePlayer.mockResolvedValue(mockRoom);

      const result = await roomManager.removePlayer('TEST123', 'player-1');

      expect(result).toBe(true);
      expect(stateManager.removePlayer).toHaveBeenCalledWith('TEST123', 'player-1');
    });

    it('should handle player removal when room becomes empty', async () => {
      stateManager.removePlayer.mockResolvedValue(null);

      const result = await roomManager.removePlayer('TEST123', 'player-1');

      expect(result).toBe(false);
    });

    it('should handle player removal failure', async () => {
      stateManager.removePlayer.mockRejectedValue(new Error('Remove failed'));

      const result = await roomManager.removePlayer('TEST123', 'player-1');

      expect(result).toBe(false);
    });
  });

  describe('processGameAction', () => {
    it('should process game action successfully', async () => {
      const mockAction: GameAction = {
        type: 'start',
        playerId: 'player-1',
        data: {},
        timestamp: Date.now(),
      };
      const mockEvents: GameEvent[] = [
        {
          type: 'gameStarted',
          data: { phase: 'prompt' },
          target: 'room',
          timestamp: Date.now(),
        },
      ];

      stateManager.processGameAction.mockResolvedValue(mockEvents);

      const result = await roomManager.processGameAction('TEST123', 'player-1', mockAction);

      expect(result).toEqual(mockEvents);
      expect(stateManager.processGameAction).toHaveBeenCalledWith('TEST123', 'player-1', mockAction);
    });

    it('should handle game action failure', async () => {
      const mockAction: GameAction = {
        type: 'start',
        playerId: 'player-1',
        data: {},
        timestamp: Date.now(),
      };

      stateManager.processGameAction.mockRejectedValue(new Error('Action failed'));

      await expect(roomManager.processGameAction('TEST123', 'player-1', mockAction)).rejects.toThrow('Action failed');
    });
  });

  describe('advanceGamePhase', () => {
    it('should advance game phase successfully', async () => {
      const mockEvents: GameEvent[] = [
        {
          type: 'phaseChanged',
          data: { phase: 'prompt' },
          target: 'room',
          timestamp: Date.now(),
        },
      ];

      stateManager.advanceGamePhase.mockResolvedValue(mockEvents);

      const result = await roomManager.advanceGamePhase('TEST123');

      expect(result).toEqual(mockEvents);
      expect(stateManager.advanceGamePhase).toHaveBeenCalledWith('TEST123');
    });

    it('should handle phase advancement failure', async () => {
      stateManager.advanceGamePhase.mockRejectedValue(new Error('Phase change failed'));

      const result = await roomManager.advanceGamePhase('TEST123');

      expect(result).toEqual([]);
    });
  });

  describe('updateTimer', () => {
    it('should update timer successfully', async () => {
      const mockEvents: GameEvent[] = [
        {
          type: 'timer',
          data: { timeLeft: 30 },
          target: 'room',
          timestamp: Date.now(),
        },
      ];

      stateManager.updateTimer.mockResolvedValue(mockEvents);

      const result = await roomManager.updateTimer('TEST123', -5);

      expect(result).toEqual(mockEvents);
      expect(stateManager.updateTimer).toHaveBeenCalledWith('TEST123', -5);
    });

    it('should handle timer update failure', async () => {
      stateManager.updateTimer.mockRejectedValue(new Error('Timer update failed'));

      const result = await roomManager.updateTimer('TEST123', -5);

      expect(result).toEqual([]);
    });
  });

  describe('cleanupDuplicatePlayers', () => {
    it('should cleanup duplicate players successfully', async () => {
      stateManager.cleanupDuplicatePlayers.mockResolvedValue(undefined);

      await roomManager.cleanupDuplicatePlayers('TEST123');

      expect(stateManager.cleanupDuplicatePlayers).toHaveBeenCalledWith('TEST123');
    });
  });

  describe('cleanupInactiveRooms', () => {
    it('should cleanup inactive rooms successfully', () => {
      stateManager.cleanupInactiveRooms.mockReturnValue(5);

      const result = roomManager.cleanupInactiveRooms();

      expect(result).toBe(5);
      expect(stateManager.cleanupInactiveRooms).toHaveBeenCalled();
    });
  });

  describe('getRoomStats', () => {
    it('should get room stats successfully', () => {
      const mockStats = {
        totalRooms: 10,
        activePlayers: 25,
        gameTypes: { 'bluff-trivia': 5, 'fibbing-it': 5 },
      };

      stateManager.getRoomStats.mockReturnValue(mockStats);

      const result = roomManager.getRoomStats();

      expect(result).toEqual(mockStats);
      expect(stateManager.getRoomStats).toHaveBeenCalled();
    });
  });
});

