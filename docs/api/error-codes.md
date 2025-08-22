# Error Codes Reference

## Overview

The Party Game API uses a consistent error handling system with standardized error codes, status codes, and detailed error messages. All errors follow the same response format for easy client-side handling.

## Error Response Format

```typescript
interface ErrorResponse {
  error: string; // Human-readable error message
  code: string; // Error code for programmatic handling
  statusCode: number; // HTTP-style status code
  details?: any; // Additional error context
  context: string; // Where the error occurred
}
```

## Error Categories

### Validation Errors (400)

Errors caused by invalid input data or client-side validation failures.

### Business Logic Errors (400-409)

Errors caused by game rule violations or invalid game state.

### Authentication Errors (401-403)

Errors related to player permissions and access control.

### Resource Errors (404)

Errors when requested resources don't exist.

### System Errors (500)

Internal server errors and unexpected failures.

## Complete Error Reference

### Connection & Room Errors

#### `ROOM_CODE_REQUIRED`

**Status Code**: 400
**Message**: "Room code is required in query parameters"
**Context**: WebSocket connection
**Cause**: Client connected without providing room code
**Solution**: Include room code in connection query parameters

```typescript
// ❌ Incorrect
const socket = io('http://localhost:3001/rooms');

// ✅ Correct
const socket = io('http://localhost:3001/rooms', {
  query: { roomCode: 'ABC123' },
});
```

#### `ROOM_NOT_FOUND`

**Status Code**: 404
**Message**: "Room {roomCode} not found"
**Context**: Room operations
**Cause**: Attempted to access non-existent room
**Solution**: Check room code spelling or create new room

#### `ROOM_FULL`

**Status Code**: 400
**Message**: "Room {roomCode} is full (max {maxPlayers} players)"
**Context**: Player join
**Cause**: Room has reached maximum player capacity (8 players)
**Solution**: Wait for players to leave or join different room

### Player Management Errors

#### `PLAYER_NAME_TAKEN`

**Status Code**: 409
**Message**: 'Nickname "{nickname}" is already taken in room {roomCode}'
**Context**: Player join
**Cause**: Another player already has the same nickname
**Solution**: Choose a different nickname

#### `PLAYER_NOT_FOUND`

**Status Code**: 404
**Message**: "Player {playerId} not found in room {roomCode}"
**Context**: Player operations
**Cause**: Player ID doesn't exist in the room
**Solution**: Check player ID or reconnect to room

#### `PLAYER_NOT_HOST`

**Status Code**: 403
**Message**: "Player {playerId} is not the host of room {roomCode}"
**Context**: Game control operations
**Cause**: Non-host player attempted host-only action
**Solution**: Only the host can perform this action

#### `PLAYER_NOT_JOINED`

**Status Code**: 400
**Message**: "Player {playerId} has not joined room {roomCode}"
**Context**: Game actions
**Cause**: Player attempted action without joining room
**Solution**: Join the room before performing actions

### Game Logic Errors

#### `INSUFFICIENT_PLAYERS`

**Status Code**: 400
**Message**: "Need at least {required} players to start, got {actual}"
**Context**: Game start
**Cause**: Attempted to start game with too few players
**Solution**: Wait for more players to join (minimum 2)

#### `GAME_ALREADY_STARTED`

**Status Code**: 400
**Message**: "Game already started in room {roomCode}"
**Context**: Game start
**Cause**: Attempted to start game that's already running
**Solution**: Wait for current game to end

#### `GAME_NOT_STARTED`

**Status Code**: 400
**Message**: "Game not started in room {roomCode}"
**Context**: Game actions
**Cause**: Attempted game action before game started
**Solution**: Wait for host to start the game

#### `INVALID_ACTION`

**Status Code**: 400
**Message**: "Action {action} not allowed in phase {phase}"
**Context**: Game actions
**Cause**: Action not permitted in current game phase
**Solution**: Wait for appropriate phase or check game rules

#### `INVALID_GAME_PHASE`

**Status Code**: 400
**Message**: "Invalid game phase: {phase}, expected: {expectedPhase}"
**Context**: Phase transitions
**Cause**: Game state inconsistency
**Solution**: Refresh game state or reconnect

#### `ACTION_ALREADY_PERFORMED`

