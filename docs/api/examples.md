# Code Examples

## Overview

This document provides complete, working examples of how to use the Party Game API. Each example includes error handling, proper event management, and best practices.

## Basic Connection Example

### Simple Client Implementation

```typescript
import { io, Socket } from 'socket.io-client';

class PartyGameClient {
  private socket: Socket | null = null;
  private roomCode: string;
  private playerName: string;
  private onStateUpdate?: (state: any) => void;
  private onError?: (error: any) => void;

  constructor(roomCode: string, playerName: string) {
    this.roomCode = roomCode;
    this.playerName = playerName;
  }

  connect() {
    try {
      this.socket = io('http://localhost:3001/rooms', {
        query: { roomCode: this.roomCode }
      });

      this.setupEventListeners();
      this.setupErrorHandling();
      
      console.log(`Connecting to room: ${this.roomCode}`);
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.joinRoom();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Game events
    this.socket.on('room', (roomState) => {
      console.log('Room state updated:', roomState);
      this.onStateUpdate?.(roomState);
    });

    this.socket.on('joined', (response) => {
      if (response.ok) {
        console.log('Successfully joined room!');
      }
    });

    this.socket.on('prompt', (data) => {
      console.log('New question:', data.question);
      this.showQuestion(data.question);
    });

    this.socket.on('choices', (data) => {
      console.log('Voting choices:', data.choices);
      this.showVotingChoices(data.choices);
    });

    this.socket.on('scores', (data) => {
      console.log('Scores updated:', data.scores);
      this.updateScoreboard(data.scores);
    });

    this.socket.on('timer', (data) => {
      console.log('Time remaining:', data.timeLeft);
      this.updateTimer(data.timeLeft);
    });

    this.socket.on('gameOver', (data) => {
      console.log('Game over! Winners:', data.winners);
      this.showGameOver(data.winners);
    });
  }

  private setupErrorHandling() {
    if (!this.socket) return;

    this.socket.on('error', (errorResponse) => {
      console.error('Game error:', errorResponse);
      this.handleError(errorResponse);
    });
  }

  private joinRoom() {
    if (!this.socket) return;

    this.socket.emit('join', {
      nickname: this.playerName,
      avatar: '🎮'
    });
  }

  startGame() {
    if (!this.socket) {
      throw new Error('Not connected to server');
    }

    this.socket.emit('startGame', {});
  }

  submitAnswer(answer: string) {
    if (!this.socket) {
      throw new Error('Not connected to server');
    }

    this.socket.emit('submitAnswer', { answer });
  }

  submitBluff(bluffText: string) {
    if (!this.socket) {
      throw new Error('Not connected to server');
    }

    this.socket.emit('submitBluff', { text: bluffText });
  }

  submitVote(choiceId: string) {
    if (!this.socket) {
      throw new Error('Not connected to server');
    }

    this.socket.emit('submitVote', { choiceId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private handleError(errorResponse: any) {
    switch (errorResponse.code) {
      case 'ROOM_NOT_FOUND':
        this.onError?.('Room not found. Please check the room code.');
        break;
        
      case 'PLAYER_NAME_TAKEN':
        this.onError?.('That nickname is already taken. Please choose another.');
        break;
        
      case 'ROOM_FULL':
        this.onError?.('This room is full. Please try another room.');
        break;
        
      case 'INSUFFICIENT_PLAYERS':
        this.onError?.('Need at least 2 players to start the game.');
        break;
        
      case 'GAME_ALREADY_STARTED':
        this.onError?.('The game has already started.');
        break;
        
      default:
        this.onError?.(`An error occurred: ${errorResponse.error}`);
    }
  }

  // UI update methods (implement based on your UI framework)
  private showQuestion(question: string) {
    // Update UI to show the question
    console.log('Show question:', question);
  }

  private showVotingChoices(choices: any[]) {
    // Update UI to show voting choices
    console.log('Show choices:', choices);
  }

  private updateScoreboard(scores: any[]) {
    // Update UI to show current scores
    console.log('Update scores:', scores);
  }

  private updateTimer(timeLeft: number) {
    // Update UI to show time remaining
    console.log('Update timer:', timeLeft);
  }

  private showGameOver(winners: any[]) {
    // Update UI to show game over screen
    console.log('Game over, winners:', winners);
  }

  // Event handlers
  onStateUpdate(callback: (state: any) => void) {
    this.onStateUpdate = callback;
  }

  onError(callback: (error: string) => void) {
    this.onError = callback;
  }
}

// Usage example
const client = new PartyGameClient('ABC123', 'Rico');
client.onStateUpdate((state) => {
  console.log('Room state:', state);
});
client.onError((error) => {
  alert(error);
});

client.connect();
```

