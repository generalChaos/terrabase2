# Contributing Guide - Party Game

## 🎯 Welcome Contributors!

Thank you for your interest in contributing to the Party Game project! This guide outlines our development standards, testing requirements, and contribution process.

## 🚀 Development Standards

### **Code Quality Requirements**
- **TypeScript**: All code must be written in TypeScript with strict type checking
- **ESLint**: Code must pass ESLint rules without warnings
- **Prettier**: Code must be formatted according to Prettier configuration
- **Tests**: New features must include comprehensive tests

### **Testing Requirements**
- **Test Coverage**: New code must maintain or improve our current **91.8% test coverage**
- **Test Patterns**: Follow established testing patterns from existing test suites
- **Mock Objects**: Use proper type implementations, not simplified objects
- **Interface Alignment**: Keep tests synchronized with service interfaces

### **Architecture Principles**
- **Separation of Concerns**: Services should have clear, single responsibilities
- **Dependency Injection**: Use NestJS dependency injection for service management
- **Immutable State**: Game state should be immutable with proper update methods
- **Error Handling**: Use standardized error handling with proper error categories

## 🧪 Testing Standards

### **Required Test Coverage**
- **Unit Tests**: All service methods must have unit tests
- **Integration Tests**: Service interactions must be tested
- **Edge Cases**: Boundary conditions and error scenarios must be covered
- **Mock Validation**: Mock objects must accurately reflect real interfaces

### **Testing Best Practices**
```typescript
// ✅ Good: Use proper Result types
import { success, failure, ErrorCategory } from '@party/types';

mockService.method.mockReturnValue(success(data));
mockService.method.mockReturnValue(failure({
  code: 'ERROR_CODE',
  message: 'Error message',
  category: ErrorCategory.VALIDATION,
  statusCode: 400
}));

// ❌ Avoid: Simplified mock objects
mockService.method.mockReturnValue({ isSuccess: () => false });
```

### **Test Organization**
- **Test Files**: Place tests in `__tests__` directories alongside source code
- **Test Naming**: Use descriptive test names that explain the scenario
- **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
- **Test Isolation**: Each test should be independent and not affect others

## 🔧 Development Workflow

### **1. Setup Development Environment**
```bash
# Clone the repository
git clone <repository-url>
cd party-game

# Install dependencies
pnpm install

# Build packages
pnpm run build

# Run tests to ensure everything works
cd apps/api && pnpm test
```

### **2. Create Feature Branch**
```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Ensure branch is up to date
git pull origin main
```

### **3. Development Process**
```bash
# Make your changes
# Run tests frequently
pnpm test

# Check code quality
pnpm run lint
pnpm run build

# Commit your changes
git add .
git commit -m "feat: add your feature description"
```

### **4. Testing Your Changes**
```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test -- --testPathPatterns=your-service.spec.ts

# Run tests with coverage
pnpm test -- --coverage

# Run tests in watch mode during development
pnpm test -- --watch
```

### **5. Submit Pull Request**
- Ensure all tests pass
- Update documentation if needed
- Provide clear description of changes
- Reference any related issues

## 📚 Code Style Guide

### **TypeScript Standards**
```typescript
// ✅ Good: Clear type definitions
interface GameAction {
  type: 'start' | 'submitAnswer' | 'submitVote';
  playerId: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

// ✅ Good: Proper error handling
try {
  const result = await service.processAction(action);
  if (!result.isValid) {
    throw new Error(result.error?.message || 'Unknown error');
  }
  return result.events;
} catch (error) {
  logger.error('Failed to process action', { action, error });
  throw error;
}
```

### **Service Implementation**
```typescript
// ✅ Good: Clear service structure
@Injectable()
export class GameService {
  constructor(
    private readonly gameRegistry: GameRegistry,
    private readonly stateManager: StateManagerService,
    private readonly logger: Logger
  ) {}

  async processGameAction(action: GameAction): Promise<GameResult> {
    try {
      // Implementation logic
      return success({ events: [event] });
    } catch (error) {
      this.logger.error('Game action processing failed', { action, error });
      return failure({
        code: 'GAME_ACTION_ERROR',
        message: 'Failed to process game action',
        category: ErrorCategory.BUSINESS_LOGIC,
        statusCode: 500
      });
    }
  }
}
```

