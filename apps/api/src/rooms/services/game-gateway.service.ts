import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { StateManagerService } from '../state/state-manager.service';
import { ErrorHandlerService } from '../error-handler.service';
import {
  InsufficientPlayersError,
  PlayerNotHostError,
  PlayerNotJoinedError,
  RoomNotFoundError,
  InvalidGamePhaseError,
} from '../errors';
import { Result, success, failure, GameEvent } from '@party/types';

@Injectable()
export class GameGatewayService {
  private readonly logger = new Logger(GameGatewayService.name);

  constructor(
    private readonly stateManager: StateManagerService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  /**
   * Start a game with proper error handling
   */
  async startGame(
    client: Socket,
    roomCode: string,
  ): Promise<Result<{ events: GameEvent[] }, any>> {
    try {
      if (!roomCode) {
        throw new Error('Room code required');
      }

      // Validate room code format
      const validationResult = this.errorHandler.validateRoomCode(
        roomCode,
        'start-game',
      );
      if (validationResult.isFailure()) {
        return failure(validationResult.error);
      }

      const code = roomCode.toUpperCase();

      // Get room and validate
      const room = this.stateManager.getRoom(code);
      if (!room) {
        throw new RoomNotFoundError(code);
      }

      // Check if player has joined
      const player = room.players.find((p) => p.id === client.id);
      if (!player) {
        throw new PlayerNotJoinedError(client.id, code);
      }

      // Check if player is host
      if (room.hostId !== client.id) {
        throw new PlayerNotHostError(client.id, code);
      }

      // Check if enough players
      if (room.players.length < 2) {
        throw new InsufficientPlayersError(2, room.players.length);
      }

      // Start the game by processing a start action
      const action = { type: 'start', playerId: client.id, data: {}, timestamp: Date.now() };
      const events = await this.stateManager.processGameAction(code, client.id, action);

      this.logger.log(`Game started in room ${code} by host ${client.id}, generated ${events.length} events`);
      
      // Return the events so the gateway can handle them
      return success({ events });
    } catch (error) {
      this.logger.error(`Error in startGame:`, error);
      throw error;
    }
  }

  /**
   * Submit an answer with proper error handling
   */
  async submitAnswer(
    client: Socket,
    roomCode: string,
    body: { answer: string },
  ): Promise<Result<void, any>> {
    try {
      if (!roomCode) {
        throw new Error('Room code required');
      }

      // Validate input
      const inputValidation = this.errorHandler.validateInput(
        body.answer,
        'answer',
        'submitAnswer',
      );
      if (inputValidation.isFailure()) {
        return failure(inputValidation.error);
      }

      const code = roomCode.toUpperCase();

      // Get room and validate
      const room = this.stateManager.getRoom(code);
      if (!room) {
        throw new RoomNotFoundError(code);
      }

      // Check game phase
      if (room.gameState.phase !== 'prompt') {
        throw new InvalidGamePhaseError(room.gameState.phase, 'prompt');
      }

      // Submit answer by processing a submitAnswer action
      const action = {
        type: 'submitAnswer',
        playerId: client.id,
        data: { answer: body.answer },
        timestamp: Date.now(),
      };
      await this.stateManager.processGameAction(code, client.id, action);

      this.logger.log(
        `Answer submitted in room ${code} by player ${client.id}`,
      );
      return success(undefined);
    } catch (error) {
      this.logger.error(`Error in submitAnswer:`, error);
      throw error;
    }
  }

  /**
   * Submit a vote with proper error handling
   */
  async submitVote(
    client: Socket,
    roomCode: string,
    body: { choiceId: string },
  ): Promise<Result<void, any>> {
    try {
      if (!roomCode) {
        throw new Error('Room code required');
      }

      // Validate input
      const inputValidation = this.errorHandler.validateInput(
        body.choiceId,
        'choiceId',
        'submitVote',
      );
      if (inputValidation.isFailure()) {
        return failure(inputValidation.error);
      }

      const code = roomCode.toUpperCase();

      // Get room and validate
      const room = this.stateManager.getRoom(code);
      if (!room) {
        throw new RoomNotFoundError(code);
      }

      // Check game phase
      if (room.gameState.phase !== 'choose') {
        throw new InvalidGamePhaseError(room.gameState.phase, 'choose');
      }

      // Submit vote by processing a submitVote action
      const action = {
        type: 'submitVote',
        playerId: client.id,
        data: { choiceId: body.choiceId },
        timestamp: Date.now(),
      };
      await this.stateManager.processGameAction(code, client.id, action);

      this.logger.log(`Vote submitted in room ${code} by player ${client.id}`);
      return success(undefined);
    } catch (error) {
      this.logger.error(`Error in submitVote:`, error);
      throw error;
    }
  }

  /**
   * Advance game phase with proper error handling
   */
  async advancePhase(
    client: Socket,
    roomCode: string,
  ): Promise<Result<void, any>> {
    try {
      if (!roomCode) {
        throw new Error('Room code required');
      }

      const code = roomCode.toUpperCase();

      // Get room and validate
      const room = this.stateManager.getRoom(code);
      if (!room) {
        throw new RoomNotFoundError(code);
      }

      // Check if player is host
      if (room.hostId !== client.id) {
        throw new PlayerNotHostError(client.id, code);
      }

      // Advance phase
      await this.stateManager.advanceGamePhase(code);

      this.logger.log(`Phase advanced in room ${code} by host ${client.id}`);
      return success(undefined);
    } catch (error) {
      this.logger.error(`Error in phase transition:`, error);
      throw error;
    }
  }

  /**
   * Handle timer tick with proper error handling
   */
  async handleTimerTick(roomCode: string): Promise<Result<void, any>> {
    try {
      const code = roomCode.toUpperCase();

      // Process timer tick by updating the timer
      await this.stateManager.updateTimer(code, 1);

      return success(undefined);
    } catch (error) {
      this.logger.error(`Error in timer tick for room ${roomCode}:`, error);
      // Stop the timer if there's an error
      return failure(error);
    }
  }
}
