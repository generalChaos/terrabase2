import { Module } from '@nestjs/common';
import { RoomsGateway } from './rooms.gateway';
import { RoomManager } from './room-manager';
import { GameRegistry } from './game-registry';
import { TimerService } from './timer.service';
import { ErrorHandlerService } from './error-handler.service';
import { StateManagerService } from './state/state-manager.service';
import { GameCommandHandler } from './commands/game-command.handler';
import { ConnectionManagerService } from './services/connection-manager.service';
import { EventBroadcasterService } from './services/event-broadcaster.service';

@Module({
  providers: [
    TimerService,             // Provide first - no dependencies
    GameRegistry,            // No dependencies
    ErrorHandlerService,     // No dependencies
    StateManagerService,     // Depends on GameRegistry
    RoomManager,             // Depends on TimerService, GameRegistry, and StateManagerService
    GameCommandHandler,      // Depends on RoomManager and TimerService
    ConnectionManagerService, // Depends on RoomManager
    EventBroadcasterService, // No direct service dependencies (uses Namespace from gateway)
    RoomsGateway,            // Depends on all of the above
  ],
  exports: [RoomManager, GameRegistry, TimerService, ErrorHandlerService, StateManagerService],
})
export class RoomsModule {}
