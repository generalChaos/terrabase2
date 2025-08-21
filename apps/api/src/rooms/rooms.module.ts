import { Module } from '@nestjs/common';
import { RoomsGateway } from './rooms.gateway';
import { RoomManager } from './room-manager';
import { GameRegistry } from './game-registry';
import { TimerService } from './timer.service';
import { ErrorHandlerService } from './error-handler.service';
import { StateManagerService } from './state/state-manager.service';

@Module({
  providers: [
    TimerService,           // Provide first - no dependencies
    GameRegistry,          // No dependencies
    ErrorHandlerService,   // No dependencies
    StateManagerService,   // Depends on GameRegistry
    RoomManager,           // Depends on TimerService, GameRegistry, and StateManagerService
    RoomsGateway,          // Depends on RoomManager, TimerService, and ErrorHandlerService
  ],
  exports: [RoomManager, GameRegistry, TimerService, ErrorHandlerService, StateManagerService],
})
export class RoomsModule {}
