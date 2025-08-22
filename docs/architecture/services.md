# Service Architecture

## Overview

The Party Game platform uses a clean service architecture with dependency injection, clear separation of concerns, and consistent error handling patterns. All services are built using NestJS decorators and follow SOLID principles.

## Service Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Gateway                       │
│                 (rooms.gateway.ts)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Game Gateway Service                     │
│              (game-gateway.service.ts)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ State Manager  │  │ Error Handler   │  │ Timer Service   │
│    Service     │  │    Service      │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Game Registry  │  │ Validation      │  │ Timer Events    │
│                 │  │ Logic           │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Core Services

### 1. **GameGatewayService**

**Purpose**: Main entry point for game-related WebSocket events

**Responsibilities**:
- Handle game start requests
- Process answer submissions
- Manage voting
- Control phase transitions
- Coordinate timer events

**Key Methods**:
```typescript
@Injectable()
export class GameGatewayService {
  async startGame(client: Socket, roomCode: string): Promise<Result<void, any>>
  async submitAnswer(client: Socket, roomCode: string, body: { answer: string }): Promise<Result<void, any>>
  async submitVote(client: Socket, roomCode: string, body: { choiceId: string }): Promise<Result<void, any>>
  async advancePhase(client: Socket, roomCode: string): Promise<Result<void, any>>
  async handleTimerTick(roomCode: string): Promise<Result<void, any>>
}
```

**Dependencies**:
- `StateManagerService` - For state operations
- `ErrorHandlerService` - For error handling and validation

### 2. **StateManagerService**

**Purpose**: Central state management for all game rooms

**Responsibilities**:
- Maintain room state
- Process game actions
- Coordinate with game engines
- Handle state transitions
- Manage room lifecycle

**Key Methods**:
```typescript
@Injectable()
export class StateManagerService {
  getRoom(roomCode: string): RoomState | undefined
  createRoom(roomCode: string, hostId: string): RoomState
  addPlayer(roomCode: string, player: Player): Result<RoomState, any>
  removePlayer(roomCode: string, playerId: string): Result<RoomState, any>
  processGameAction(roomCode: string, playerId: string, action: GameAction): Promise<Result<void, any>>
  advanceGamePhase(roomCode: string): Promise<Result<void, any>>
  updateTimer(roomCode: string, delta: number): Promise<Result<void, any>>
}
```

**Dependencies**:
- `GameRegistry` - For game engine access
- `ErrorHandlerService` - For validation
- `TimerService` - For timing management

### 3. **ErrorHandlerService**

**Purpose**: Centralized error handling and validation

**Responsibilities**:
- Validate input data
- Format error responses
- Provide consistent error handling
- Manage error context
- Handle validation logic

**Key Methods**:
```typescript
@Injectable()
export class ErrorHandlerService {
  validateRoomCode(code: string, context: string): Result<string, ValidationError>
  validateInput(input: string, fieldName: string, context: string): Result<string, ValidationError>
  formatError(error: any, context: string): ErrorResponse
  handleError(error: any, context: string): void
}
```

**Features**:
- Input sanitization
- Type validation
- Business rule validation
- Error categorization

### 4. **GameRegistry**

**Purpose**: Manage available game engines

**Responsibilities**:
- Register game engines
- Provide game instances
- List available games
- Manage game configuration
- Handle game type selection

**Key Methods**:
```typescript
@Injectable()
export class GameRegistry {
  register(gameType: string, engine: GameEngine<any, any, any>): void
  getGame(gameType: string): GameEngine<any, any, any> | undefined
  listGames(): string[]
  hasGame(gameType: string): boolean
  getDefaultGame(): string
}
```

**Registered Games**:
- `bluff-trivia` - BluffTriviaEngine
- `fibbing-it` - FibbingItEngine
- `word-association` - WordAssociationEngine

### 5. **TimerService**

**Purpose**: Manage game timing and phase transitions

**Responsibilities**:
- Start game timers
- Handle timer ticks
- Trigger phase transitions
- Manage timer cleanup
- Coordinate with state management

**Key Methods**:
```typescript
@Injectable()
export class TimerService {
  startTimer(roomCode: string, duration: number, callback: () => void): void
  stopTimer(roomCode: string): void
  updateTimer(roomCode: string, delta: number): void
  getTimeLeft(roomCode: string): number
  cleanupTimers(): void
}
```

**Features**:
- Automatic phase progression
- Manual phase advancement
- Timer synchronization
- Resource cleanup

## Service Communication

### Dependency Injection

All services use NestJS dependency injection:

```typescript
@Injectable()
export class GameGatewayService {
  constructor(
    private readonly stateManager: StateManagerService,
    private readonly errorHandler: ErrorHandlerService
  ) {}
}
```

### Service Communication Patterns

#### 1. **Direct Method Calls**
```typescript
// Synchronous operations
const room = this.stateManager.getRoom(roomCode);
if (!room) {
  throw new RoomNotFoundError(roomCode);
}
```

#### 2. **Async Result Pattern**
```typescript
// Asynchronous operations with error handling
const result = await this.stateManager.processGameAction(roomCode, playerId, action);
if (result.isSuccess()) {
  // Handle success
} else {
  // Handle error
  throw result.error;
}
```

#### 3. **Event-Based Communication**
```typescript
// Timer events
this.timerService.startTimer(roomCode, duration, () => {
  this.handleTimerTick(roomCode);
});
```

## Error Handling Architecture

### Result Pattern

All service methods return `Result<T, E>` for consistent error handling:

