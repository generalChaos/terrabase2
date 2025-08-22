import { Controller, Post, Body, Logger } from '@nestjs/common';
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
    this.logger.log(`🏠 Creating room with code: ${code}, game type: ${gameType}`);
    
    // Check if room already exists
    if (this.roomManager.hasRoom(code)) {
      this.logger.warn(`⚠️ Room ${code} already exists, cannot create duplicate`);
      return { error: 'Room already exists', code: null };
    }
    
    // Create the room using the room manager so it's available for WebSocket connections
    const room = this.roomManager.createRoom(code, gameType);
    
    this.logger.log(`✅ Room ${room.code} created successfully with ${room.players.length} players`);
    
    return { code: room.code };
  }
}
