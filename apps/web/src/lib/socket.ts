import { io, Socket } from 'socket.io-client';
import type { SocketEvent } from '@party/types';
import { getApiUrl, AppConfig } from '@party/config';

export function connectToRoom(code: string): Socket {
  const url = `${getApiUrl('ws')}${AppConfig.API.ROOMS_ENDPOINT}`;
  console.log('connecting to', url, 'with room code:', code);

  const socket = io(url, {
    transports: ['websocket'],
    query: { roomCode: code },
  });

  return socket;
}

// Type-safe event emitter helper
export function emitTyped<T>(
  socket: Socket,
  event: SocketEvent,
  data?: T
): void {
  socket.emit(event, data);
}

// Type-safe event listener helper
export function onTyped<T>(
  socket: Socket,
  event: SocketEvent,
  callback: (data: T) => void
): void {
  socket.on(event, callback);
}

// Convenience functions for common events
export function submitAnswer(socket: Socket, answer: string): void {
  emitTyped(socket, 'submitAnswer', { answer });
}

export function submitVote(socket: Socket, choiceId: string): void {
  emitTyped(socket, 'submitVote', { choiceId });
}