```typescript
type Result<T, E> = Success<T> | Failure<E>;

// Success case
export class Success<T> {
  readonly _tag = 'Success';
  constructor(readonly value: T) {}
  
  isSuccess(): this is Success<T> { return true; }
  isFailure(): this is Failure<any> { return false; }
  
  map<U>(fn: (value: T) => U): Result<U, any> {
    return new Success(fn(this.value));
  }
}

// Failure case
export class Failure<E> {
  readonly _tag = 'Failure';
  constructor(readonly error: E) {}
  
  isSuccess(): this is Success<any> { return false; }
  isFailure(): this is Failure<E> { return true; }
}
```

### Error Categories

#### **Validation Errors**
```typescript
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any,
    public context: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### **Business Logic Errors**
```typescript
export class InsufficientPlayersError extends Error {
  constructor(required: number, actual: number) {
    super(`Need ${required} players, got ${actual}`);
    this.name = 'InsufficientPlayersError';
  }
}
```

#### **System Errors**
```typescript
export class RoomNotFoundError extends Error {
  constructor(roomCode: string) {
    super(`Room ${roomCode} not found`);
    this.name = 'RoomNotFoundError';
  }
}
```

### Error Handling Flow

```
Service Method → Validation → Business Logic → Error Handler → Client Response
     │              │            │              │              │
     ▼              ▼            ▼              ▼              ▼
Input Data → Sanitize → Process → Handle Error → Format Response
```

## State Management Architecture

### Immutable State Pattern

All state changes create new state objects:

```typescript
// Instead of mutation
room.players.push(newPlayer);

// Create new state
const newRoom = {
  ...room,
  players: [...room.players, newPlayer]
};
```

### State Validation

State changes are validated before application:

```typescript
async processGameAction(roomCode: string, playerId: string, action: GameAction): Promise<Result<void, any>> {
  // Validate current state
  const room = this.getRoom(roomCode);
  if (!room) {
    return failure(new RoomNotFoundError(roomCode));
  }
  
  // Validate action
  const validationResult = this.validateAction(room, action);
  if (validationResult.isFailure()) {
    return failure(validationResult.error);
  }
  
  // Apply action
  const newState = this.applyAction(room, action);
  
  // Update state
  this.updateRoom(roomCode, newState);
  
  return success(undefined);
}
```

## Configuration Management

### Centralized Configuration

All configuration is centralized in the `GameConfig` object:

```typescript
export const GameConfig = {
  TIMING: {
    PHASES: {
      PROMPT: 15,
      CHOOSE: 20,
      SCORING: 6,
    },
    TIMER: {
      TICK_MS: 1000,
      CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
    }
  },
  RULES: {
    ROUNDS: {
      MAX_ROUNDS: 5,
      MIN_PLAYERS_TO_START: 2,
    },
    PLAYERS: {
      MAX_PLAYERS_PER_ROOM: 8,
      MIN_NICKNAME_LENGTH: 2,
      MAX_NICKNAME_LENGTH: 20,
    }
  }
};
```

### Service Configuration

Services can access configuration through the shared types:

```typescript
// In any service
const maxPlayers = GameConfig.RULES.PLAYERS.MAX_PLAYERS_PER_ROOM;
const promptDuration = GameConfig.TIMING.PHASES.PROMPT;
```

## Testing Strategy

### Service Testing

Each service has comprehensive unit tests:

```typescript
describe('GameGatewayService', () => {
  let service: GameGatewayService;
  let stateManager: jest.Mocked<StateManagerService>;
  let errorHandler: jest.Mocked<ErrorHandlerService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GameGatewayService,
        {
          provide: StateManagerService,
          useValue: createMockStateManager(),
        },
        {
          provide: ErrorHandlerService,
          useValue: createMockErrorHandler(),
        },
      ],
    }).compile();

    service = module.get<GameGatewayService>(GameGatewayService);
    stateManager = module.get(StateManagerService);
    errorHandler = module.get(ErrorHandlerService);
  });

  describe('startGame', () => {
    it('should start game successfully', async () => {
      // Test implementation
    });
  });
});
```

### Mock Services

Mock services for testing:

```typescript
export function createMockStateManager(): jest.Mocked<StateManagerService> {
  return {
    getRoom: jest.fn(),
    createRoom: jest.fn(),
    addPlayer: jest.fn(),
    removePlayer: jest.fn(),
    processGameAction: jest.fn(),
    advanceGamePhase: jest.fn(),
    updateTimer: jest.fn(),
  };
}
```

## Performance Considerations

### Service Optimization

#### **Memory Management**
- Immutable state prevents memory leaks
- Automatic cleanup of old states
- Efficient state updates

#### **Connection Management**
- WebSocket connection pooling
- Efficient event broadcasting
- Room-based message routing

#### **Timer Optimization**
- Single timer per room
- Efficient timer tick handling
- Automatic timer cleanup

### Scalability Features

#### **Horizontal Scaling**
- Stateless service design
- Room isolation for parallel processing
- Efficient state synchronization

#### **Resource Management**
- Automatic cleanup of inactive rooms
- Memory-efficient state storage
- Connection limit enforcement

## Future Enhancements

### Planned Service Improvements

1. **Caching Layer**
   - Redis integration for state caching
   - Distributed state management
   - Performance optimization

2. **Event Sourcing**
   - Event store for state reconstruction
   - Audit trail for debugging
   - State history management

3. **Microservice Architecture**
   - Service decomposition
   - API gateway improvements
   - Service mesh integration

4. **Advanced Monitoring**
   - Distributed tracing
   - Performance metrics
   - Health checks

## Next Steps

- [State Management](./state-management.md) - Detailed state management patterns
- [Testing Guide](../development/testing.md) - Testing strategies and practices
- [API Reference](../api/README.md) - API documentation and examples
