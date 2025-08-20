import { Controller, Post } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { genRoomCode } from './room-code.util';

const prisma = new PrismaClient();

@Controller('rooms')
export class RoomsController {
  @Post()
  async createRoom() {
    // retry on rare collision
    for (let i = 0; i < 5; i++) {
      const code = genRoomCode();
      try {
        const room = await prisma.game.create({
          data: {
            roomCode: code,
            status: 'lobby',
            round: 0,
            maxRounds: 5,
            hostId: 'host',
          },
        });
        return { code: room.roomCode };
      } catch {
        /* unique collision → try again */
      }
    }
    return { error: 'ROOM_CREATE_FAILED' };
  }
}
