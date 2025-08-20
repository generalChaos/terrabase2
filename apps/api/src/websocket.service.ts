import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WebSocketService {
  private io: Server | null = null;

  setServer(io: Server) {
    this.io = io;
  }

  getServer(): Server {
    if (!this.io) {
      throw new Error('WebSocket server not initialized');
    }
    return this.io;
  }

  isReady(): boolean {
    return this.io !== null;
  }
}
