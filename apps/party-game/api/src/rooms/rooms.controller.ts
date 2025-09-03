import { Controller, Post, Delete, Body, Param, Logger } from '@nestjs/common';
import { RoomManager } from './room-manager';
import { genRoomCode } from './room-code.util';

type CreateRoomDto = {
  gameType?: string;
  roomCode?: string;
};

@Controller('rooms')
export class RoomsController {
  private readonly logger = new Logger(RoomsController.name);

  constructor(private readonly roomManager: RoomManager) {}

  @Post()
  async createRoom(@Body() body: CreateRoomDto) {
    const gameType = body.gameType || 'fibbing-it';

    // Use provided room code or generate one if not provided
    const code = body.roomCode || genRoomCode();
    this.logger.log(
      `🏠 Creating room with code: ${code}, game type: ${gameType}`,
    );

    // Check if room already exists
    if (this.roomManager.hasRoom(code)) {
      this.logger.warn(
        `⚠️ Room ${code} already exists, cannot create duplicate`,
      );
      return { error: 'Room already exists', code: null };
    }

    // Create the room using the room manager so it's available for WebSocket connections
    const room = this.roomManager.createRoom(code, gameType);

    this.logger.log(
      `✅ Room ${room.code} created successfully with ${room.players.length} players`,
    );

    return { code: room.code };
  }

  @Delete(':code')
  async deleteRoom(@Param('code') code: string) {
    this.logger.log(`🗑️ Deleting room: ${code}`);
    
    try {
      const deleted = this.roomManager.deleteRoom(code);
      
      if (deleted) {
        this.logger.log(`✅ Room ${code} deleted successfully`);
        return { success: true, message: `Room ${code} deleted successfully` };
      } else {
        this.logger.warn(`⚠️ Room ${code} not found`);
        return { success: false, message: `Room ${code} not found` };
      }
    } catch (error) {
      this.logger.error(`❌ Error deleting room ${code}:`, error);
      return { 
        success: false, 
        message: `Error deleting room: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}