## React Hook Example

### Custom Hook for Party Game

```typescript
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface RoomState {
  code: string;
  phase: string;
  round: number;
  maxRounds: number;
  timeLeft: number;
  players: Player[];
  current?: any;
  hostId: string | null;
}

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  connected: boolean;
}

export function usePartyGame(roomCode: string, playerName: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<string>('lobby');
  const [timeLeft, setTimeLeft] = useState(0);
  const [choices, setChoices] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);

  const socketRef = useRef<Socket | null>(null);

  // Connect to room
  const connect = useCallback(() => {
    try {
      const newSocket = io('http://localhost:3001/rooms', {
        query: { roomCode }
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Setup event listeners
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        setError(null);
        
        // Join room automatically
        newSocket.emit('join', {
          nickname: playerName,
          avatar: '🎮'
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('room', (state: RoomState) => {
        console.log('Room state updated:', state);
        setRoomState(state);
        setGamePhase(state.phase);
        setTimeLeft(state.timeLeft || 0);
      });

      newSocket.on('joined', (response) => {
        if (response.ok) {
          console.log('Successfully joined room!');
        }
      });

      newSocket.on('prompt', (data) => {
        console.log('New question:', data.question);
      });

      newSocket.on('choices', (data) => {
        console.log('Voting choices:', data.choices);
        setChoices(data.choices);
      });

      newSocket.on('scores', (data) => {
        console.log('Scores updated:', data.scores);
        setScores(data.scores);
      });

      newSocket.on('timer', (data) => {
        setTimeLeft(data.timeLeft);
      });

      newSocket.on('gameOver', (data) => {
        console.log('Game over! Winners:', data.winners);
      });

      newSocket.on('error', (errorResponse) => {
        console.error('Game error:', errorResponse);
        handleError(errorResponse);
      });

    } catch (error) {
      console.error('Failed to connect:', error);
      setError('Failed to connect to server');
    }
  }, [roomCode, playerName]);

  // Disconnect from room
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  // Game actions
  const startGame = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('startGame', {});
    }
  }, []);

  const submitAnswer = useCallback((answer: string) => {
    if (socketRef.current) {
      socketRef.current.emit('submitAnswer', { answer });
    }
  }, []);

  const submitBluff = useCallback((bluffText: string) => {
    if (socketRef.current) {
      socketRef.current.emit('submitBluff', { text: bluffText });
    }
  }, []);

  const submitVote = useCallback((choiceId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('submitVote', { choiceId });
    }
  }, []);

  // Error handling
  const handleError = useCallback((errorResponse: any) => {
    switch (errorResponse.code) {
      case 'ROOM_NOT_FOUND':
        setError('Room not found. Please check the room code.');
        break;
        
      case 'PLAYER_NAME_TAKEN':
        setError('That nickname is already taken. Please choose another.');
        break;
        
      case 'ROOM_FULL':
        setError('This room is full. Please try another room.');
        break;
        
      case 'INSUFFICIENT_PLAYERS':
        setError('Need at least 2 players to start the game.');
        break;
        
      case 'GAME_ALREADY_STARTED':
        setError('The game has already started.');
        break;
        
      default:
        setError(`An error occurred: ${errorResponse.error}`);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    // State
    roomState,
    isConnected,
    error,
    gamePhase,
    timeLeft,
    choices,
    scores,
    
    // Actions
    connect,
    disconnect,
    startGame,
    submitAnswer,
    submitBluff,
    submitVote,
    
    // Utilities
    clearError,
    isHost: roomState?.hostId === socket?.id
  };
}
```

## React Component Example

### Game Component Using the Hook

