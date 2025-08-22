# Code Examples

## Overview

This document provides complete, working examples of how to use the Party Game API. Each example includes error handling, proper event management, and best practices for all available game types.

## Available Games

The Party Game platform supports multiple game types:

- **🎭 Bluff Trivia**: Classic bluff trivia with deception mechanics
- **🤥 Fibbing It**: Storytelling game with truth/lie detection
- **🔗 Word Association**: Creative word association game

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
        query: { roomCode: this.roomCode },
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
    this.socket.on('room', roomState => {
      console.log('Room state updated:', roomState);
      this.onStateUpdate?.(roomState);
    });

    this.socket.on('joined', response => {
      if (response.ok) {
        console.log('Successfully joined room!');
      }
    });

    // Game-specific prompt events
    this.socket.on('prompt', data => {
      if (data.question) {
        console.log('New trivia question:', data.question);
        this.showTriviaQuestion(data.question);
      } else if (data.prompt) {
        console.log('New story prompt:', data.prompt);
        this.showStoryPrompt(data.prompt);
      } else if (data.word) {
        console.log('New word:', data.word);
        this.showWord(data.word);
      }
    });

    this.socket.on('choices', data => {
      console.log('Voting choices:', data.choices);
      this.showVotingChoices(data.choices);
    });

    this.socket.on('scores', data => {
      console.log('Scores updated:', data.scores);
      this.updateScoreboard(data.scores);
    });

    this.socket.on('timer', data => {
      console.log('Time remaining:', data.timeLeft);
      this.updateTimer(data.timeLeft);
    });

    this.socket.on('gameOver', data => {
      console.log('Game over! Winners:', data.winners);
      this.showGameOver(data.winners);
    });
  }

  private setupErrorHandling() {
    if (!this.socket) return;

    this.socket.on('error', errorResponse => {
      console.error('Game error:', errorResponse);
      this.handleError(errorResponse);
    });
  }

  private handleError(error: any) {
    // Handle different error types
    switch (error.code) {
      case 'INSUFFICIENT_PLAYERS':
        this.showMessage('Need at least 2 players to start the game');
        break;
      case 'INVALID_PHASE':
        this.showMessage('This action is not allowed in the current phase');
        break;
      case 'PLAYER_NOT_HOST':
        this.showMessage('Only the host can perform this action');
        break;
      case 'ROOM_NOT_FOUND':
        this.showMessage('Room not found. Please check the room code.');
        break;
      default:
        this.showMessage(error.error || 'An unexpected error occurred');
    }
  }

  private joinRoom() {
    if (!this.socket) return;

    this.socket.emit('join', {
      nickname: this.playerName,
      avatar: '🎮',
    });
  }

  // Game action methods
  startGame() {
    if (!this.socket) return;
    this.socket.emit('startGame', {});
  }

  submitAnswer(answer: string) {
    if (!this.socket) return;
    this.socket.emit('submitAnswer', { answer });
  }

  submitVote(choiceId: string) {
    if (!this.socket) return;
    this.socket.emit('submitVote', { choiceId });
  }

  advancePhase() {
    if (!this.socket) return;
    this.socket.emit('advancePhase', {});
  }

  // UI update methods (implement based on your UI framework)
  private showTriviaQuestion(question: string) {
    // Update UI to show trivia question
  }

  private showStoryPrompt(prompt: string) {
    // Update UI to show story prompt
  }

  private showWord(word: string) {
    // Update UI to show starting word
  }

  private showVotingChoices(choices: any[]) {
    // Update UI to show voting choices
  }

  private updateScoreboard(scores: any[]) {
    // Update UI to show scores
  }

  private updateTimer(timeLeft: number) {
    // Update UI to show timer
  }

  private showGameOver(winners: any[]) {
    // Update UI to show game over
  }

  private showMessage(message: string) {
    // Show error or info message to user
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
```

## Game-Specific Examples

### 🎭 Bluff Trivia Game

```typescript
class BluffTriviaClient extends PartyGameClient {
  private currentQuestion: string = '';
  private hasSubmitted: boolean = false;

  constructor(roomCode: string, playerName: string) {
    super(roomCode, playerName);
  }

  protected override setupEventListeners() {
    super.setupEventListeners();

    if (!this.socket) return;

    // Bluff Trivia specific events
    this.socket.on('submitted', data => {
      if (data.playerId === this.socket?.id) {
        this.hasSubmitted = true;
        this.showSubmissionConfirmation();
      }
      this.updatePlayerSubmissionStatus(data.playerId, data.hasSubmitted);
    });
  }

  // Bluff Trivia specific methods
  submitTriviaAnswer(answer: string) {
    this.submitAnswer(answer);
  }

  submitBluff(bluffText: string) {
    this.submitAnswer(bluffText); // Same endpoint, different content
  }

  private showSubmissionConfirmation() {
    console.log('Your answer has been submitted!');
    // Update UI to show submission confirmation
  }

  private updatePlayerSubmissionStatus(
    playerId: string,
    hasSubmitted: boolean
  ) {
    // Update UI to show which players have submitted
  }
}
```

### 🤥 Fibbing It Game

```typescript
class FibbingItClient extends PartyGameClient {
  private currentPrompt: string = '';
  private storySubmitted: boolean = false;

  constructor(roomCode: string, playerName: string) {
    super(roomCode, playerName);
  }

  protected override setupEventListeners() {
    super.setupEventListeners();

    if (!this.socket) return;

    // Fibbing It specific events
    this.socket.on('storySubmitted', data => {
      if (data.playerId === this.socket?.id) {
        this.storySubmitted = true;
        this.showStorySubmissionConfirmation();
      }
      this.updatePlayerStoryStatus(data.playerId, data.hasSubmitted);
    });
  }

  // Fibbing It specific methods
  submitTrueStory(story: string) {
    this.submitAnswer(story);
  }

  submitFakeStory(story: string) {
    this.submitAnswer(story); // Same endpoint, different content
  }

  private showStorySubmissionConfirmation() {
    console.log('Your story has been submitted!');
    // Update UI to show story submission confirmation
  }

  private updatePlayerStoryStatus(playerId: string, hasSubmitted: boolean) {
    // Update UI to show which players have submitted stories
  }
}
```

### 🔗 Word Association Game

```typescript
class WordAssociationClient extends PartyGameClient {
  private currentWord: string = '';
  private associationSubmitted: boolean = false;

  constructor(roomCode: string, playerName: string) {
    super(roomCode, playerName);
  }

  protected override setupEventListeners() {
    super.setupEventListeners();

    if (!this.socket) return;

    // Word Association specific events
    this.socket.on('associationSubmitted', data => {
      if (data.playerId === this.socket?.id) {
        this.associationSubmitted = true;
        this.showAssociationSubmissionConfirmation();
      }
      this.updatePlayerAssociationStatus(data.playerId, data.hasSubmitted);
    });
  }

  // Word Association specific methods
  submitAssociation(association: string) {
    this.submitAnswer(association);
  }

  private showAssociationSubmissionConfirmation() {
    console.log('Your word association has been submitted!');
    // Update UI to show association submission confirmation
  }

  private updatePlayerAssociationStatus(
    playerId: string,
    hasSubmitted: boolean
  ) {
    // Update UI to show which players have submitted associations
  }
}
```

## React Component Example

### Game Component with Hooks

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  connected: boolean;
}

interface RoomState {
  code: string;
  gameType: string;
  phase: string;
  round: number;
  maxRounds: number;
  timeLeft: number;
  players: Player[];
  hostId?: string;
}

interface GameProps {
  roomCode: string;
  playerName: string;
}

export const GameComponent: React.FC<GameProps> = ({ roomCode, playerName }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');

  useEffect(() => {
    const newSocket = io('http://localhost:3001/rooms', {
      query: { roomCode }
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);

      // Join the room
      newSocket.emit('join', {
        nickname: playerName,
        avatar: '🎮'
      });
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('room', (state: RoomState) => {
      setRoomState(state);
    });

    newSocket.on('error', (errorResponse: any) => {
      setError(errorResponse.error);
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [roomCode, playerName]);

  const startGame = useCallback(() => {
    if (socket && roomState?.hostId === socket.id) {
      socket.emit('startGame', {});
    }
  }, [socket, roomState?.hostId]);

  const submitAnswer = useCallback(() => {
    if (socket && currentAnswer.trim()) {
      socket.emit('submitAnswer', { answer: currentAnswer.trim() });
      setCurrentAnswer('');
    }
  }, [socket, currentAnswer]);

  const submitVote = useCallback((choiceId: string) => {
    if (socket) {
      socket.emit('submitVote', { choiceId });
    }
  }, [socket]);

  const advancePhase = useCallback(() => {
    if (socket && roomState?.hostId === socket.id) {
      socket.emit('advancePhase', {});
    }
  }, [socket, roomState?.hostId]);

  if (!connected) {
    return <div>Connecting to game...</div>;
  }

  if (!roomState) {
    return <div>Loading room...</div>;
  }

  const isHost = roomState.hostId === socket?.id;
  const currentPlayer = roomState.players.find(p => p.id === socket?.id);

  return (
    <div className="game-container">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="game-header">
        <h1>Room: {roomState.code}</h1>
        <div className="game-info">
          <span>Phase: {roomState.phase}</span>
          <span>Round: {roomState.round}/{roomState.maxRounds}</span>
          <span>Time: {roomState.timeLeft}s</span>
        </div>
      </div>

      <div className="players-section">
        <h2>Players ({roomState.players.length})</h2>
        <div className="players-list">
          {roomState.players.map(player => (
            <div key={player.id} className={`player ${player.connected ? 'connected' : 'disconnected'}`}>
              <span className="avatar">{player.avatar}</span>
              <span className="name">{player.name}</span>
              <span className="score">{player.score}</span>
              {player.id === roomState.hostId && <span className="host-badge">👑</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="game-phase">
        {roomState.phase === 'lobby' && (
          <div className="lobby-phase">
            <h2>Waiting for players...</h2>
            {isHost && roomState.players.length >= 2 && (
              <button onClick={startGame} className="start-button">
                Start Game
              </button>
            )}
            {!isHost && (
              <p>Waiting for host to start the game...</p>
            )}
          </div>
        )}

        {roomState.phase === 'prompt' && (
          <div className="prompt-phase">
            <h2>Submit your answer</h2>
            <div className="prompt-content">
              {/* Show different content based on game type */}
              {roomState.gameType === 'bluff-trivia' && (
                <p>Trivia Question: [Question would appear here]</p>
              )}
              {roomState.gameType === 'fibbing-it' && (
                <p>Story Prompt: [Prompt would appear here]</p>
              )}
              {roomState.gameType === 'word-association' && (
                <p>Starting Word: [Word would appear here]</p>
              )}
            </div>
            <div className="answer-input">
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Enter your answer..."
                maxLength={1000}
              />
              <button onClick={submitAnswer} disabled={!currentAnswer.trim()}>
                Submit
              </button>
            </div>
          </div>
        )}

        {roomState.phase === 'choose' && (
          <div className="choose-phase">
            <h2>Vote on the answers</h2>
            <div className="choices-list">
              {/* Choices would appear here */}
              <p>Voting choices would appear here...</p>
            </div>
          </div>
        )}

        {roomState.phase === 'scoring' && (
          <div className="scoring-phase">
            <h2>Round Results</h2>
            <div className="scores-display">
              {/* Scores would appear here */}
              <p>Round scores would appear here...</p>
            </div>
          </div>
        )}

        {roomState.phase === 'over' && (
          <div className="game-over">
            <h2>Game Over!</h2>
            <div className="final-scores">
              {/* Final scores would appear here */}
              <p>Final results would appear here...</p>
            </div>
            {isHost && (
              <button onClick={startGame} className="new-game-button">
                Start New Game
              </button>
            )}
          </div>
        )}
      </div>

      {/* Host controls */}
      {isHost && roomState.phase !== 'lobby' && roomState.phase !== 'over' && (
        <div className="host-controls">
          <button onClick={advancePhase} className="advance-button">
            Advance Phase
          </button>
        </div>
      )}
    </div>
  );
};
```

## Error Handling Examples

### Comprehensive Error Handling

```typescript
class RobustGameClient extends PartyGameClient {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  protected override setupErrorHandling() {
    super.setupErrorHandling();

    if (!this.socket) return;

    // Connection error handling
    this.socket.on('connect_error', error => {
      console.error('Connection error:', error);
      this.handleConnectionError();
    });

    // Reconnection handling
    this.socket.on('disconnect', reason => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.attemptReconnection();
      }
    });
  }

  private handleConnectionError() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(
        `Reconnection attempt ${this.reconnectAttempts} in ${delay}ms`
      );

      setTimeout(() => {
        this.attemptReconnection();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.onError?.({
        error: 'Unable to connect to server after multiple attempts',
        code: 'MAX_RECONNECT_ATTEMPTS',
        statusCode: 500,
      });
    }
  }

  private attemptReconnection() {
    if (this.socket) {
      this.socket.connect();
    }
  }

  protected override handleError(error: any) {
    // Log error for debugging
    console.error('Game error:', {
      code: error.code,
      message: error.error,
      context: error.context,
      details: error.details,
      timestamp: new Date().toISOString(),
    });

    // Handle specific error types
    switch (error.code) {
      case 'INSUFFICIENT_PLAYERS':
        this.showMessage('Need at least 2 players to start the game');
        break;
      case 'INVALID_PHASE':
        this.showMessage('This action is not allowed in the current phase');
        break;
      case 'PLAYER_NOT_HOST':
        this.showMessage('Only the host can perform this action');
        break;
      case 'ROOM_NOT_FOUND':
        this.showMessage('Room not found. Please check the room code.');
        break;
      case 'VALIDATION_ERROR':
        this.showMessage(
          `Invalid input: ${error.details?.field || 'unknown field'}`
        );
        break;
      case 'BUSINESS_LOGIC_ERROR':
        this.showMessage(error.error || 'Game rule violation');
        break;
      case 'SYSTEM_ERROR':
        this.showMessage('System error occurred. Please try again.');
        break;
      default:
        this.showMessage(error.error || 'An unexpected error occurred');
    }

    // Call parent error handler
    super.handleError(error);
  }
}
```

## Testing Examples

### Unit Test Example

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameComponent } from './GameComponent';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
    connect: jest.fn(),
    id: 'test-socket-id'
  }))
}));

