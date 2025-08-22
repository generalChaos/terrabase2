import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { EventBroadcasterService } from './event-broadcaster.service';
import { ErrorHandlerService } from '../error-handler.service';
import { Result, success, failure } from '@party/types';
import { EventType, EventTarget } from '../constants';

@Injectable()
export class EventGatewayService {
  private readonly logger = new Logger(EventGatewayService.name);

  constructor(
    private readonly eventBroadcaster: EventBroadcasterService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  /**
   * Broadcast game events to a room
   */
  async broadcastEvents(
    roomCode: string,
    events: any[],
    roomState?: any,
  ): Promise<Result<void, any>> {
    try {
      this.eventBroadcaster.broadcastEvents({ roomCode, events, roomState });
      this.logger.log(`Events broadcasted to room ${roomCode}`);
      return success(undefined);
    } catch (error) {
      const errorResponse = this.errorHandler.handleError(
        error,
        'event-broadcast',
      );
      this.logger.error(
        `Error broadcasting events to room ${roomCode}:`,
        errorResponse,
      );
      return failure(errorResponse);
    }
  }

  /**
   * Broadcast room update to all players
   */
  async broadcastRoomUpdate(
    roomCode: string,
    roomData: any,
  ): Promise<Result<void, any>> {
    try {
      await this.eventBroadcaster.broadcastRoomUpdate(roomCode, roomData);
      this.logger.log(`Room update broadcasted to room ${roomCode}`);
      return success(undefined);
    } catch (error) {
      const errorResponse = this.errorHandler.handleError(
        error,
        'room-update-broadcast',
      );
      this.logger.error(
        `Error broadcasting room update to room ${roomCode}:`,
        errorResponse,
      );
      return failure(errorResponse);
    }
  }

  /**
   * Handle game events and broadcast them appropriately
   */
  async handleGameEvents(
    roomCode: string,
    events: any[],
    roomState?: any,
  ): Promise<Result<void, any>> {
    try {
      // Use the available broadcastEvents method
      await this.broadcastEvents(roomCode, events, roomState);

      this.logger.log(
        `Processed ${events.length} game events for room ${roomCode}`,
      );
      return success(undefined);
    } catch (error) {
      const errorResponse = this.errorHandler.handleError(
        error,
        'game-events-handling',
      );
      this.logger.error(
        `Error handling game events for room ${roomCode}:`,
        errorResponse,
      );
      return failure(errorResponse);
    }
  }
}
