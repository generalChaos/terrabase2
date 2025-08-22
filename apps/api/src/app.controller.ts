import { Controller, Get } from '@nestjs/common';
import { RoomManager } from './rooms/room-manager';
import { TimerService } from './rooms/timer.service';

@Controller()
export class AppController {
  constructor(
    private readonly roomManager: RoomManager,
    private readonly timerService: TimerService,
  ) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      resources: {
        activeRooms: this.roomManager.getRoomCount(),
        activePlayers: this.roomManager.getActivePlayerCount(),
        activeTimers: this.timerService.getTimerCount(),
      },
    };
  }
}
