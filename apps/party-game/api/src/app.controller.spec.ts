import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { RoomManager } from './rooms/room-manager';
import { TimerService } from './rooms/timer.service';

describe('AppController', () => {
  let appController: AppController;
  let mockRoomManager: jest.Mocked<RoomManager>;
  let mockTimerService: jest.Mocked<TimerService>;

  beforeEach(async () => {
    mockRoomManager = {
      getRoomCount: jest.fn().mockReturnValue(5),
      getActivePlayerCount: jest.fn().mockReturnValue(12),
    } as any;

    mockTimerService = {
      getTimerCount: jest.fn().mockReturnValue(3),
    } as any;

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: RoomManager, useValue: mockRoomManager },
        { provide: TimerService, useValue: mockTimerService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = appController.getHealth();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.resources.activeRooms).toBe(5);
      expect(result.resources.activePlayers).toBe(12);
      expect(result.resources.activeTimers).toBe(3);
    });
  });
});
