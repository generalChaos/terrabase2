import { Test, TestingModule } from '@nestjs/testing';
import { StateManagerService } from '../state-manager.service';
import { GameRegistry } from '../../game-registry';
import { ImmutableRoomState } from '../room.state';
import { Player, GameAction, GameEvent } from '@party/types';
import { RoomNotFoundError, PlayerNotFoundError } from '../../errors';
import { TimerService } from '../../timer.service';
import { EventBroadcasterService } from '../../services/event-broadcaster.service';

describe('StateManagerService', () => {
  let service: StateManagerService;
  let gameRegistry: jest.Mocked<GameRegistry>;
  let mockEngine: jest.Mocked<any>;
  let mockRoom: ImmutableRoomState;
  let mockPlayer: Player;

  beforeEach(async () => {
    mockEngine = {
      initialize: jest.fn(),
      processAction: jest.fn(),
      advancePhase: jest.fn(),
      updateTimer: jest.fn(),
      generatePhaseEvents: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StateManagerService,
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
            isTimerRunning: jest.fn(),
            getActiveTimers: jest.fn(),
            getTimerCount: jest.fn(),
            onModuleDestroy: jest.fn(),
          },
        },
        {
          provide: EventBroadcasterService,
          useValue: {
            broadcastEvents: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StateManagerService>(StateManagerService);
    gameRegistry = module.get(GameRegistry);

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

    // Setup default mocks
    gameRegistry.getGame.mockReturnValue(mockEngine);
    mockEngine.initialize.mockReturnValue({
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
    });
  });

  describe('createRoom', () => {
    it('should create a new room successfully', () => {
      const result = service.createRoom('TEST123', 'bluff-trivia');

      expect(result).toBeDefined();
      expect(result.code).toBe('TEST123');
      expect(result.gameType).toBe('bluff-trivia');
      expect(result.players).toEqual([]);
      expect(result.phase).toBe('lobby');
    });

    it('should create a room with default game type', () => {
      const result = service.createRoom('TEST123');

      expect(result.gameType).toBe('bluff-trivia');
    });

    it('should normalize room code to uppercase', () => {
      const result = service.createRoom('test123');

      expect(result.code).toBe('TEST123');
    });
  });

  describe('getRoom', () => {
    beforeEach(() => {
      // Manually add room to service for testing
      (service as any).rooms.set('TEST123', mockRoom);
    });

    it('should return room when it exists', () => {
      const result = service.getRoom('TEST123');

      expect(result).toBe(mockRoom);
    });

    it('should throw RoomNotFoundError when room does not exist', () => {
      expect(() => service.getRoom('NONEXISTENT')).toThrow(RoomNotFoundError);
    });

    it('should normalize room code to uppercase', () => {
      const result = service.getRoom('test123');

      expect(result).toBe(mockRoom);
    });
  });

  describe('hasRoom', () => {
    beforeEach(() => {
      (service as any).rooms.set('TEST123', mockRoom);
    });

    it('should return true when room exists', () => {
      expect(service.hasRoom('TEST123')).toBe(true);
    });

    it('should return false when room does not exist', () => {
      expect(service.hasRoom('NONEXISTENT')).toBe(false);
    });

    it('should normalize room code to uppercase', () => {
      expect(service.hasRoom('test123')).toBe(true);
    });
  });

  describe('addPlayer', () => {
    beforeEach(() => {
      (service as any).rooms.set('TEST123', mockRoom);
    });

    it('should add player to room successfully', async () => {
      const newPlayer: Player = {
        id: 'player-2',
        name: 'Player2',
        avatar: '🎮',
        connected: true,
        score: 0,
      };

      await service.addPlayer('TEST123', newPlayer);

      const updatedRoom = service.getRoom('TEST123');
      expect(updatedRoom.players).toHaveLength(2);
      expect(updatedRoom.players).toContainEqual(newPlayer);
    });

    it('should set first player as host', async () => {
      const newPlayer: Player = {
        id: 'player-2',
        name: 'Player2',
        avatar: '🎮',
        connected: true,
        score: 0,
      };

      await service.addPlayer('TEST123', newPlayer);

      const updatedRoom = service.getRoom('TEST123');
      expect(updatedRoom.hostId).toBe('player-1'); // First player should be host
    });

    it('should throw RoomNotFoundError when room does not exist', async () => {
      const newPlayer: Player = {
        id: 'player-2',
        name: 'Player2',
        avatar: '🎮',
        connected: true,
        score: 0,
      };

      await expect(service.addPlayer('NONEXISTENT', newPlayer)).rejects.toThrow(RoomNotFoundError);
    });
  });

  describe('removePlayer', () => {
    beforeEach(() => {
      (service as any).rooms.set('TEST123', mockRoom);
    });

    it('should remove player from room successfully', async () => {
      const result = await service.removePlayer('TEST123', 'player-1');

      // When removing the last player, the room gets deleted and returns null
      expect(result).toBeNull();
    });

    it('should throw PlayerNotFoundError when player does not exist', async () => {
      await expect(service.removePlayer('TEST123', 'nonexistent')).rejects.toThrow(PlayerNotFoundError);
    });

    it('should throw RoomNotFoundError when room does not exist', async () => {
      await expect(service.removePlayer('NONEXISTENT', 'player-1')).rejects.toThrow(RoomNotFoundError);
    });
  });

  describe('processGameAction', () => {
    beforeEach(() => {
      (service as any).rooms.set('TEST123', mockRoom);
    });

    it('should process game action successfully', async () => {
      const action: GameAction = {
        type: 'start',
        playerId: 'player-1',
        timestamp: Date.now(),
        data: {},
      };

      mockEngine.processAction.mockReturnValue({
        isValid: true,
        newState: {
          phase: 'prompt',
          players: [mockPlayer],
          round: 1,
          maxRounds: 5,
          timeLeft: 15,
          scores: new Map(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isRoundComplete: false,
          phaseStartTime: new Date(),
        },
        events: [{ type: 'phaseChanged', data: { phase: 'prompt' } }],
      });

      const result = await service.processGameAction('TEST123', 'player-1', action);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('phaseChanged');
    });

    it('should handle invalid game action', async () => {
      const action: GameAction = {
        type: 'start',
        playerId: 'player-1',
        timestamp: Date.now(),
        data: {},
      };

      mockEngine.processAction.mockReturnValue({
        isValid: false,
        error: 'Invalid action',
      });

      const result = await service.processGameAction('TEST123', 'player-1', action);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('error');
    });

    it('should throw PlayerNotFoundError when player does not exist', async () => {
      const action: GameAction = {
        type: 'start',
        playerId: 'nonexistent',
        timestamp: Date.now(),
        data: {},
      };

      await expect(service.processGameAction('TEST123', 'nonexistent', action)).rejects.toThrow(PlayerNotFoundError);
    });

    it('should throw RoomNotFoundError when room does not exist', async () => {
      const action: GameAction = {
        type: 'start',
        playerId: 'player-1',
        timestamp: Date.now(),
        data: {},
      };

      await expect(service.processGameAction('NONEXISTENT', 'player-1', action)).rejects.toThrow(RoomNotFoundError);
    });
  });

  describe('advanceGamePhase', () => {
    beforeEach(() => {
      (service as any).rooms.set('TEST123', mockRoom);
    });

    it('should advance game phase successfully', async () => {
      mockEngine.advancePhase.mockReturnValue({
        phase: 'prompt',
        players: [mockPlayer],
        round: 1,
        maxRounds: 5,
        timeLeft: 15,
        scores: new Map(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isRoundComplete: false,
        phaseStartTime: new Date(),
      });

      mockEngine.generatePhaseEvents.mockReturnValue([
        { type: 'phaseChanged', data: { phase: 'prompt' } },
      ]);

      const result = await service.advanceGamePhase('TEST123');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('phaseChanged');
    });

    it('should return empty array when game engine not found', async () => {
      gameRegistry.getGame.mockReturnValue(undefined);

      const result = await service.advanceGamePhase('TEST123');

      expect(result).toEqual([]);
    });

    it('should throw RoomNotFoundError when room does not exist', async () => {
      await expect(service.advanceGamePhase('NONEXISTENT')).rejects.toThrow(RoomNotFoundError);
    });
  });

  describe('updateTimer', () => {
    beforeEach(() => {
      (service as any).rooms.set('TEST123', mockRoom);
    });

    it('should update timer successfully', async () => {
      mockEngine.updateTimer.mockReturnValue({
        phase: 'prompt',
        players: [mockPlayer],
        round: 1,
        maxRounds: 5,
        timeLeft: 10,
        scores: new Map(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isRoundComplete: false,
        phaseStartTime: new Date(),
      });

      const result = await service.updateTimer('TEST123', -5);

      // updateTimer returns timer events, not empty array
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('timer');
    });

    it('should handle game engine without updateTimer method', async () => {
      // Test with a different approach - mock the engine to return undefined for updateTimer
      // but ensure the method doesn't hang
      const engineWithoutUpdateTimer = {
        ...mockEngine,
        updateTimer: undefined,
      };
      gameRegistry.getGame.mockReturnValue(engineWithoutUpdateTimer);

      // Create a proper ImmutableRoomState instance with timeLeft > 0
      const roomWithTimeLeft = new ImmutableRoomState(
        'TEST123',
        'bluff-trivia',
        {
          phase: 'prompt',
          players: [mockPlayer],
          round: 1,
          maxRounds: 5,
          timeLeft: 10, // Ensure timeLeft > 0
          scores: new Map(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isRoundComplete: false,
          phaseStartTime: new Date(),
        },
        [mockPlayer],
        'prompt',
        'player-1',
        new Date(),
        1,
      );
      (service as any).rooms.set('TEST123', roomWithTimeLeft);

      const result = await service.updateTimer('TEST123', -5);

      // When no updateTimer method, should return timer event with current timeLeft
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('timer');
      expect(result[0].data.timeLeft).toBe(10);
    });

    it('should throw RoomNotFoundError when room does not exist', async () => {
      await expect(service.updateTimer('NONEXISTENT', -5)).rejects.toThrow(RoomNotFoundError);
    });
  });

  describe('cleanupDuplicatePlayers', () => {
    it('should cleanup duplicate players for specific room', async () => {
      // First create a room, then cleanup
      service.createRoom('TEST123');
      await expect(service.cleanupDuplicatePlayers('TEST123')).resolves.toBeUndefined();
    });
  });

  describe('cleanupInactiveRooms', () => {
    it('should cleanup inactive rooms', async () => {
      // cleanupInactiveRooms returns a number (count of cleaned rooms)
      const result = service.cleanupInactiveRooms();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getRoomStats', () => {
    it('should get room statistics', async () => {
      const result = await service.getRoomStats();

      expect(result).toBeDefined();
      expect(typeof result.totalRooms).toBe('number');
      expect(typeof result.activePlayers).toBe('number');
      expect(typeof result.gameTypes).toBe('object');
    });
  });

  describe('getRoomCount', () => {
    it('should get total room count', async () => {
      const result = await service.getRoomCount();

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getActivePlayerCount', () => {
    it('should get active player count', async () => {
      const result = await service.getActivePlayerCount();

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});
