# Party Game API Documentation

## Overview

The Party Game API is a real-time multiplayer game platform built with **NestJS** and **Socket.io**. It provides a WebSocket-based interface for creating rooms, managing players, and running multiple types of party games with a pluggable game engine architecture.

## Architecture

- **Protocol**: WebSocket (Socket.io)
- **Namespace**: `/rooms`
- **Authentication**: None (public rooms)
- **State Management**: Immutable state with Result pattern and optimistic locking
- **Game Engine**: Pluggable game system supporting multiple game types
- **Error Handling**: Comprehensive validation and standardized error responses

## Available Games

### **Bluff Trivia** 🎭

- **Description**: Classic bluff trivia where players compete to find correct answers while trying to fool others
- **Type**: `bluff-trivia`
- **Phases**: Lobby → Prompt (15s) → Choose (20s) → Scoring (6s) → Next Round

### **Fibbing It** 🤥

- **Description**: Storytelling game where players create believable lies and try to spot the truth
- **Type**: `fibbing-it`
- **Phases**: Lobby → Prompt (60s) → Voting (30s) → Scoring (15s) → Next Round

### **Word Association** 🔗

- **Description**: Creative word game where players build on each other's word associations
- **Type**: `word-association`
- **Phases**: Lobby → Prompt (45s) → Voting (25s) → Scoring (15s) → Next Round

## Connection

### Base URL

```
ws://localhost:3001/rooms
```

### Connection Parameters

```typescript
// Connect to a specific room
const socket = io('http://localhost:3001/rooms', {
  query: {
    roomCode: 'ABC123', // 4-8 character alphanumeric room code
  },
});
```

### Room Code Format

- **Pattern**: `^[a-zA-Z0-9]{4,8}$`
- **Examples**: `ABC1`, `ROOM123`, `GAME4567`
- **Validation**: Must be unique, alphanumeric only

## Message Format

All messages follow this structure:

```typescript
interface GameMessage {
  type: string; // Message type identifier
  data?: any; // Message payload
  target?: 'all' | 'player' | 'host'; // Target audience
  playerId?: string; // Specific player (if target is 'player')
}
```

## Error Handling

Errors are returned in a consistent format using the Result pattern:

```typescript
interface ErrorResponse {
  error: string; // Human-readable error message
  code: string; // Error code for programmatic handling
  statusCode: number; // HTTP-style status code
  details?: any; // Additional error context
  context: string; // Where the error occurred
}
```

### Result Pattern

The API uses a Result pattern for consistent error handling:

```typescript
type Result<T, E> = Success<T> | Failure<E>;

// Success case
const result = await gameService.startGame(client, roomCode);
if (result.isSuccess()) {
  // Handle success
} else {
  // Handle error
  console.error(result.error);
}
```

## Game Configuration

### Centralized Configuration

All game settings are centralized in the `GameConfig` object:

```typescript
const GameConfig = {
  TIMING: {
    PHASES: {
      PROMPT: 15, // Time to submit answer/bluff
      CHOOSE: 20, // Time to vote
      SCORING: 6, // Time to show results
    },
  },
  RULES: {
    ROUNDS: {
      MAX_ROUNDS: 5, // Maximum rounds per game
      MIN_PLAYERS_TO_START: 2, // Minimum players required
    },
    PLAYERS: {
      MAX_PLAYERS_PER_ROOM: 8, // Maximum players in room
      MIN_NICKNAME_LENGTH: 2, // Minimum nickname length
      MAX_NICKNAME_LENGTH: 20, // Maximum nickname length
    },
  },
};
```

## Rate Limiting

- **Connection**: No limit
- **Messages**: No artificial limits (handled by game logic)
- **Room Creation**: No limit (but rooms auto-cleanup after inactivity)

## Health Check

**Endpoint**: `GET /health`

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "resources": {
    "activeRooms": 5,
    "activePlayers": 12,
    "activeTimers": 3
  }
}
```

## Service Architecture

The API is built with a clean service architecture:

- **GameGatewayService**: Handles game-specific WebSocket events
- **StateManagerService**: Manages immutable game state
- **ErrorHandlerService**: Provides consistent error handling and validation
- **GameRegistry**: Manages available game engines
- **TimerService**: Handles game timing and phase transitions

## Next Steps

- [WebSocket Events](./websocket-events.md) - All available WebSocket messages
- [Game Logic](./game-logic.md) - How the games work
- [Error Codes](./error-codes.md) - Complete list of error codes
- [Examples](./examples.md) - Code examples for common use cases
