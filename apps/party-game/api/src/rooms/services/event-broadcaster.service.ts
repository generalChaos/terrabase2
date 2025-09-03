import { Injectable, Logger } from '@nestjs/common';
import { Namespace } from 'socket.io';
import { GameEvent } from '../../shared/types';
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
      this.logger.error(
        `❌ Error broadcasting events for room ${roomCode}:`,
        error,
      );
    }
  }

  /**
   * Broadcast a single game event
   */
  private broadcastEvent(roomCode: string, event: GameEvent): void {
    if (!this.isReady()) return;

    try {
      // Special handling for roomUpdate events - trigger a full room state broadcast
      if (event.type === 'roomUpdate') {
        // For roomUpdate events, we need to broadcast the full room state
        // This ensures the frontend receives the updated state including phase changes
        console.log(`🔄 Room update event detected, triggering full room state broadcast`);
        // The roomState will be broadcast separately by the calling code
        return;
      }

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
      console.log(
        `📡 Broadcasting room update for room ${roomCode}:`,
        serializedRoom,
      );
      this.namespace!.to(roomCode).emit('room', serializedRoom);
    } catch (error) {
      this.logger.error(
        `❌ Error broadcasting room update for room ${roomCode}:`,
        error,
      );
    }
  }

  /**
   * Send timer update without broadcasting full room state
   * This is optimized for frequent timer ticks to reduce data transmission
   */
  sendTimerUpdate(roomCode: string, timeLeft: number): void {
    if (!this.isReady()) return;

    try {
      // Send only the timer data, not the entire room state
      this.namespace!.to(roomCode).emit('timer', { timeLeft });
    } catch (error) {
      this.logger.error(
        `❌ Error sending timer update for room ${roomCode}:`,
        error,
      );
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
      this.logger.error(
        `❌ Error broadcasting to host for room ${roomCode}:`,
        error,
      );
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
      this.logger.error(
        `❌ Error broadcasting timer events for room ${roomCode}:`,
        error,
      );
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
          question: roomState.gameState.currentRound.prompt,
        });

        if (
          roomState.gameState.phase === 'choose' ||
          roomState.gameState.phase === 'scoring'
        ) {
          const choices = this.generateChoices(
            roomState.gameState.currentRound,
          );
          this.namespace!.to(clientId).emit('choices', { choices });
        }

        if (roomState.gameState.phase === 'scoring') {
          this.namespace!.to(clientId).emit('scores', {
            totals: roomState.players.map((p) => ({
              playerId: p.id,
              score: p.score,
            })),
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `❌ Error sending mid-game context to client ${clientId}:`,
        error,
      );
    }
  }

  /**
   * Serialize room state for client consumption
   */
  serializeRoom(roomState: ImmutableRoomState): any {
    // Convert current round data for frontend consumption
    let current = roomState.gameState.currentRound;
    
    if (current) {
      // Convert new structure to old structure for frontend compatibility
      
      // Convert answers Map to bluffs array (old structure)
      if (current.answers instanceof Map) {
        const bluffs = Array.from(current.answers.entries()).map((entry: any) => ({
          id: entry[0],
          by: entry[1].playerId,
          text: entry[1].text,
          isCorrect: false, // Will be determined later
        }));
        current = { ...current, bluffs };
      }
      
      // Convert votes Map to votes array (old structure)
      if (current.votes instanceof Map) {
        const votesArray = Array.from(current.votes.entries()).map((entry) => ({
          voter: (entry as [string, string])[0],
          vote: (entry as [string, string])[1],
        }));
        current = { ...current, votes: votesArray };
      }

      // Convert correctAnswerPlayers Set to array for frontend
      if (current.correctAnswerPlayers instanceof Set) {
        current = {
          ...current,
          correctAnswerPlayers: Array.from(current.correctAnswerPlayers),
        };
      }
      
      // Ensure we have the old structure properties
      if (!current.bluffs) {
        current.bluffs = [];
      }
      if (!current.votes) {
        current.votes = [];
      }
      if (!current.correctAnswerPlayers) {
        // For Fibbing It, we don't have correct answers yet - all answers are treated as bluffs initially
        current.correctAnswerPlayers = [];
      }
      
      // For Fibbing It game type, we need to add the missing fields that the frontend expects
      if (roomState.gameType === 'fibbing-it') {
        // Add answer field if it doesn't exist (frontend expects this)
        if (!current.answer) {
          current.answer = current.prompt || 'No answer available';
        }
        
        // Ensure we have all required fields for the old structure
        if (!current.roundNumber) {
          current.roundNumber = roomState.gameState.round || 1;
        }
        if (!current.phase) {
          current.phase = roomState.gameState.phase || 'prompt';
        }
      }
    }

    return {
      code: roomState.code,
      gameType: roomState.gameType,
      phase: roomState.phase, // No mapping needed - both use 'choose'
      round: roomState.gameState.round,
      maxRounds: roomState.gameState.maxRounds,
      timeLeft: roomState.gameState.timeLeft,
      players: roomState.players.map((p: any) => ({ ...p })),
      current,
      hostId: roomState.hostId,
      // Generate choices for voting phases
      choices: this.generateChoices(current),
    };
  }

  /**
   * Generate choices for voting
   */
  private generateChoices(
    round: any,
  ): Array<{ id: string; text: string; by: string }> {
    if (!round) return [];

    // Find players who got the correct answer
    let correctAnswerPlayers: string[] = [];
    if (round.correctAnswerPlayers instanceof Set) {
      correctAnswerPlayers = Array.from(correctAnswerPlayers);
    } else if (Array.isArray(round.correctAnswerPlayers)) {
      correctAnswerPlayers = round.correctAnswerPlayers;
    }

    // For Fibbing It, we need to get the correct answer from the prompt data
    // The correct answer should come from the prompts.seed.ts file, not from round.answer
    let correctAnswerText = '';
    if (round.promptId) {
      // Import prompts to get the correct answer
      try {
        // Dynamic import to avoid circular dependencies
        const prompts = require('../prompts.seed').prompts;
        const promptData = prompts.find((p: any) => p.id === round.promptId);
        if (promptData) {
          correctAnswerText = promptData.answer;
        }
      } catch (error) {
        console.warn('Could not load prompt data for correct answer:', error);
        correctAnswerText = 'Correct Answer'; // Fallback
      }
    }

    // Create truth choice - show the actual correct answer
    const truth = {
      id: `TRUE::${round.promptId}`,
      text: (correctAnswerText || 'Correct Answer').toLowerCase(), // Use lowercase for consistency with player answers
      by: correctAnswerPlayers.length > 0 ? correctAnswerPlayers[0] : 'system',
    };

    // Handle both new structure (answers Map) and old structure (bluffs array)
    let bluffChoices: Array<{ id: string; text: string; by: string }> = [];
    
    if (round.answers instanceof Map) {
      // New structure: convert answers Map to choices
      bluffChoices = Array.from(round.answers.entries()).map((entry: any) => ({
        id: entry[0],
        text: entry[1].text,
        by: entry[1].playerId,
      }));
    } else if (round.bluffs && Array.isArray(round.bluffs)) {
      // Old structure: use bluffs array
      bluffChoices = round.bluffs.map((b: any) => ({
        id: b.id,
        text: b.text,
        by: b.by,
      }));
    }

    // Deterministic sorting: sort by player ID to ensure consistent order
    // This prevents choices from jumping around on every timer tick
    const allChoices = [truth, ...bluffChoices];
    
    // Sort by ID to ensure consistent order across all clients
    allChoices.sort((a, b) => {
      // Truth choice always comes first
      if (a.id.startsWith('TRUE::')) return -1;
      if (b.id.startsWith('TRUE::')) return 1;
      
      // Then sort by player ID for consistent ordering
      return a.by.localeCompare(b.by);
    });

    return allChoices;
  }
}