```typescript
import React, { useState } from 'react';
import { usePartyGame } from './usePartyGame';

interface GameProps {
  roomCode: string;
  playerName: string;
}

export function Game({ roomCode, playerName }: GameProps) {
  const [answer, setAnswer] = useState('');
  const [bluffText, setBluffText] = useState('');
  const [selectedChoice, setSelectedChoice] = useState('');

  const {
    roomState,
    isConnected,
    error,
    gamePhase,
    timeLeft,
    choices,
    scores,
    startGame,
    submitAnswer,
    submitBluff,
    submitVote,
    clearError,
    isHost
  } = usePartyGame(roomCode, playerName);

  const handleSubmitAnswer = () => {
    if (answer.trim()) {
      submitAnswer(answer.trim());
      setAnswer('');
    }
  };

  const handleSubmitBluff = () => {
    if (bluffText.trim()) {
      submitBluff(bluffText.trim());
      setBluffText('');
    }
  };

  const handleSubmitVote = () => {
    if (selectedChoice) {
      submitVote(selectedChoice);
      setSelectedChoice('');
    }
  };

  if (!isConnected) {
    return <div>Connecting to room...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={clearError}>Dismiss</button>
      </div>
    );
  }

  if (!roomState) {
    return <div>Loading room...</div>;
  }

  return (
    <div className="game">
      <div className="room-info">
        <h2>Room: {roomCode}</h2>
        <p>Phase: {gamePhase}</p>
        <p>Time: {timeLeft}s</p>
        <p>Round: {roomState.round}/{roomState.maxRounds}</p>
      </div>

      <div className="players">
        <h3>Players ({roomState.players.length})</h3>
        {roomState.players.map((player) => (
          <div key={player.id} className={`player ${player.connected ? 'connected' : 'disconnected'}`}>
            <span>{player.avatar}</span>
            <span>{player.name}</span>
            <span>{player.score} pts</span>
            {player.connected ? '🟢' : '🔴'}
          </div>
        ))}
      </div>

      {gamePhase === 'lobby' && isHost && (
        <div className="lobby">
          <button 
            onClick={startGame}
            disabled={roomState.players.length < 2}
          >
            Start Game ({roomState.players.length}/2+ players)
          </button>
        </div>
      )}

      {gamePhase === 'prompt' && (
        <div className="prompt">
          <h3>Submit your answer or bluff!</h3>
          <div>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer..."
              maxLength={1000}
            />
            <button onClick={handleSubmitAnswer}>Submit Answer</button>
          </div>
          <div>
            <input
              type="text"
              value={bluffText}
              onChange={(e) => setBluffText(e.target.value)}
              placeholder="Or submit a bluff..."
              maxLength={1000}
            />
            <button onClick={handleSubmitBluff}>Submit Bluff</button>
          </div>
        </div>
      )}

      {gamePhase === 'choose' && (
        <div className="choose">
          <h3>Vote for the correct answer!</h3>
          <div className="choices">
            {choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => setSelectedChoice(choice.id)}
                className={selectedChoice === choice.id ? 'selected' : ''}
              >
                {choice.text}
              </button>
            ))}
          </div>
          <button 
            onClick={handleSubmitVote}
            disabled={!selectedChoice}
          >
            Submit Vote
          </button>
        </div>
      )}

      {gamePhase === 'scoring' && (
        <div className="scoring">
          <h3>Round Results</h3>
          <div className="scores">
            {scores.map((score) => (
              <div key={score.id} className="score">
                <span>{score.name}</span>
                <span>{score.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {gamePhase === 'over' && (
        <div className="game-over">
          <h3>Game Over!</h3>
          <p>Final scores and winners will be displayed here.</p>
        </div>
      )}
    </div>
  );
}
```

## Error Handling Examples

### Comprehensive Error Handling

