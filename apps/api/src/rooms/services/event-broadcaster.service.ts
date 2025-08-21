import { Injectable, Logger } from '@nestjs/common';
import { Namespace } from 'socket.io';
import { GameEvent } from '../game-engine.interface';
import { EventTarget } from '../constants';
import { ImmutableRoomState } from '../state/room.state';

export interface BroadcastOptions {
  roomCode: string;
  events: GameEvent[];
  roomState?: ImmutableRoomState;
}

@Injectable()
export class EventBroadcasterService {
  private readonly logger = new Logger(EventBroadcasterService.name);
  private namespace: Namespace | null = null;

  /**
   * Set the namespace for broadcasting
   */
  setNamespace(namespace: Namespace): void {
    this.namespace = namespace;
  }

  /**
   * Check if the broadcaster is ready
   */
  isReady(): boolean {
    return this.namespace !== null;
  }

  /**
   * Broadcast game events to appropriate targets
   */
  broadcastEvents(options: BroadcastOptions): void {
    if (!this.isReady()) {
      this.logger.warn('Broadcaster not ready, skipping event broadcast');
      return;
    }

    const { roomCode, events, roomState } = options;

    try {
      // Broadcast individual events
      for (const event of events) {
        this.broadcastEvent(roomCode, event);
      }

      // Broadcast room state update if provided
      if (roomState) {
        this.broadcastRoomUpdate(roomCode, roomState);
      }

    } catch (error) {
      this.logger.error(`❌ Error broadcasting events for room ${roomCode}:`, error);
    }
  }

  /**
   * Broadcast a single game event
   */
  private broadcastEvent(roomCode: string, event: GameEvent): void {
    if (!this.isReady()) return;

    try {
      switch (event.target) {
        case EventTarget.ALL:
          // Broadcast to specific room instead of entire namespace
          this.namespace!.to(roomCode).emit(event.type, event.data);
          break;
        case EventTarget.PLAYER:
          if (event.playerId) {
            this.namespace!.to(event.playerId).emit(event.type, event.data);
          }
          break;
        case EventTarget.HOST:
          // Send to host (first player)
          this.broadcastToHost(roomCode, event);
          break;
        default:
          this.logger.warn(`Unknown event target: ${event.target}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error broadcasting event ${event.type}:`, error);
    }
  }

  /**
   * Broadcast room state update to all clients in the room
   */
  broadcastRoomUpdate(roomCode: string, roomState: ImmutableRoomState): void {
    if (!this.isReady()) return;

    try {
      const serializedRoom = this.serializeRoom(roomState);
      console.log(`📡 Broadcasting room update for room ${roomCode}:`, serializedRoom);
      console.log(`📡 Namespace ready:`, this.isReady());
      console.log(`📡 Broadcasting to room:`, roomCode);
      // Broadcast to specific room instead of entire namespace
      this.namespace!.to(roomCode).emit('room', serializedRoom);
      this.logger.debug(`📡 Room state broadcasted for room ${roomCode}`);
    } catch (error) {
      this.logger.error(`❌ Error broadcasting room update for room ${roomCode}:`, error);
    }
  }

  /**
   * Broadcast to specific player
   */
  broadcastToPlayer(playerId: string, eventType: string, data: any): void {
    if (!this.isReady()) return;

    try {
      this.namespace!.to(playerId).emit(eventType, data);
      this.logger.debug(`📡 Event ${eventType} sent to player ${playerId}`);
    } catch (error) {
      this.logger.error(`❌ Error broadcasting to player ${playerId}:`, error);
    }
  }

  /**
   * Broadcast to host player
   */
  private broadcastToHost(roomCode: string, event: GameEvent): void {
    if (!this.isReady()) return;

    try {
      // Broadcast to the specific room instead of entire namespace
      this.namespace!.to(roomCode).emit(event.type, event.data);
    } catch (error) {
      this.logger.error(`❌ Error broadcasting to host for room ${roomCode}:`, error);
    }
  }

  /**
   * Broadcast timer events
   */
  broadcastTimerEvents(roomCode: string, events: GameEvent[]): void {
    if (!this.isReady()) return;

    try {
      for (const event of events) {
        if (event.type === 'timer') {
          // Broadcast to specific room instead of entire namespace
          this.namespace!.to(roomCode).emit(event.type, event.data);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Error broadcasting timer events for room ${roomCode}:`, error);
    }
  }

  /**
   * Send mid-game context to a specific client
   */
  sendMidGameContext(clientId: string, roomState: ImmutableRoomState): void {
    if (!this.isReady()) return;

    try {
      if (roomState.gameState.currentRound) {
        this.namespace!.to(clientId).emit('prompt', { 
          question: roomState.gameState.currentRound.prompt 
        });
        
        if (roomState.gameState.phase === 'choose' || roomState.gameState.phase === 'scoring') {
          const choices = this.generateChoices(roomState.gameState.currentRound);
          this.namespace!.to(clientId).emit('choices', { choices });
        }
        
        if (roomState.gameState.phase === 'scoring') {
          this.namespace!.to(clientId).emit('scores', {
            totals: roomState.players.map(p => ({
              playerId: p.id,
              score: p.score,
            })),
          });
        }
      }
    } catch (error) {
      this.logger.error(`❌ Error sending mid-game context to client ${clientId}:`, error);
    }
  }

  /**
   * Serialize room state for client consumption
   */
  serializeRoom(roomState: ImmutableRoomState): any {
    // Convert current round data for frontend consumption
    let current = roomState.gameState.currentRound;
    if (current && current.votes instanceof Map) {
      // Convert Map to array for frontend
      const votesArray = Array.from(current.votes.entries()).map((entry) => ({
        voter: (entry as [string, string])[0],
        choiceId: (entry as [string, string])[1]
      }));
      current = { ...current, votes: votesArray };
    }
    
    return {
      code: roomState.code,
      phase: roomState.phase,
      round: roomState.gameState.round,
      maxRounds: roomState.gameState.maxRounds,
      timeLeft: roomState.gameState.timeLeft,
      players: roomState.players.map((p: any) => ({ ...p })),
      current,
      hostId: roomState.hostId,
    };
  }

  /**
   * Generate choices for voting
   */
  private generateChoices(round: any): Array<{ id: string; text: string }> {
    if (!round) return [];
    
    const truth = { id: `TRUE::${round.promptId}`, text: round.answer };
    const bluffChoices = round.bluffs.map((b: any) => ({ id: b.id, text: b.text }));
    
    // Simple shuffle for now
    const allChoices = [truth, ...bluffChoices];
    for (let i = allChoices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
    }
    
    return allChoices;
  }
}
