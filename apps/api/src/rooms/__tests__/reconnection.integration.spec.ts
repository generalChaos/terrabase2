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
import { StateManagerService } from '../state/state-manager.service';
import { ImmutableRoomState } from '../state/room.state';
import { Player } from '@party/types';

describe('Reconnection Integration Tests', () => {
  let gateway: RoomsGateway;
  let roomManager: RoomManager;
  let connectionManager: ConnectionManagerService;
  let stateManager: StateManagerService;

  const mockPlayer: Player = {
    id: 'socket-1',
    name: 'TestPlayer',
    avatar: '😀',
    score: 100,
    connected: true,
  };

  const mockRoom: ImmutableRoomState = {
    code: 'TEST123',
    gameType: 'fibbing-it',
    phase: 'lobby',
    players: [mockPlayer],
    hostId: 'socket-1',
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsGateway,
        RoomManager,
        StateManagerService,
        ConnectionManagerService,
        {
          provide: TimerService,
          useValue: {
            startTimer: jest.fn(),
            stopTimer: jest.fn(),
            updateTimer: jest.fn(),
            getTimeLeft: jest.fn(),
          },
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jest.fn(),
            createErrorResponse: jest.fn(),
          },
        },
        {
          provide: EventBroadcasterService,
          useValue: {
            broadcastToRoom: jest.fn(),
            broadcastToPlayer: jest.fn(),
            setNamespace: jest.fn(),
          },
        },
        {
          provide: ConnectionGatewayService,
          useValue: {
            handleConnection: jest.fn(),
            handleDisconnection: jest.fn(),
            handlePlayerJoin: jest.fn(),
          },
        },
        {
          provide: GameGatewayService,
          useValue: {
            startGame: jest.fn(),
            handleGameAction: jest.fn(),
          },
        },
        {
          provide: EventGatewayService,
          useValue: {
            handleGameEvent: jest.fn(),
            handleTimerEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<RoomsGateway>(RoomsGateway);
    roomManager = module.get<RoomManager>(RoomManager);
    connectionManager = module.get<ConnectionManagerService>(ConnectionManagerService);
    stateManager = module.get<StateManagerService>(StateManagerService);
  });

  describe('Full Reconnection Flow', () => {
    it('should handle complete player reconnection cycle', async () => {
      // Step 1: Create a room
      const roomData = {
        code: 'TEST123',
        gameType: 'fibbing-it',
        hostId: 'socket-1',
      };

      // Mock the state manager to return our test room
      jest.spyOn(stateManager, 'createRoom').mockResolvedValue(mockRoom);
      jest.spyOn(stateManager, 'hasRoom').mockReturnValue(true);
      jest.spyOn(stateManager, 'getRoomSafe').mockResolvedValue(mockRoom);

      const createdRoom = await roomManager.createRoom(roomData);
      expect(createdRoom).toBe(mockRoom);

      // Step 2: Simulate player disconnection
      const disconnectedPlayer = { ...mockPlayer, connected: false };
      const roomWithDisconnectedPlayer = {
        ...mockRoom,
        players: [disconnectedPlayer],
      };

      jest.spyOn(stateManager, 'getRoomSafe').mockResolvedValue(roomWithDisconnectedPlayer);
      jest.spyOn(stateManager, 'updatePlayerConnection').mockResolvedValue();

      const disconnectionResult = await connectionManager.handleDisconnection(
        'TEST123',
        'socket-1'
      );
      expect(disconnectionResult).toBe(true);

      // Step 3: Simulate player reconnection attempt
      const reconnectionResult = await connectionManager.handlePlayerJoin(
        'TEST123',
        'socket-2', // New socket ID
        'TestPlayer', // Same nickname
        '😀' // Same avatar
      );

      expect(reconnectionResult.success).toBe(true);
      expect(reconnectionResult.isReconnection).toBe(true);
      expect(reconnectionResult.reconnectedPlayerId).toBe('socket-1');
    });

    it('should preserve player score during reconnection', async () => {
      // Create room with player that has score
      const playerWithScore = { ...mockPlayer, score: 250 };
      const roomWithScore = { ...mockRoom, players: [playerWithScore] };

      jest.spyOn(stateManager, 'createRoom').mockResolvedValue(roomWithScore);
      jest.spyOn(stateManager, 'hasRoom').mockReturnValue(true);
      jest.spyOn(stateManager, 'getRoomSafe').mockResolvedValue(roomWithScore);

      // Simulate disconnection
      const disconnectedPlayer = { ...playerWithScore, connected: false };
      const roomWithDisconnectedPlayer = {
        ...roomWithScore,
        players: [disconnectedPlayer],
      };

      jest.spyOn(stateManager, 'getRoomSafe').mockResolvedValue(roomWithDisconnectedPlayer);
      jest.spyOn(stateManager, 'updatePlayerConnection').mockResolvedValue();

      await connectionManager.handleDisconnection('TEST123', 'socket-1');

      // Simulate reconnection
      jest.spyOn(stateManager, 'removePlayer').mockResolvedValue();
      jest.spyOn(stateManager, 'addPlayer').mockResolvedValue(true);

      const reconnectionResult = await connectionManager.handlePlayerJoin(
        'TEST123',
        'socket-2',
        'TestPlayer',
        '😀'
      );

      expect(reconnectionResult.success).toBe(true);
      expect(reconnectionResult.isReconnection).toBe(true);

      // Verify that the new player has the same score
      expect(stateManager.addPlayer).toHaveBeenCalledWith('TEST123', {
        id: 'socket-2',
        name: 'TestPlayer',
        avatar: '😀',
        connected: true,
        score: 250, // Score should be preserved
      });
    });

    it('should handle multiple players with same name correctly', async () => {
      // Create room with multiple players
      const player1 = { ...mockPlayer, id: 'socket-1', name: 'Player1' };
      const player2 = { ...mockPlayer, id: 'socket-2', name: 'Player2' };
      const roomWithMultiplePlayers = {
        ...mockRoom,
        players: [player1, player2],
      };

      jest.spyOn(stateManager, 'createRoom').mockResolvedValue(roomWithMultiplePlayers);
      jest.spyOn(stateManager, 'hasRoom').mockReturnValue(true);
      jest.spyOn(stateManager, 'getRoomSafe').mockResolvedValue(roomWithMultiplePlayers);

      // Try to join with existing name
      const joinResult = await connectionManager.handlePlayerJoin(
        'TEST123',
        'socket-3',
        'Player1', // Existing name
        '😎'
      );

      expect(joinResult.success).toBe(false);
      expect(joinResult.error).toBe('Player name already taken');
    });

    it('should cleanup duplicate players after reconnection', async () => {
      // Create room with disconnected player
      const disconnectedPlayer = { ...mockPlayer, connected: false };
      const roomWithDisconnectedPlayer = {
        ...mockRoom,
        players: [disconnectedPlayer],
      };

      jest.spyOn(stateManager, 'createRoom').mockResolvedValue(roomWithDisconnectedPlayer);
      jest.spyOn(stateManager, 'hasRoom').mockReturnValue(true);
      jest.spyOn(stateManager, 'getRoomSafe').mockResolvedValue(roomWithDisconnectedPlayer);
      jest.spyOn(stateManager, 'updatePlayerConnection').mockResolvedValue();

      // Disconnect player
      await connectionManager.handleDisconnection('TEST123', 'socket-1');

      // Reconnect player
      jest.spyOn(stateManager, 'removePlayer').mockResolvedValue();
      jest.spyOn(stateManager, 'addPlayer').mockResolvedValue(true);
      jest.spyOn(stateManager, 'cleanupDuplicatePlayers').mockResolvedValue();

      const reconnectionResult = await connectionManager.handlePlayerJoin(
        'TEST123',
        'socket-2',
        'TestPlayer',
        '😀'
      );

      expect(reconnectionResult.success).toBe(true);
      expect(stateManager.cleanupDuplicatePlayers).toHaveBeenCalledWith('TEST123');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle room not found during reconnection', async () => {
      jest.spyOn(stateManager, 'hasRoom').mockReturnValue(false);

      const connectionResult = await connectionManager.handleConnection(
        'INVALID',
        'socket-1'
      );

      expect(connectionResult.success).toBe(false);
      expect(connectionResult.error).toContain('Room INVALID not found');
    });

    it('should handle player join failure gracefully', async () => {
      jest.spyOn(stateManager, 'hasRoom').mockReturnValue(true);
      jest.spyOn(stateManager, 'getRoomSafe').mockResolvedValue(mockRoom);
      jest.spyOn(stateManager, 'addPlayer').mockResolvedValue(false);

      const joinResult = await connectionManager.handlePlayerJoin(
        'TEST123',
        'socket-2',
        'NewPlayer',
        '😎'
      );

      expect(joinResult.success).toBe(false);
      expect(joinResult.error).toBe('Failed to add player to room');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty nickname gracefully', async () => {
      const joinResult = await connectionManager.handlePlayerJoin(
        'TEST123',
        'socket-1',
        '', // Empty nickname
        '😀'
      );

      expect(joinResult.success).toBe(false);
      expect(joinResult.error).toBe('Nickname cannot be empty');
    });

    it('should handle missing nickname gracefully', async () => {
      const joinResult = await connectionManager.handlePlayerJoin(
        'TEST123',
        'socket-1',
        undefined as any, // Missing nickname
        '😀'
      );

      expect(joinResult.success).toBe(false);
      expect(joinResult.error).toBe('Nickname is required');
    });
  });
});
