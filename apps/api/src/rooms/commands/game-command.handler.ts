import { Injectable } from '@nestjs/common';
import { RoomManager } from '../room-manager';
import { TimerService } from '../timer.service';
import { GameAction, GameEvent, Player } from '@party/types';
import { GAME_PHASE_DURATIONS } from '../constants';
import {
  InsufficientPlayersError,
  PlayerNotHostError,
  PlayerNotJoinedError,
  RoomNotFoundError,
  InvalidGamePhaseError,
} from '../errors';

export interface GameCommand {
  type: string;
  roomCode: string;
  playerId: string;
  data?: any;
}

export interface GameCommandResult {
  success: boolean;
  events: GameEvent[];
  error?: string;
}

@Injectable()
export class GameCommandHandler {
  constructor(
    private readonly roomManager: RoomManager,
    private readonly timerService: TimerService,
  ) {}

  /**
   * Handle start game command
   */
  async handleStartGame(
    roomCode: string,
    playerId: string,
  ): Promise<GameCommandResult> {
    try {
      // Validate room exists
      const room = this.roomManager.getRoom(roomCode);
      if (!room) {
        return {
          success: false,
          events: [],
          error: 'Room not found',
        };
      }

      // Validate player has joined
      const currentPlayer = room.players.find((p) => p.id === playerId);
      if (!currentPlayer) {
        return {
          success: false,
          events: [],
          error: 'Player not joined',
        };
      }

      // Validate player is host
      if (room.hostId !== playerId) {
        return {
          success: false,
          events: [],
          error: 'Player not host',
        };
      }

      // Validate enough players
      if (room.players.length < 2) {
        return {
          success: false,
          events: [],
          error: 'Insufficient players',
        };
      }

      // Process game action
      const action: GameAction = {
        type: 'start',
        playerId,
        data: {},
        timestamp: Date.now(),
      };

      const events = await this.roomManager.processGameAction(
        roomCode,
        playerId,
        action,
      );

      return {
        success: true,
        events,
      };
    } catch (error) {
      return {
        success: false,
        events: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle submit answer command
   */
  async handleSubmitAnswer(
    roomCode: string,
    playerId: string,
    answer: string,
  ): Promise<GameCommandResult> {
    try {
      // Validate room exists
      const room = this.roomManager.getRoomSafe(roomCode);
      if (!room) {
        return {
          success: false,
          events: [],
          error: 'Room not found',
        };
      }

      // Validate game phase
      if (room.gameState.phase !== 'prompt') {
        return {
          success: false,
          events: [],
          error: 'Invalid game phase',
        };
      }

      // Process game action
      const action: GameAction = {
        type: 'submitAnswer',
        playerId,
        data: { answer },
        timestamp: Date.now(),
      };

      const events = await this.roomManager.processGameAction(
        roomCode,
        playerId,
        action,
      );

      return {
        success: true,
        events,
      };
    } catch (error) {
      return {
        success: false,
        events: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle submit bluff command
   */
  async handleSubmitBluff(
    roomCode: string,
    playerId: string,
    text: string,
  ): Promise<GameCommandResult> {
    try {
      // Validate room exists
      const room = this.roomManager.getRoomSafe(roomCode);
      if (!room) {
        return {
          success: false,
          events: [],
          error: 'Room not found',
        };
      }

      // Validate game phase
      if (room.gameState.phase !== 'prompt') {
        return {
          success: false,
          events: [],
          error: 'Invalid game phase',
        };
      }

      // Process game action
      const action: GameAction = {
        type: 'submitBluff',
        playerId,
        data: { text },
        timestamp: Date.now(),
      };

      const events = await this.roomManager.processGameAction(
        roomCode,
        playerId,
        action,
      );

      return {
        success: true,
        events,
      };
    } catch (error) {
      return {
        success: false,
        events: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle submit vote command
   */
  async handleSubmitVote(
    roomCode: string,
    playerId: string,
    vote: string,
  ): Promise<GameCommandResult> {
    try {
      // Validate room exists
      const room = this.roomManager.getRoomSafe(roomCode);
      if (!room) {
        return {
          success: false,
          events: [],
          error: 'Room not found',
        };
      }

      // Validate game phase
      if (room.gameState.phase !== 'choose') {
        return {
          success: false,
          events: [],
          error: 'Invalid game phase',
        };
      }

      // Process game action
      const action: GameAction = {
        type: 'submitVote',
        playerId,
        data: { vote },
        timestamp: Date.now(),
      };

      const events = await this.roomManager.processGameAction(
        roomCode,
        playerId,
        action,
      );

      return {
        success: true,
        events,
      };
    } catch (error) {
      return {
        success: false,
        events: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
