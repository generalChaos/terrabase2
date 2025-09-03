# Game Logic - Party Games

## Game Overview

The Party Game platform supports multiple game types, each with unique mechanics and gameplay. All games share a common architecture with pluggable game engines, consistent phase management, and unified scoring systems.

## Available Games

### 🎭 **Bluff Trivia**

A social deduction game where players compete to find the correct answer while trying to fool others with convincing bluffs. Combines trivia knowledge with deception skills.

### 🤥 **Fibbing It**

A storytelling game where players create believable lies and try to spot the truth among the fiction. Tests creativity and deception detection.

### 🔗 **Word Association**

A creative word game where players build on each other's word associations to create interesting connections. Encourages creative thinking and wordplay.

## Game Structure

### Common Elements

- **Total Rounds**: 5 rounds per game
- **Players per Round**: 2-8 players
- **Scoring**: Cumulative across all rounds
- **Phases**: Consistent phase structure across all games

### Game Phases

#### 1. **Lobby Phase**

**Duration**: Indefinite (until game starts)
**Purpose**: Wait for players to join
**Actions Available**:

- Players can join/leave
- Host can start game (requires 2+ players)

**State**:

```typescript
{
  phase: 'lobby',
  gameType: string,
  players: Player[],
  hostId: string,
  timeLeft: 0
}
```

#### 2. **Prompt Phase**

**Duration**: Varies by game type
**Purpose**: Players submit answers, stories, or associations
**Actions Available**:

- Submit content based on game type
- One submission per player

**State**:

```typescript
{
  phase: 'prompt',
  timeLeft: number, // Varies by game
  currentRound: {
    promptId: string,
    prompt: string,
    submissions: Submission[]
  }
}
```

#### 3. **Choose/Voting Phase**

**Duration**: Varies by game type
**Purpose**: Players vote on submissions
**Actions Available**:

- Vote on one choice
- One vote per player

**State**:

```typescript
{
  phase: 'choose' | 'voting',
  timeLeft: number, // Varies by game
  choices: Array<{
    id: string,
    text: string,
    playerId?: string
  }>
}
```

#### 4. **Scoring Phase**

**Duration**: Varies by game type
**Purpose**: Reveal results and award points
**Actions Available**: None (viewing only)

**State**:

```typescript
{
  phase: 'scoring',
  timeLeft: number, // Varies by game
  scores: PlayerScore[]
}
```

#### 5. **Game Over Phase**

**Duration**: Indefinite
**Purpose**: Show final results
**Actions Available**: None (viewing only)

## Game-Specific Details

### 🎭 Bluff Trivia

#### Phase Durations

- **Prompt**: 15 seconds
- **Choose**: 20 seconds
- **Scoring**: 6 seconds

#### Gameplay

1. **Prompt Phase**: Players see a trivia question and submit either the correct answer or a convincing bluff
2. **Choose Phase**: All submissions are mixed together, players vote on which they think is correct
3. **Scoring**: Points awarded for correct answers and successful bluffs

#### Scoring System

- **Correct Answer**: 1000 points
- **Bluff Points**: 500 points per player fooled

### 🤥 Fibbing It

#### Phase Durations

- **Prompt**: 60 seconds
- **Voting**: 30 seconds
- **Scoring**: 15 seconds

#### Gameplay

1. **Prompt Phase**: Players see a story prompt and submit either a true story or a convincing lie
2. **Voting Phase**: All stories are presented, players vote on which they think is true
3. **Scoring**: Points awarded for truth detection and successful deception

#### Scoring System

- **Correct Truth Detection**: 1000 points
- **Deception Points**: 500 points per player fooled

### 🔗 Word Association

#### Phase Durations

- **Prompt**: 45 seconds
- **Voting**: 25 seconds
- **Scoring**: 15 seconds

#### Gameplay

1. **Prompt Phase**: Players see a starting word and submit creative associations
2. **Voting Phase**: All associations are presented, players vote on the most creative/interesting
3. **Scoring**: Points awarded for creative associations and popular votes

#### Scoring System

- **Creative Association**: 1000 points
- **Popular Vote Points**: 500 points per vote received

## Game Flow

### Round Progression

```
Lobby → Prompt (varies) → Choose/Voting (varies) → Scoring (varies) → Next Round
```

### Phase Transitions

#### Lobby → Prompt

**Trigger**: Host starts game
**Requirements**: 2+ players
**Actions**:

1. Generate game-specific content (question, prompt, or word)
2. Initialize round state
3. Start timer based on game type
4. Broadcast `prompt` event

#### Prompt → Choose/Voting

**Trigger**: Timer expires OR all players submitted
**Actions**:

1. Collect all submissions
2. Generate voting choices
3. Start timer based on game type
4. Broadcast `choices` event

#### Choose/Voting → Scoring

**Trigger**: Timer expires OR all players voted
**Actions**:

1. Calculate scores based on game type
2. Update player totals
3. Start timer based on game type
4. Broadcast `scores` event

#### Scoring → Next Round

**Trigger**: Timer expires
**Actions**:

