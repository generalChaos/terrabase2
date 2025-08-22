import { Module } from '@nestjs/common';
import { RoomsGateway } from './rooms.gateway';
import { RoomsController } from './rooms.controller';
import { RoomManager } from './room-manager';
import { GameRegistry } from './game-registry';
import { TimerService } from './timer.service';
import { ErrorHandlerService } from './error-handler.service';
import { StateManagerService } from './state/state-manager.service';
import { GameCommandHandler } from './commands/game-command.handler';
import { ConnectionManagerService } from './services/connection-manager.service';
import { EventBroadcasterService } from './services/event-broadcaster.service';
import { ConnectionGatewayService } from './services/connection-gateway.service';
import { GameGatewayService } from './services/game-gateway.service';
import { EventGatewayService } from './services/event-gateway.service';

@Module({
  controllers: [RoomsController],
  providers: [
    TimerService,             // Provide first - no dependencies
    GameRegistry,            // No dependencies
    ErrorHandlerService,     // No dependencies
    StateManagerService,     // Depends on GameRegistry
    RoomManager,             // Depends on TimerService, GameRegistry, and StateManagerService
    GameCommandHandler,      // Depends on RoomManager and TimerService
    ConnectionManagerService, // Depends on RoomManager
    EventBroadcasterService, // No direct service dependencies (uses Namespace from gateway)
    ConnectionGatewayService, // Depends on ConnectionManager, EventBroadcaster, and ErrorHandler
    GameGatewayService,      // Depends on RoomManager, TimerService, and ErrorHandler
    EventGatewayService,     // Depends on RoomManager and EventBroadcaster
    RoomsGateway,            // Depends on all of the above
  ],
  exports: [RoomManager, GameRegistry, TimerService, ErrorHandlerService, StateManagerService],
})
export class RoomsModule {}