```typescript
class GameErrorHandler {
  private errorCounts: Map<string, number> = new Map();
  private readonly maxRetries = 3;

  handleError(errorResponse: any, context: string): void {
    const errorCode = errorResponse.code;
    const currentCount = this.errorCounts.get(errorCode) || 0;

    // Log error
    this.logError(errorResponse, context);

    // Handle based on error type
    switch (errorCode) {
      case 'ROOM_NOT_FOUND':
        this.handleRoomNotFound(errorResponse);
        break;
        
      case 'PLAYER_NAME_TAKEN':
        this.handlePlayerNameTaken(errorResponse);
        break;
        
      case 'ROOM_FULL':
        this.handleRoomFull(errorResponse);
        break;
        
      case 'INSUFFICIENT_PLAYERS':
        this.handleInsufficientPlayers(errorResponse);
        break;
        
      case 'GAME_ALREADY_STARTED':
        this.handleGameAlreadyStarted(errorResponse);
        break;
        
      case 'INVALID_ACTION':
        this.handleInvalidAction(errorResponse);
        break;
        
      case 'ACTION_ALREADY_PERFORMED':
        this.handleActionAlreadyPerformed(errorResponse);
        break;
        
      case 'TIMER_SERVICE_ERROR':
      case 'CONNECTION_ERROR':
      case 'GAME_ENGINE_ERROR':
        this.handleSystemError(errorResponse, currentCount);
        break;
        
      default:
        this.handleUnknownError(errorResponse);
    }

    // Update error count
    this.errorCounts.set(errorCode, currentCount + 1);
  }

  private handleRoomNotFound(errorResponse: any): void {
    // Show error and suggest creating new room
    this.showError('Room not found. Would you like to create a new room?', {
      actions: [
        { label: 'Create New Room', action: () => this.createNewRoom() },
        { label: 'Try Again', action: () => this.retryConnection() }
      ]
    });
  }

  private handlePlayerNameTaken(errorResponse: any): void {
    // Prompt for new nickname
    this.showError('That nickname is already taken. Please choose another.', {
      input: {
        type: 'text',
        placeholder: 'Enter new nickname',
        onSubmit: (nickname: string) => this.changeNickname(nickname)
      }
    });
  }

  private handleRoomFull(errorResponse: any): void {
    // Show error and suggest alternatives
    this.showError('This room is full. Please try another room or wait for a spot to open.', {
      actions: [
        { label: 'Join Different Room', action: () => this.joinDifferentRoom() },
        { label: 'Wait', action: () => this.waitForSpot() }
      ]
    });
  }

  private handleInsufficientPlayers(errorResponse: any): void {
    // Show error and wait
    this.showError('Need at least 2 players to start. Waiting for more players...', {
      autoHide: true,
      duration: 5000
    });
  }

  private handleGameAlreadyStarted(errorResponse: any): void {
    // Show error and wait
    this.showError('The game has already started. Please wait for the next round.', {
      autoHide: true,
      duration: 3000
    });
  }

  private handleInvalidAction(errorResponse: any): void {
    // Show error and disable action
    this.showError(`That action is not allowed right now: ${errorResponse.error}`, {
      autoHide: true,
      duration: 3000
    });
  }

  private handleActionAlreadyPerformed(errorResponse: any): void {
    // Show error and disable action
    this.showError('You have already performed that action.', {
      autoHide: true,
      duration: 2000
    });
  }

  private handleSystemError(errorResponse: any, retryCount: number): void {
    if (retryCount < this.maxRetries) {
      // Retry with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      this.showError('A system error occurred. Retrying...', {
        autoHide: true,
        duration: delay
      });
      
      setTimeout(() => {
        this.retryOperation();
      }, delay);
    } else {
      // Max retries reached
      this.showError('A system error occurred. Please refresh the page or try again later.', {
        actions: [
          { label: 'Refresh Page', action: () => window.location.reload() },
          { label: 'Try Again Later', action: () => this.scheduleRetry() }
        ]
      });
    }
  }

  private handleUnknownError(errorResponse: any): void {
    // Show generic error
    this.showError('An unexpected error occurred. Please try again.', {
      actions: [
        { label: 'Try Again', action: () => this.retryOperation() },
        { label: 'Report Issue', action: () => this.reportIssue(errorResponse) }
      ]
    });
  }

  private logError(errorResponse: any, context: string): void {
    console.error(`Error in ${context}:`, {
      code: errorResponse.code,
      message: errorResponse.error,
      statusCode: errorResponse.statusCode,
      details: errorResponse.details,
      context: errorResponse.context,
      timestamp: new Date().toISOString()
    });
  }

  // UI methods (implement based on your UI framework)
  private showError(message: string, options: any): void {
    console.log('Show error:', message, options);
  }

  // Action methods (implement based on your needs)
  private createNewRoom(): void {
    console.log('Create new room');
  }

  private retryConnection(): void {
    console.log('Retry connection');
  }

  private changeNickname(nickname: string): void {
    console.log('Change nickname to:', nickname);
  }

  private joinDifferentRoom(): void {
    console.log('Join different room');
  }

  private waitForSpot(): void {
    console.log('Wait for spot');
  }

  private retryOperation(): void {
    console.log('Retry operation');
  }

  private scheduleRetry(): void {
    console.log('Schedule retry');
  }

  private reportIssue(errorResponse: any): void {
    console.log('Report issue:', errorResponse);
  }
}
```

## Next Steps

- [API Reference](./websocket-events.md) - All available endpoints
- [Game Logic](./game-logic.md) - Detailed game rules and flow
- [Error Codes](./error-codes.md) - Complete error reference