describe('GameComponent', () => {
  const mockProps = {
    roomCode: 'TEST123',
    playerName: 'TestPlayer'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to room on mount', () => {
    render(<GameComponent {...mockProps} />);

    expect(screen.getByText('Connecting to game...')).toBeInTheDocument();
  });

  it('should show start game button for host', async () => {
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      close: jest.fn(),
      connect: jest.fn(),
      id: 'test-socket-id'
    };

    // Mock socket connection
    (require('socket.io-client').io as jest.Mock).mockReturnValue(mockSocket);

    render(<GameComponent {...mockProps} />);

    // Simulate room state update
    const roomState = {
      code: 'TEST123',
      gameType: 'bluff-trivia',
      phase: 'lobby',
      round: 1,
      maxRounds: 5,
      timeLeft: 0,
      players: [
        { id: 'test-socket-id', name: 'TestPlayer', avatar: '🎮', score: 0, connected: true }
      ],
      hostId: 'test-socket-id'
    };

    // Trigger room state update
    const roomCallback = mockSocket.on.mock.calls.find(call => call[0] === 'room')?.[1];
    if (roomCallback) {
      roomCallback(roomState);
    }

    await waitFor(() => {
      expect(screen.getByText('Start Game')).toBeInTheDocument();
    });
  });
});
```

## Best Practices

### 1. **Error Handling**

- Always implement comprehensive error handling
- Use the Result pattern for consistent error responses
- Provide user-friendly error messages
- Log errors for debugging

### 2. **State Management**

- Keep client state synchronized with server state
- Use immutable state updates
- Handle loading and error states gracefully
- Implement proper cleanup on unmount

### 3. **Performance**

- Debounce user inputs when appropriate
- Implement efficient re-rendering
- Use WebSocket connection pooling
- Clean up event listeners

### 4. **User Experience**

- Show loading states during operations
- Provide immediate feedback for user actions
- Handle edge cases gracefully
- Implement proper accessibility features

### 5. **Testing**

- Test all game phases and transitions
- Mock external dependencies
- Test error scenarios
- Ensure proper cleanup

## Next Steps

- [WebSocket Events](./websocket-events.md) - Complete event reference
- [Game Logic](./game-logic.md) - Game rules and mechanics
- [Error Codes](./error-codes.md) - Error handling reference
