import { Module } from '@nestjs/common';
import { RoomsGateway } from './rooms.gateway';
import { RoomManager } from './room-manager';
import { GameRegistry } from './game-registry';
import { TimerService } from './timer.service';
import { ErrorHandlerService } from './error-handler.service';

@Module({
  providers: [
    TimerService,           // Provide first - no dependencies
    GameRegistry,          // No dependencies
    ErrorHandlerService,   // No dependencies
    RoomManager,           // Depends on TimerService and GameRegistry
    RoomsGateway,          // Depends on RoomManager, TimerService, and ErrorHandlerService
  ],
  exports: [RoomManager, GameRegistry, TimerService, ErrorHandlerService],
})
export class RoomsModule {}