**Status Code**: 400
**Message**: "Player {playerId} already performed action: {action}"
**Context**: Game actions
**Cause**: Player attempted duplicate action
**Solution**: Each player can only perform each action once per round

### Input Validation Errors

#### `EMPTY_INPUT`

**Status Code**: 400
**Message**: "Field {field} cannot be empty"
**Context**: Input validation
**Cause**: Required field was empty or whitespace-only
**Solution**: Provide valid input for required fields

#### `VALIDATION_ERROR`

**Status Code**: 400
**Message**: "Validation error for {field}: {message}"
**Context**: Input validation
**Cause**: Input failed validation rules
**Solution**: Check validation requirements and fix input

#### `ROOM_CODE_REQUIRED`

**Status Code**: 400
**Message**: "Room code is required in query parameters"
**Context**: Connection validation
**Cause**: Missing room code in connection
**Solution**: Include room code in connection parameters

### System Errors

#### `TIMER_SERVICE_ERROR`

**Status Code**: 500
**Message**: Custom message
**Context**: Timer operations
**Cause**: Timer service internal failure
**Solution**: Retry operation or contact support

#### `CONNECTION_ERROR`

**Status Code**: 500
**Message**: Custom message
**Context**: Connection management
**Cause**: Connection service failure
**Solution**: Retry connection or check network

#### `GAME_ENGINE_ERROR`

**Status Code**: 500
**Message**: Custom message
**Context**: Game logic execution
**Cause**: Game engine internal failure
**Solution**: Retry operation or contact support

#### `DATABASE_ERROR`

**Status Code**: 500
**Message**: Custom message
**Context**: Data persistence
**Cause**: Database operation failure
**Solution**: Retry operation or contact support

## Error Handling Best Practices

### Client-Side Error Handling

```typescript
socket.on('error', errorResponse => {
  switch (errorResponse.code) {
    case 'ROOM_NOT_FOUND':
      showError('Room not found. Please check the room code.');
      break;

    case 'PLAYER_NAME_TAKEN':
      showError('That nickname is already taken. Please choose another.');
      break;

    case 'ROOM_FULL':
      showError('This room is full. Please try another room.');
      break;

    case 'INSUFFICIENT_PLAYERS':
      showError('Need at least 2 players to start the game.');
      break;

    case 'GAME_ALREADY_STARTED':
      showError('The game has already started.');
      break;

    default:
      showError(`An error occurred: ${errorResponse.error}`);
      console.error('Unexpected error:', errorResponse);
  }
});
```

### Server-Side Error Handling

```typescript
try {
  // Game operation
  const result = await gameService.performAction(action);
  return result;
} catch (error) {
  if (error instanceof GameError) {
    // Known game error - return structured response
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      context: 'game-action',
    };
  } else {
    // Unknown error - log and return generic response
    logger.error('Unexpected error in game action:', error);
    return {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      details: { originalError: error.message },
      context: 'game-action',
    };
  }
}
```

## Error Recovery Strategies

### Automatic Recovery

- **Network issues**: Automatic reconnection
- **State inconsistencies**: Automatic state synchronization
- **Timer failures**: Automatic timer restart

### Manual Recovery

- **Invalid input**: User must correct input
- **Game rule violations**: User must follow rules
- **Permission issues**: User must have proper role

### Fallback Behavior

- **Service failures**: Graceful degradation
- **Data corruption**: State reset to last known good state
- **Unrecoverable errors**: Game termination with error message

## Debugging Errors

### Error Logging

```typescript
// Client-side logging
socket.on('error', error => {
  console.error('Game error:', {
    code: error.code,
    message: error.error,
    context: error.context,
    details: error.details,
  });
});

// Server-side logging
logger.error(`Error in ${context}:`, {
  code: error.code,
  message: error.message,
  details: error.details,
  stack: error.stack,
});
```

### Error Context

Always include relevant context when logging errors:

- **User ID**: Who experienced the error
- **Room Code**: Which room had the error
- **Game Phase**: What was happening when error occurred
- **Action**: What action caused the error

## Next Steps

- [Examples](./examples.md) - Working code examples with error handling
- [API Reference](./websocket-events.md) - All available endpoints
- [Game Logic](./game-logic.md) - Detailed game rules and flow
