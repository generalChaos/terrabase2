# 🎭 Fibbing It - Complete Game Flow Documentation

## 🎯 **Game Overview**

**Fibbing It** is a deception game where players create believable lies to factual questions and try to spot the truth among the fiction. Players are presented with trivia-style prompts and must either provide the correct answer or create a convincing bluff, then vote on which answer they believe is true.

### **🎮 Core Concept**
- **Knowledge**: Players use trivia knowledge for correct answers
- **Deception**: Successfully fooling other players with believable bluffs
- **Detection**: Identifying the truth among the bluffs
- **Social**: Reading other players and their tells

---

## 🏗️ **Game Architecture**

### **Game Engine**: `FibbingItNewEngine`
- **Location**: `apps/api/src/rooms/games/fibbing-it-new.engine.ts`
- **Implements**: `GameEngine<FibbingItGameState, FibbingItAction, FibbingItEvent>`
- **State Management**: Extends `BaseGameState` with round-specific data

### **Frontend Manager**: `FibbingItPhaseManager`
- **Location**: `apps/web/src/components/games/fibbing-it/fibbing-it-phase-manager.tsx`
- **Extends**: `BaseGamePhaseManager`
- **Phase Rendering**: Handles all game phases with appropriate UI components

---

## 🎲 **Game Configuration**

### **Basic Settings**
```typescript
{
  id: 'fibbing-it',
  name: 'Fibbing It',
  description: 'Players create answers and vote on the best ones',
  minPlayers: 2,
  maxPlayers: 8,
  defaultSettings: {
    maxRounds: 5,
    pointsPerVote: 100,
    bonusForCorrect: 500
  }
}
```

### **Phase Structure**
| Phase | Duration | Purpose | Auto-Advance | Requirements |
|-------|----------|---------|--------------|--------------|
| `lobby` | 0s | Wait for players | ❌ | 2+ players |
| `prompt` | 60s | Submit stories | ✅ | All players submit |
| `voting` | 45s | Vote on stories | ✅ | All players vote |
| `reveal` | 15s | Show results | ✅ | Timer only |
| `scoring` | 10s | Award points | ✅ | Timer only |
| `round-end` | 5s | Round summary | ✅ | Timer only |
| `game-over` | 0s | Final results | ❌ | Manual |

---

## 🔄 **Complete Game Flow**

### **Phase 1: Lobby** 🏠
**Duration**: Indefinite (until game starts)

**Purpose**: Wait for players to join and prepare for the game

**Player Actions**:
- Join/leave the room
- Change avatar or nickname
- Chat with other players

**Host Actions**:
- Start the game (requires 2+ players)
- View player list and readiness

**State**:
```typescript
{
  phase: 'lobby',
  players: Player[],
  hostId: string,
  gameType: 'fibbing-it',
  timeLeft: 0
}
```

**Events**:
- `playerJoined` - New player joins
- `playerLeft` - Player leaves
- `gameStarted` - Host starts the game

---

### **Phase 2: Prompt** ✍️
**Duration**: 60 seconds (or until all players submit)

**Purpose**: Players create and submit their answers

**Game Logic**:
1. **Prompt Selection**: Random trivia question chosen from `prompts.seed.ts`
2. **Answer Creation**: Players provide correct answers or create convincing bluffs
3. **Submission Tracking**: All submissions collected and stored

**Player Actions**:
- View the trivia question
- Submit the correct answer or create a believable bluff
- Cannot change submission once submitted

**State**:
```typescript
{
  phase: 'prompt',
  timeLeft: 60000, // 60 seconds
  currentRound: {
    roundNumber: 1,
    promptId: 'p1',
    prompt: 'What is the national animal of Scotland?',
    answers: Map<string, string>, // playerId -> answer
    timeLeft: 60000
  },
  round: 1,
  maxRounds: 5
}
```

**Events**:
- `prompt` - Display the trivia question to all players
- `submitted` - Confirm player's submission
- `timer` - Update countdown
- `allSubmitted` - All players have submitted

**Frontend Rendering**:
```tsx
<SharedPromptView
  question={prompt}
  timeLeft={timeLeft}
  totalTime={60000}
  round={round}
  maxRounds={maxRounds}
  state={isHost ? 'waiting' : 'input'}
  onSubmitAnswer={onSubmitAnswer}
  hasSubmitted={hasSubmittedAnswer}
/>
```

