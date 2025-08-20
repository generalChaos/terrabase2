import { Module } from '@nestjs/common';
import { RoomsGateway } from './rooms.gateway';
import { RoomManager } from './room-manager';
import { GameRegistry } from './game-registry';
import { TimerService } from './timer.service';

@Module({
  providers: [RoomsGateway, RoomManager, GameRegistry, TimerService],
  exports: [RoomManager, GameRegistry, TimerService],
})
export class RoomsModule {}
