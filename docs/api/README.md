# Party Game API Documentation

## Overview

The Party Game API is a real-time multiplayer game system built with **NestJS** and **Socket.io**. It provides a WebSocket-based interface for creating rooms, managing players, and running bluff trivia games.

## Architecture

- **Protocol**: WebSocket (Socket.io)
- **Namespace**: `/rooms`
- **Authentication**: None (public rooms)
- **State Management**: Immutable state with optimistic locking
- **Game Engine**: Pluggable game system (currently Bluff Trivia)

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
    roomCode: 'ABC123'  // 4-8 character alphanumeric room code
  }
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
  type: string;           // Message type identifier
  data?: any;            // Message payload
  target?: 'all' | 'player' | 'host';  // Target audience
  playerId?: string;     // Specific player (if target is 'player')
}
```

## Error Handling

Errors are returned in a consistent format:
```typescript
interface ErrorResponse {
  error: string;         // Human-readable error message
  code: string;          // Error code for programmatic handling
  statusCode: number;    // HTTP-style status code
  details?: any;         // Additional error context
  context: string;       // Where the error occurred
}
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

## Next Steps

- [WebSocket Events](./websocket-events.md) - All available WebSocket messages
- [Game Logic](./game-logic.md) - How the bluff trivia game works
- [Error Codes](./error-codes.md) - Complete list of error codes
- [Examples](./examples.md) - Code examples for common use cases