---

### **Phase 3: Voting** 🗳️
**Duration**: 45 seconds (or until all players vote)

**Purpose**: Players vote on which answer they believe is true

**Game Logic**:
1. **Answer Presentation**: All answers displayed anonymously
2. **Vote Collection**: Players select one answer to vote for
3. **Vote Validation**: Ensure one vote per player

**Player Actions**:
- View all submitted answers (anonymized)
- Select one answer to vote for
- Cannot vote for their own answer
- Cannot change vote once submitted

**State**:
```typescript
{
  phase: 'voting',
  timeLeft: 45000, // 45 seconds
  currentRound: {
    roundNumber: 1,
    promptId: 'p1',
    prompt: 'What is the national animal of Scotland?',
    answers: Map<string, string>, // playerId -> story
    votes: Map<string, string>, // playerId -> chosenStoryId
    timeLeft: 45000
  }
}
```

**Events**:
- `answers` - Display all answers for voting
- `voteSubmitted` - Confirm player's vote
- `timer` - Update countdown
- `allVoted` - All players have voted

**Frontend Rendering**:
```tsx
<SharedPromptView
  question={prompt}
  timeLeft={timeLeft}
  totalTime={45000}
  round={round}
  maxRounds={maxRounds}
  state="options"
  options={answers.map((answer, index) => ({
    id: answer.id,
    text: answer.text,
    color: colorScheme[index % 4],
    playerId: answer.playerId,
    playerAvatar: `avatar_${(index + 1) % 9 + 1}`
  }))}
  votes={votes}
  players={players}
  onSubmitVote={onSubmitVote}
  selectedChoiceId={selectedChoiceId}
/>
```

---

### **Phase 4: Reveal** 🎭
**Duration**: 15 seconds

**Purpose**: Show which answer was true and who fooled whom

**Game Logic**:
1. **Truth Reveal**: Display which answer was actually correct
2. **Vote Results**: Show how each player voted
3. **Deception Success**: Highlight who successfully fooled others

**Player Actions**:
- View the correct answer
- See how everyone voted
- Understand who fooled whom

**State**:
```typescript
{
  phase: 'reveal',
  timeLeft: 15000, // 15 seconds
  currentRound: {
    roundNumber: 1,
    promptId: 'p1',
    prompt: 'What is the national animal of Scotland?',
    answers: Map<string, string>,
    votes: Map<string, string>,
    correctAnswer: 'Unicorn',
    correctAnswerPlayerId: 'player-1'
  }
}
```

**Events**:
- `reveal` - Show the true story and voting results
- `timer` - Update countdown

**Frontend Rendering**:
```tsx
<SharedPromptView
  question={prompt}
  timeLeft={timeLeft}
  totalTime={15000}
  round={round}
  maxRounds={maxRounds}
  state="reveal"
  options={stories}
  correctAnswer={correctAnswer}
  votes={votes}
  players={players}
/>
```

---

### **Phase 5: Scoring** 🏆
**Duration**: 10 seconds

**Purpose**: Calculate and award points for the round

**Scoring System**:
- **Correct Truth Detection**: 1000 points
- **Deception Points**: 500 points per player fooled
- **Bonus Points**: Additional rewards for exceptional bluffs

**Game Logic**:
1. **Point Calculation**: Determine points for each player
2. **Score Update**: Add round points to total scores
3. **Round Summary**: Display round results

**State**:
```typescript
{
  phase: 'scoring',
  timeLeft: 10000, // 10 seconds
  currentRound: {
    roundNumber: 1,
    promptId: 'p1',
    prompt: 'What is the national animal of Scotland?',
    answers: Map<string, string>,
    votes: Map<string, string>,
    correctAnswer: 'Unicorn',
    correctAnswerPlayerId: 'player-1',
    roundScores: Map<string, number> // playerId -> roundPoints
  },
  scores: Map<string, number> // playerId -> totalScore
}
```

**Events**:
- `scores` - Display round and total scores
- `timer` - Update countdown

