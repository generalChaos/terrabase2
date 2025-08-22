# Architecture Overview

## System Architecture

The Party Game platform is built with a modern, scalable architecture that separates concerns and provides a clean, maintainable codebase.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client   │    │  Mobile Client  │    │   API Client    │
│   (React/TS)   │    │   (Future)      │    │   (External)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (Future)      │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │  (NestJS)       │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   WebSocket     │
                    │   (Socket.io)   │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Game Services │    │  Room Services  │    │  State Services │
│  (Engines)     │    │  (Management)   │    │  (Management)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │  (PostgreSQL)   │
                    └─────────────────┘
```

## Core Components

### 1. **API Gateway (NestJS)**
- **Purpose**: Main entry point for all API requests
- **Responsibilities**: 
  - Request routing and validation
  - Authentication (future)
  - Rate limiting (future)
  - Request/response transformation

### 2. **WebSocket Layer (Socket.io)**
- **Purpose**: Real-time communication for game events
- **Namespace**: `/rooms` for all room-related events
- **Features**:
  - Automatic reconnection
  - Room-based message routing
  - Event broadcasting and targeting

### 3. **Game Services**
- **Purpose**: Game logic and mechanics
- **Architecture**: Pluggable game engine system
- **Current Games**:
  - Bluff Trivia Engine
  - Fibbing It Engine
  - Word Association Engine

### 4. **Room Services**
- **Purpose**: Room lifecycle and player management
- **Responsibilities**:
  - Room creation and cleanup
  - Player connection management
  - Host management
  - Room state coordination

### 5. **State Services**
- **Purpose**: Immutable state management
- **Features**:
  - Result pattern for error handling
  - Optimistic locking
  - State validation
  - Automatic cleanup

## Service Layer Architecture

### Service Dependencies

```
GameGatewayService
├── StateManagerService
├── ErrorHandlerService
└── TimerService

StateManagerService
├── GameRegistry
├── ErrorHandlerService
└── TimerService

RoomManager
├── StateManagerService
├── ConnectionManagerService
└── ErrorHandlerService
```

### Service Responsibilities

#### **GameGatewayService**
- Handles game-specific WebSocket events
- Validates game actions
- Coordinates with game engines
- Manages game state transitions

#### **StateManagerService**
- Manages immutable game state
- Processes game actions
- Handles state transitions
- Coordinates with game engines

#### **ErrorHandlerService**
- Provides consistent error handling
- Validates inputs
- Formats error responses
- Manages error context

#### **GameRegistry**
- Manages available game engines
- Provides game engine instances
- Handles game type registration
- Maintains game configuration

#### **TimerService**
- Manages game timers
- Handles phase transitions
- Coordinates with state management
- Provides timer events

## Data Flow

### 1. **Client Connection**
```
Client → WebSocket → RoomManager → StateManager → GameRegistry
```

### 2. **Game Action Processing**
```
Client Action → GameGatewayService → Validation → StateManager → GameEngine → State Update → Broadcast
```

### 3. **State Synchronization**
```
State Change → StateManager → Event Generation → WebSocket Broadcast → Client Update
```

## State Management

### Immutable State Pattern
- All state changes create new state objects
- No direct mutation of existing state
- State history tracking for debugging
- Automatic cleanup of old states

### Result Pattern
```typescript
type Result<T, E> = Success<T> | Failure<E>;

// Example usage
const result = await stateManager.processAction(roomCode, action);
if (result.isSuccess()) {
  // Handle success
  broadcastStateUpdate(result.value);
} else {
  // Handle error
  handleError(result.error);
}
```

### State Validation
- Input validation at service boundaries
- State consistency checks
- Business rule validation
- Automatic error recovery

## Error Handling

### Error Categories
1. **Validation Errors**: Invalid input data
2. **Business Logic Errors**: Game rule violations
3. **System Errors**: Infrastructure issues
4. **Authentication Errors**: Access control violations

### Error Response Format
```typescript
interface ErrorResponse {
  error: string;         // Human-readable message
  code: string;          // Error code for handling
  statusCode: number;    // HTTP-style status
  details?: any;         // Additional context
  context: string;       // Error location
}
```

### Error Recovery Strategies
- **Graceful degradation** when possible
- **Automatic retry** for transient errors
- **State rollback** for invalid operations
- **User feedback** for all errors

## Configuration Management

### Centralized Configuration
All configuration is centralized in the `GameConfig` object:
```typescript
const GameConfig = {
  TIMING: { /* Phase durations */ },
  RULES: { /* Game rules */ },
  VALIDATION: { /* Input limits */ },
  GAME_TYPES: { /* Available games */ }
};
```

### Environment-Specific Settings
- Development vs production configurations
- Feature flags for experimental features
- Performance tuning parameters
- Security settings

## Security Considerations

### Current Security
- Input validation and sanitization
- Rate limiting (planned)
- CORS configuration
- WebSocket connection validation

### Future Security Features
- User authentication and authorization
- API key management
- Request signing
- Audit logging

## Performance Considerations

### Optimization Strategies
- **Connection pooling** for database
- **Event batching** for WebSocket messages
- **Memory management** for game state
- **Timer optimization** for game phases

### Scalability Features
- **Stateless services** for horizontal scaling
- **Room isolation** for parallel processing
- **Efficient state updates** for large rooms
- **Resource cleanup** for memory management

## Monitoring and Observability

### Current Monitoring
- Application logging with structured data
- Error tracking and reporting
- Performance metrics collection
- Health check endpoints

### Future Monitoring
- Distributed tracing
- Metrics aggregation
- Alert systems
- Performance dashboards

## Deployment Architecture

### Current Setup
- **Development**: Local development with hot reload
- **Testing**: Jest for unit and integration tests
- **Database**: PostgreSQL with Prisma ORM

### Future Deployment
- **Containerization**: Docker containers
- **Orchestration**: Kubernetes deployment
- **CI/CD**: Automated testing and deployment
- **Monitoring**: Production monitoring and alerting

## Development Workflow

### Code Organization
- **Monorepo structure** with pnpm workspaces
- **Shared packages** for common functionality
- **Type safety** with TypeScript
- **Consistent coding standards** with ESLint

### Testing Strategy
- **Unit tests** for individual services
- **Integration tests** for service interactions
- **E2E tests** for complete workflows
- **Test coverage** requirements

### Code Quality
- **Type safety** with strict TypeScript
- **Error handling** with Result pattern
- **Immutable state** management
- **Service separation** of concerns

## Next Steps

- [Service Architecture](./services.md) - Detailed service implementation
- [State Management](./state-management.md) - State management patterns
- [Development Guide](../development/testing.md) - Testing and development practices
