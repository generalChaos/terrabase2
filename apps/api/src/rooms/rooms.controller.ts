import { Controller, Post, Body } from '@nestjs/common';
import { RoomManager } from './room-manager';
import { genRoomCode } from './room-code.util';

type CreateRoomDto = {
  gameType?: string;
};

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomManager: RoomManager) {}

  @Post()
  async createRoom(@Body() body: CreateRoomDto) {
    const gameType = body.gameType || 'fibbing-it';
    
    // Generate a room code
    const code = genRoomCode();
    
    // Create the room using the room manager so it's available for WebSocket connections
    const room = this.roomManager.createRoom(code, gameType);
    
    return { code: room.code };
  }
}
