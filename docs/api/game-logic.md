# Game Logic - Bluff Trivia

## Game Overview

Bluff Trivia is a social deduction game where players compete to find the correct answer while trying to fool others with convincing bluffs. The game combines trivia knowledge with deception skills.

## Game Structure

### Rounds
- **Total Rounds**: 5 rounds per game
- **Players per Round**: 2-8 players
- **Scoring**: Cumulative across all rounds

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
  players: Player[],
  hostId: string,
  timeLeft: 0
}
```

#### 2. **Prompt Phase**
**Duration**: 15 seconds
**Purpose**: Players submit answers or bluffs
**Actions Available**:
- Submit truthful answer
- Submit bluff text
- One submission per player

**State**:
```typescript
{
  phase: 'prompt',
  timeLeft: 15,
  currentRound: {
    promptId: string,
    prompt: string,
    answer: string,
    bluffs: Bluff[],
    votes: Map<string, string>
  }
}
```

#### 3. **Choose Phase**
**Duration**: 20 seconds
**Purpose**: Players vote on which answer they think is correct
**Actions Available**:
- Vote on one choice
- One vote per player

**State**:
```typescript
{
  phase: 'choose',
  timeLeft: 20,
  choices: Array<{
    id: string,
    text: string
  }>
}
```

#### 4. **Scoring Phase**
**Duration**: 6 seconds
**Purpose**: Reveal results and award points
**Actions Available**: None (viewing only)

**State**:
```typescript
{
  phase: 'scoring',
  timeLeft: 6,
  scores: PlayerScore[]
}
```

#### 5. **Game Over Phase**
**Duration**: Indefinite
**Purpose**: Show final results
**Actions Available**: None (viewing only)

## Scoring System

### Point Values
- **Correct Answer**: 1000 points
- **Bluff Points**: 500 points per player fooled

### Scoring Logic

#### Finding the Truth
```typescript
// Player gets 1000 points for voting correctly
if (vote === `TRUE::${promptId}`) {
  player.score += 1000;
}
```

#### Successful Bluffs
```typescript
// Player gets 500 points for each player they fooled
const fooledCount = playersWhoVotedForBluff.length;
player.score += fooledCount * 500;
```

### Example Scoring
**Scenario**: 4 players, 1 correct answer, 3 bluffs
- **Player A** (correct answer): 1000 points
- **Player B** (bluff, fooled 2 players): 1000 points
- **Player C** (bluff, fooled 0 players): 0 points
- **Player D** (bluff, fooled 1 player): 500 points

## Game Flow

### Round Progression
```
Lobby → Prompt (15s) → Choose (20s) → Scoring (6s) → Next Round
```

### Phase Transitions

#### Lobby → Prompt
**Trigger**: Host starts game
**Requirements**: 2+ players
**Actions**:
1. Generate random trivia question
2. Initialize round state
3. Start 15-second timer
4. Broadcast `prompt` event

#### Prompt → Choose
**Trigger**: Timer expires OR all players submitted
**Actions**:
1. Collect all answers/bluffs
2. Generate voting choices
3. Start 20-second timer
4. Broadcast `choices` event

#### Choose → Scoring
**Trigger**: Timer expires OR all players voted
**Actions**:
1. Calculate scores
2. Update player totals
3. Start 6-second timer
4. Broadcast `scores` event

#### Scoring → Next Round
**Trigger**: Timer expires
**Actions**:
1. Check if game is over (5 rounds)
2. If not over: advance to next round
3. If over: end game and show winners

## Game Rules

### Player Actions

#### Submitting Answers/Bluffs
- **One submission per player per round**
- **Cannot change submission once made**
- **Must submit within time limit**
- **Empty submissions not allowed**

#### Voting
- **One vote per player per round**
- **Cannot change vote once made**
- **Must vote within time limit**
- **Cannot vote for your own bluff**

### Host Privileges
- **Start the game** (requires 2+ players)
- **Cannot be transferred** (first player to join)
- **Can start new game** after current game ends

### Room Management
- **Auto-cleanup**: Empty rooms are deleted immediately
- **Inactive cleanup**: Rooms inactive for 30+ minutes are removed
- **Reconnection**: Players can reconnect and resume

## Data Structures

### Player
```typescript
interface Player {
  id: string;           // Unique player identifier
  name: string;         // Display name (2-20 characters)
  avatar: string;       // Emoji avatar
  score: number;        // Current score
  connected: boolean;   // Connection status
}
```

### Round State
```typescript
interface RoundState {
  roundNumber: number;  // Current round (1-5)
  promptId: string;     // Question identifier
  prompt: string;       // Trivia question
  answer: string;       // Correct answer
  bluffs: Bluff[];      // Player bluff submissions
  votes: Map<string, string>; // Player votes
  timeLeft: number;     // Seconds remaining
  phase: 'prompt' | 'choose' | 'scoring';
}
```

### Bluff
```typescript
interface Bluff {
  id: string;           // Unique bluff identifier
  text: string;         // Bluff text
  playerId: string;     // Player who submitted
}
```

## Configuration

### Game Settings
```typescript
const GAME_CONFIG = {
  MAX_ROUNDS: 5,
  PHASE_DURATIONS: {
    PROMPT: 15,     // seconds
    CHOOSE: 20,     // seconds
    SCORING: 6      // seconds
  },
  SCORING: {
    CORRECT_ANSWER: 1000,
    BLUFF_POINTS: 500
  },
  PLAYERS: {
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 8
  }
};
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

### Error Recovery
- **Graceful degradation** when possible
- **State consistency** maintained
- **Player feedback** for all errors
- **Automatic cleanup** of invalid states

## Next Steps

- [Error Codes](./error-codes.md) - Complete error reference
- [Examples](./examples.md) - Working code examples
- [API Reference](./websocket-events.md) - All available endpoints