**Frontend Rendering**:
```tsx
<SharedPromptView
  question={prompt}
  timeLeft={timeLeft}
  totalTime={10000}
  round={round}
  maxRounds={maxRounds}
  state="scoring"
  options={stories}
  correctAnswer={correctAnswer}
  votes={votes}
  players={players}
/>
```

---

### **Phase 6: Round End** 🔄
**Duration**: 5 seconds

**Purpose**: Brief pause before next round or game end

**Game Logic**:
1. **Round Check**: Determine if game continues or ends
2. **State Preparation**: Prepare for next round if continuing
3. **Transition**: Move to next round or end game

**State**:
```typescript
{
  phase: 'round-end',
  timeLeft: 5000, // 5 seconds
  round: 1,
  maxRounds: 5,
  isRoundComplete: true
}
```

**Events**:
- `roundEnd` - Display round summary
- `nextRound` - Prepare for next round
- `gameOver` - End game if max rounds reached

---

### **Phase 7: Game Over** 🎯
**Duration**: Indefinite

**Purpose**: Show final results and allow new game

**Game Logic**:
1. **Winner Determination**: Calculate final rankings
2. **Game Statistics**: Display comprehensive results
3. **New Game Option**: Allow host to start new game

**State**:
```typescript
{
  phase: 'game-over',
  timeLeft: 0,
  round: 5,
  maxRounds: 5,
  isRoundComplete: true,
  winners: Player[] // Top 3 players
}
```

**Events**:
- `gameOver` - Display final results
- `winners` - Show top players

**Frontend Rendering**:
```tsx
<SharedPromptView
  question="Game Over!"
  timeLeft={0}
  totalTime={0}
  round={round}
  maxRounds={maxRounds}
  state="over"
  onPlayAgain={onPlayAgain}
/>
```

---

## 🎯 **Implementation Status**

### **✅ Completed**
- Basic game configuration and phases
- Frontend UI components structure
- Game state management framework
- Timer system integration

### **❌ Missing/Incomplete**
- **Backend Action Handlers**: `handleSubmitAnswer`, `handleSubmitVote`
- **Round Management**: Prompt selection, answer collection
- **Scoring Logic**: Point calculation and distribution
- **Phase Transitions**: Proper game flow advancement
- **Frontend Phase Alignment**: Phase names don't match backend
- **State Persistence**: Round data not properly stored

---

## 🚀 **Next Steps for Completion**

### **Phase 1: Backend Engine Completion**
1. **Implement Action Handlers**
   - Complete `handleSubmitAnswer` with answer storage
   - Complete `handleSubmitVote` with vote processing
   - Add round creation and management logic

2. **Add Round Management**
   - Prompt selection from seed data
   - Answer collection and validation
   - Vote processing and counting

3. **Implement Scoring System**
   - Point calculation logic
   - Score distribution
   - Round-to-round progression

### **Phase 2: Frontend Integration**
1. **Fix Phase Alignment**
   - Match frontend phase names with backend
   - Complete missing phase handlers
   - Add proper state management

2. **Enhance User Experience**
   - Better animations and transitions
   - Improved feedback and notifications
   - Mobile-responsive design

### **Phase 3: Game Polish**
1. **Add More Prompts**
   - Expand prompt variety
   - Category-based prompts
   - Difficulty levels

2. **Advanced Features**
   - Custom game settings
   - Achievement system
   - Statistics tracking

---

## 📝 **Technical Notes**

### **Data Flow**
```
Player Action → Engine Processing → State Update → Event Generation → Frontend Update
```

### **State Management**
- **Immutable Updates**: All state changes create new objects
- **Event-Driven**: Frontend updates based on engine events
- **Real-time**: WebSocket communication for live updates

### **Error Handling**
- **Validation**: Input validation at action level
- **Graceful Degradation**: Fallback behavior for edge cases
- **User Feedback**: Clear error messages and guidance

---

## 🎊 **Conclusion**

Fibbing It has a solid foundation with well-defined game flow and phase structure. The main work needed is completing the backend engine implementation and aligning the frontend with the backend phases. Once completed, this will provide a polished, engaging trivia deception game experience where players bluff with believable false answers to factual questions.

**Priority**: Complete the backend engine first, then fix frontend integration, and finally add polish and advanced features.