### **Error Handling**
```typescript
// ✅ Good: Standardized error structure
export interface StandardError {
  code: string;
  message: string;
  category: ErrorCategory;
  statusCode: number;
  details?: unknown;
  timestamp: string;
  requestId?: string;
  context?: string;
  retryable: boolean;
  userActionRequired: boolean;
}

// ✅ Good: Proper error creation
export function createValidationError(message: string, details?: unknown): StandardError {
  return {
    code: 'VALIDATION_ERROR',
    message,
    category: ErrorCategory.VALIDATION,
    statusCode: 400,
    details,
    timestamp: new Date().toISOString(),
    retryable: false,
    userActionRequired: true
  };
}
```

## 🎮 Game Development Standards

### **Game Engine Implementation**
```typescript
// ✅ Good: Implement required GameEngine interface
export class MyGameEngine implements GameEngine<MyGameState, MyGameEvent> {
  getGameConfig(): GameConfig {
    return MY_GAME_CONFIG;
  }

  initialize(players: Player[]): MyGameState {
    return {
      phase: 'lobby',
      players,
      round: 1,
      maxRounds: 5,
      timeLeft: 0,
      scores: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isRoundComplete: false,
      phaseStartTime: new Date()
    };
  }

  getCurrentPhase(state: MyGameState): GamePhase {
    return this.getGameConfig().phases.find(p => p.name === state.phase)!;
  }

  isGameOver(state: MyGameState): boolean {
    return state.phase === 'game-over';
  }

  getValidActions(state: MyGameState, playerId: string): GameAction[] {
    const phase = this.getCurrentPhase(state);
    return phase.allowedActions.map(type => ({
      type,
      playerId,
      timestamp: Date.now()
    }));
  }

  processAction(action: GameAction, state: MyGameState): GameResult<MyGameState, MyGameEvent> {
    // Implementation logic
    return success({ events: [event] });
  }
}
```

### **State Management**
```typescript
// ✅ Good: Immutable state updates
export class MyGameState {
  withPhaseChanged(newPhase: string): MyGameState {
    return {
      ...this,
      phase: newPhase,
      phaseStartTime: new Date(),
      updatedAt: new Date()
    };
  }

  withPlayerAdded(player: Player): MyGameState {
    return {
      ...this,
      players: [...this.players, player],
      updatedAt: new Date()
    };
  }
}
```

## 🔍 Code Review Process

### **Review Checklist**
- [ ] **Tests**: All new code has tests
- [ ] **Coverage**: Test coverage maintained or improved
- [ ] **Types**: Proper TypeScript types used
- [ ] **Errors**: Standardized error handling
- [ ] **Documentation**: Code is self-documenting
- [ ] **Performance**: No obvious performance issues
- [ ] **Security**: No security vulnerabilities

### **Review Standards**
- **Constructive Feedback**: Provide helpful, actionable feedback
- **Code Quality**: Focus on maintainability and readability
- **Testing**: Ensure adequate test coverage
- **Documentation**: Verify documentation is updated

## 🚨 Common Issues to Avoid

### **Testing Issues**
```typescript
// ❌ Don't: Mock Result objects incorrectly
mockService.method.mockReturnValue({ isSuccess: () => true });

// ❌ Don't: Test against outdated interfaces
expect(result).toBe('success'); // Old interface

// ❌ Don't: Ignore error scenarios
// Always test error cases
```

### **Code Quality Issues**
```typescript
// ❌ Don't: Use any types
function processData(data: any): any { }

// ❌ Don't: Ignore errors
try {
  await riskyOperation();
} catch (error) {
  // Silent failure
}

// ❌ Don't: Hardcode values
const TIMEOUT = 5000; // Should be configurable
```

## 📖 Additional Resources

- **[Testing Guide](./testing.md)** - Comprehensive testing documentation
- **[Architecture Overview](./../architecture/overview.md)** - System design documentation
- **[API Documentation](./../api/README.md)** - API reference and examples
- **[Development History](./../history/README.md)** - Project evolution tracking

## 🤝 Getting Help

### **Questions and Support**
- **GitHub Issues**: Create issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Ask for help during code reviews

### **Development Team**
- **Lead Developer**: [Your Name]
- **Testing Lead**: [Testing Lead Name]
- **Architecture Lead**: [Architecture Lead Name]

---

**Contributing Status**: 🟢 **Open for Contributions**  
**Testing Requirements**: **91.8% coverage minimum**  
**Code Quality**: **High standards enforced**  
**Review Process**: **All changes reviewed**