1. Check if game is over (5 rounds)
2. If not over: advance to next round
3. If over: end game and show winners

## Game Rules

### Player Actions

#### Submitting Content

- **One submission per player per round**
- **Cannot change submission once made**
- **Must submit within time limit**
- **Empty submissions not allowed**

#### Voting

- **One vote per player per round**
- **Cannot change vote once made**
- **Must vote within time limit**
- **Cannot vote for your own submission**

### Host Privileges

- **Start the game** (requires 2+ players)
- **Cannot be transferred** (first player to join)
- **Can start new game** after current game ends
- **Manual phase advancement** (optional)

### Room Management

- **Auto-cleanup**: Empty rooms are deleted immediately
- **Inactive cleanup**: Rooms inactive for 30+ minutes are removed
- **Reconnection**: Players can reconnect and resume

## Data Structures

### Player

```typescript
interface Player {
  id: string; // Unique player identifier
  name: string; // Display name (2-20 characters)
  avatar: string; // Emoji avatar
  score: number; // Current score
  connected: boolean; // Connection status
}
```

### Round State

```typescript
interface RoundState {
  roundNumber: number; // Current round (1-5)
  promptId: string; // Question/prompt identifier
  prompt: string; // Game content
  submissions: Submission[]; // Player submissions
  votes: Map<string, string>; // Player votes
  timeLeft: number; // Seconds remaining
  phase: string; // Current phase
}
```

### Submission

```typescript
interface Submission {
  id: string; // Unique submission identifier
  text: string; // Submission content
  playerId: string; // Player who submitted
  type: 'answer' | 'story' | 'association'; // Game-specific type
}
```

## Configuration

### Centralized Game Settings

All game settings are centralized in the `GameConfig` object:

```typescript
const GameConfig = {
  TIMING: {
    PHASES: {
      PROMPT: 15, // Base prompt time (varies by game)
      CHOOSE: 20, // Base choose time (varies by game)
      SCORING: 6, // Base scoring time (varies by game)
    },
  },
  RULES: {
    ROUNDS: {
      MAX_ROUNDS: 5, // Maximum rounds per game
      MIN_PLAYERS_TO_START: 2, // Minimum players required
    },
    SCORING: {
      CORRECT_ANSWER: 1000, // Points for correct answer
      BLUFF_POINTS: 500, // Points per player fooled
    },
    PLAYERS: {
      MAX_PLAYERS_PER_ROOM: 8, // Maximum players in room
      MIN_NICKNAME_LENGTH: 2, // Minimum nickname length
      MAX_NICKNAME_LENGTH: 20, // Maximum nickname length
    },
  },
  GAME_TYPES: {
    BLUFF_TRIVIA: 'bluff-trivia',
    FIBBING_IT: 'fibbing-it',
    WORD_ASSOCIATION: 'word-association',
  },
};
```

### Game-Specific Timing

Each game engine can override default timing:

```typescript
getPhaseDuration(phase: string): number {
  const durations: Record<string, number> = {
    lobby: 0,
    prompt: 60,    // 60 seconds for Fibbing It
    voting: 30,    // 30 seconds for Fibbing It
    scoring: 15,   // 15 seconds for Fibbing It
    over: 0,
  };
  return durations[phase] || 0;
}
```

### Timer Behavior

- **Automatic progression** when timer expires
- **Manual progression** when all players complete actions
- **Grace period** for late submissions (within reason)

## Error Handling

### Common Game Errors

- **Invalid Phase**: Action not allowed in current phase
- **Already Submitted**: Player already submitted answer/vote
- **Time Expired**: Action submitted after phase ended
- **Invalid Choice**: Vote for non-existent choice
- **Insufficient Players**: Not enough players to start game
- **Player Not Host**: Non-host trying to perform host action

### Error Recovery

- **Graceful degradation** when possible
- **State consistency** maintained
- **Player feedback** for all errors
- **Automatic cleanup** of invalid states

## Game Engine Architecture

### Pluggable Design

Games use a common interface for consistency:

```typescript
interface GameEngine<
  TState extends BaseGameState,
  TAction extends GameAction,
  TEvent extends GameEvent,
> {
  initialize(players: Player[]): TState;
  processAction(state: TState, action: TAction): GameResult<TState, TEvent>;
  getValidActions(state: TState, playerId: string): TAction[];
  isGameOver(state: TState): boolean;
  getWinners(state: TState): Player[];
  getCurrentPhase(state: TState): GamePhase;
  advancePhase(state: TState): TState;
  getTimeLeft(state: TState): number;
  updateTimer(state: TState, delta: number): TState;
  generatePhaseEvents(state: TState): TEvent[];
}
```

### State Management

- **Immutable state** with Result pattern
- **Type-safe operations** across all game types
- **Consistent error handling** using standardized error types
- **Automatic cleanup** and resource management

## Next Steps

- [Error Codes](./error-codes.md) - Complete error reference
- [Examples](./examples.md) - Working code examples
- [API Reference](./websocket-events.md) - All available endpoints
