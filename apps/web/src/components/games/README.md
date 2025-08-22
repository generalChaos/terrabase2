# Adding New Games

This directory contains game-specific phase managers that handle the UI logic for different game types. The system is designed to make adding new games as easy as possible.

## New Directory Structure

The games are now organized in a more scalable structure:

```
games/
├── shared/                           # Common game components
│   ├── base-game-phase-manager.tsx
│   ├── common-phases/
│   │   ├── lobby-view.tsx
│   │   ├── results-view.tsx
│   │   └── index.ts
│   ├── ui/
│   │   ├── timer-ring.tsx
│   │   ├── player-avatar.tsx
│   │   ├── room-code-chip.tsx
│   │   └── index.ts
│   └── index.ts
├── bluff-trivia/
│   ├── index.ts
│   └── bluff-trivia-phase-manager.tsx
├── fibbing-it/
│   ├── index.ts
│   ├── fibbing-it-phase-manager.tsx
│   └── phases/
│       ├── fibbing-it-prompt-view.tsx
│       ├── fibbing-it-voting-view.tsx
│       └── fibbing-it-scoring-view.tsx
├── word-association/
│   ├── index.ts
│   └── word-association-phase-manager.tsx
└── index.ts                          # Main games index
```

## Architecture Overview

The system uses a **router pattern** where:
- `GamePhaseManager` (main component) routes to game-specific managers
- Each game has its own phase manager that implements `GamePhaseManagerInterface`
- Common functionality is shared through `BaseGamePhaseManager` and shared components
- Each game can have its own phases and components organized in subdirectories

## How to Add a New Game

### 1. Create the Game Directory Structure

Create a new directory: `apps/web/src/components/games/your-game/`

```
your-game/
├── index.ts                          # Export your phase manager
├── your-game-phase-manager.tsx       # Main phase manager
├── phases/                           # Game-specific phases (optional)
│   ├── your-game-prompt-view.tsx
│   └── your-game-voting-view.tsx
└── components/                       # Game-specific components (optional)
    └── your-game-widget.tsx
```

### 2. Create the Game Phase Manager

Create `apps/web/src/components/games/your-game/your-game-phase-manager.tsx`:

```typescript
"use client";
import { BaseGamePhaseManager, BaseGamePhaseManagerProps } from "../shared";
import type { Phase } from "@party/types";

type YourGamePhaseManagerProps = BaseGamePhaseManagerProps & {
  // Add game-specific props here
  gameSpecificData?: string;
};

export class YourGamePhaseManager extends BaseGamePhaseManager {
  readonly gameType = 'your-game';

  renderPhase(props: YourGamePhaseManagerProps): React.ReactNode {
    const { phase, isHost, ...gameProps } = props;

    if (!this.isValidPhase(phase)) {
      console.warn(`Invalid phase for ${this.gameType}: ${phase}`);
      return null;
    }

    switch (phase) {
      case 'prompt':
        return this.renderPromptPhase(gameProps);
      case 'choose':
        return this.renderChoosePhase(gameProps);
      case 'scoring':
        return this.renderScoringPhase(gameProps);
      case 'over':
        return this.renderGameOverPhase(gameProps);
      default:
        return null;
    }
  }

  private renderPromptPhase(props: any) {
    // Your game-specific prompt phase UI
    return <div>Prompt Phase for Your Game</div>;
  }

  // ... other phase methods
}

// Export a function component for easier use
export function YourGamePhaseManagerFC(props: YourGamePhaseManagerProps) {
  const manager = new YourGamePhaseManager();
  return manager.renderPhase(props);
}
```

### 3. Create the Game Index File

Create `apps/web/src/components/games/your-game/index.ts`:

```typescript
export { YourGamePhaseManager, YourGamePhaseManagerFC } from './your-game-phase-manager';
```

### 4. Register the Game

Add your game to the main `GamePhaseManager`:

```typescript
// In apps/web/src/components/game-phase-manager.tsx
import { YourGamePhaseManagerFC } from "./games/your-game";

export function GamePhaseManager(props: GamePhaseManagerProps) {
  const { gameType = 'bluff-trivia', ...gameProps } = props;

  switch (gameType) {
    case 'bluff-trivia':
      return <BluffTriviaPhaseManagerFC {...gameProps} />;
    
    case 'your-game': // Add this case
      return <YourGamePhaseManagerFC {...gameProps} />;
    
    default:
      return <BluffTriviaPhaseManagerFC {...gameProps} />;
  }
}
```

### 5. Add Game Type to Configuration

Add your game type to the backend configuration:

```typescript
// In apps/api/src/config/game.config.ts
GAME_TYPES: {
  BLUFF_TRIVIA: 'bluff-trivia',
  YOUR_GAME: 'your-game', // Add this
},
```

### 6. Create Backend Game Engine

Implement the `GameEngine` interface:

```typescript
// In apps/api/src/rooms/games/your-game.engine.ts
import { GameEngine, GameAction, GameEvent, GameResult, GamePhase, BaseGameState, Player } from '@party/types';

export class YourGameEngine implements GameEngine<YourGameState, YourGameAction, YourGameEvent> {
  // Implement all required methods
}
```

### 7. Register Backend Engine

Add to the game registry:

```typescript
// In apps/api/src/rooms/game-registry.ts
import { YourGameEngine } from './games/your-game.engine';

constructor() {
  this.register(GAME_TYPES.BLUFF_TRIVIA, new BluffTriviaEngine());
  this.register(GAME_TYPES.YOUR_GAME, new YourGameEngine()); // Add this
}
```

## Using Shared Components

### Common Phases

Use the shared phase components for common functionality:

```typescript
import { LobbyView, ResultsView } from "../shared";

// In your phase manager
case 'lobby':
  return (
    <LobbyView
      gameTitle="YOUR GAME"
      roomCode={roomCode}
      players={players}
      timeLeft={timeLeft}
      totalTime={totalTime}
      round={round}
      maxRounds={maxRounds}
      isHost={isHost}
    />
  );
```

### Shared UI Components

Use the shared UI components:

```typescript
import { TimerRing, PlayerAvatar, RoomCodeChip } from "../shared/ui";

// Use them in your components
<TimerRing seconds={timeLeft} total={totalTime} />
<PlayerAvatar name={player.name} avatar={player.avatar} connected={player.connected} />
<RoomCodeChip code={roomCode} />
```

## Required Phases

All games must support these phases:
- `lobby` - Waiting for players
- `prompt` - Game-specific input phase
- `choose` - Voting/selection phase
- `scoring` - Results display
- `over` - Game complete

## Best Practices

1. **Extend BaseGamePhaseManager**: Use the base class for common functionality
2. **Use Shared Components**: Leverage the shared UI and phase components
3. **Organize by Game**: Keep all game-specific code in its own directory
4. **Validate Phases**: Always check if a phase is valid for your game
5. **Handle Host vs Player Views**: Most phases need different UI for hosts and players
6. **Consistent Styling**: Use the existing UI components and Tailwind classes
7. **Error Handling**: Gracefully handle invalid states and missing data

## Example Games

- **Bluff Trivia**: Classic trivia with bluffing mechanics
- **Fibbing It**: Players create answers and vote on the best ones
- **Word Association**: Players create word associations and vote on the best ones

## Testing

Test your new game by:
1. Setting `gameType="your-game"` in the `GamePhaseManager`
2. Ensuring all phases render correctly
3. Testing both host and player views
4. Verifying the game flows through all phases

## Need Help?

Check the existing implementations:
- `BluffTriviaPhaseManager` - Full-featured trivia game
- `FibbingItPhaseManager` - Complex game with multiple phases
- `WordAssociationPhaseManager` - Simple word association game
- `BaseGamePhaseManager` - Common functionality and utilities
- Shared components in `games/shared/` - Reusable UI and phases
