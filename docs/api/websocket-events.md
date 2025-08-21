# WebSocket Events

## Client to Server Messages

### Connection & Room Management

#### `join` - Join a Room
**Emitted by**: Client when joining a room
**Payload**:
```typescript
{
  nickname: string;    // Player's display name (2-20 characters)
  avatar?: string;     // Optional emoji avatar (default: "🙂")
}
```

**Response**: `joined` event with success confirmation

**Example**:
```typescript
socket.emit('join', { 
  nickname: 'Rico', 
  avatar: '🎮' 
});
```

#### `startGame` - Start the Game
**Emitted by**: Host when ready to start
**Payload**: None (empty object)
**Requirements**: 
- Must be the host
- At least 2 players in room
- Game must be in 'lobby' phase

**Example**:
```typescript
socket.emit('startGame', {});
```

### Game Actions

#### `submitAnswer` - Submit Answer/Bluff
**Emitted by**: Player during prompt phase
**Payload**:
```typescript
{
  answer: string;      // Player's answer or bluff text
}
```
**Requirements**: 
- Game must be in 'prompt' phase
- Player must not have already submitted

**Example**:
```typescript
socket.emit('submitAnswer', { 
  answer: 'The answer is 42!' 
});
```

#### `submitBluff` - Submit Bluff Text
**Emitted by**: Player during prompt phase
**Payload**:
```typescript
{
  text: string;        // Bluff text to fool other players
}
```
**Requirements**: 
- Game must be in 'prompt' phase
- Player must not have already submitted

**Example**:
```typescript
socket.emit('submitBluff', { 
  text: 'This is definitely the right answer!' 
});
```

#### `submitVote` - Vote on Answer
**Emitted by**: Player during choose phase
**Payload**:
```typescript
{
  choiceId: string;    // ID of the chosen answer
}
```
**Requirements**: 
- Game must be in 'choose' phase
- Player must not have already voted

**Example**:
```typescript
socket.emit('submitVote', { 
  choiceId: 'TRUE::prompt123' 
});
```

## Server to Client Messages

### Room State Updates

#### `room` - Room State Update
**Emitted to**: All clients in room
**Payload**: Complete room state
```typescript
{
  code: string;                    // Room code
  phase: 'lobby' | 'prompt' | 'choose' | 'scoring' | 'over';
  round: number;                   // Current round number
  maxRounds: number;               // Total rounds in game
  timeLeft: number;                // Seconds remaining in current phase
  players: Player[];               // Array of players
  current?: RoundState;            // Current round data
  hostId: string | null;           // Host player ID
}
```

**Example**:
```typescript
socket.on('room', (roomState) => {
  console.log('Room updated:', roomState);
  updateUI(roomState);
});
```

#### `joined` - Join Confirmation
**Emitted to**: Client who joined
**Payload**:
```typescript
{
  ok: boolean;         // Always true if received
}
```

**Example**:
```typescript
socket.on('joined', (response) => {
  if (response.ok) {
    console.log('Successfully joined room!');
  }
});
```

### Game Events

#### `prompt` - New Question
**Emitted to**: All clients
**Payload**:
```typescript
{
  question: string;    // The trivia question
}
```

**Example**:
```typescript
socket.on('prompt', (data) => {
  console.log('New question:', data.question);
  showQuestion(data.question);
});
```

#### `choices` - Voting Choices
**Emitted to**: All clients
**Payload**:
```typescript
{
  choices: Array<{
    id: string;        // Choice identifier
    text: string;      // Choice text
  }>
}
```

**Example**:
```typescript
socket.on('choices', (data) => {
  console.log('Voting choices:', data.choices);
  showVotingChoices(data.choices);
});
```

#### `scores` - Score Update
**Emitted to**: All clients
**Payload**:
```typescript
{
  scores: Array<{
    id: string;        // Player ID
    name: string;      // Player name
    score: number;     // Current score
  }>
}
```

**Example**:
```typescript
socket.on('scores', (data) => {
  console.log('Scores updated:', data.scores);
  updateScoreboard(data.scores);
});
```

#### `timer` - Timer Update
**Emitted to**: All clients
**Payload**:
```typescript
{
  timeLeft: number;    // Seconds remaining
}
```

**Example**:
```typescript
socket.on('timer', (data) => {
  console.log('Time remaining:', data.timeLeft);
  updateTimer(data.timeLeft);
});
```

#### `gameOver` - Game End
**Emitted to**: All clients
**Payload**:
```typescript
{
  winners: Array<{
    id: string;        // Winner player ID
    name: string;      // Winner name
    score: number;     // Final score
  }>
}
```

**Example**:
```typescript
socket.on('gameOver', (data) => {
  console.log('Game over! Winners:', data.winners);
  showGameOver(data.winners);
});
```

### Error Messages

#### `error` - Error Response
**Emitted to**: Client who caused the error
**Payload**: ErrorResponse object
```typescript
{
  error: string;       // Human-readable error message
  code: string;        // Error code
  statusCode: number;  // HTTP-style status code
  details?: any;       // Additional context
  context: string;     // Where error occurred
}
```

**Example**:
```typescript
socket.on('error', (error) => {
  console.error('Game error:', error);
  showErrorMessage(error.error);
});
```

## Event Flow

### Typical Game Flow:
1. **Client connects** → `connection` event
2. **Client joins** → `join` message → `joined` response
3. **Host starts game** → `startGame` message → `prompt` event
4. **Players submit** → `submitAnswer`/`submitBluff` messages
5. **Voting phase** → `choices` event → `submitVote` messages
6. **Scoring phase** → `scores` event
7. **Next round** → Repeat from step 3
8. **Game ends** → `gameOver` event

### Connection Flow:
1. **Connect** → Socket.io connection established
2. **Join room** → `join` message with nickname
3. **Room state** → `room` event with current state
4. **Disconnect** → Automatic cleanup

## Best Practices

### Client Side:
- **Always listen for errors** - Handle `error` events gracefully
- **Validate input** - Check data before sending
- **Handle disconnections** - Implement reconnection logic
- **Use TypeScript** - Leverage type safety for payloads

### Server Side:
- **Validate all inputs** - Check message format and content
- **Handle errors gracefully** - Return consistent error responses
- **Broadcast state changes** - Keep all clients synchronized
- **Clean up resources** - Remove disconnected players

## Next Steps

- [Game Logic](./game-logic.md) - Detailed game rules and flow
- [Error Codes](./error-codes.md) - Complete error reference
- [Examples](./examples.md) - Working code examples
