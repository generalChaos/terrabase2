# Game Phase Naming Convention

## 🎯 **Single Source of Truth**

This document establishes the **ONE** standard for game phase naming across the entire codebase. All components must follow this convention.

## 📋 **Standard Phase Names**

### **Core Game Phases (Enum: `GamePhaseName`)**

| Phase | Enum Value | Description | Duration | Actions |
|-------|------------|-------------|----------|---------|
| **Lobby** | `GamePhaseName.LOBBY` | Players joining, waiting to start | 0s | `start` |
| **Prompt** | `GamePhaseName.PROMPT` | Players submitting answers/bluffs | 25s | `submitAnswer` |
| **Choose** | `GamePhaseName.CHOOSE` | Players voting on answers | 45s | `submitVote` |
| **Reveal** | `GamePhaseName.REVEAL` | Showing correct answer and results | 15s | None |
| **Scoring** | `GamePhaseName.SCORING` | Calculating and displaying scores | 10s | None |
| **Round End** | `GamePhaseName.ROUND_END` | Round completion summary | 5s | None |
| **Game Over** | `GamePhaseName.GAME_OVER` | Final results and standings | 0s | None |

## 🔧 **Implementation Rules**

### **1. Backend (NestJS)**
- ✅ **Use**: `GamePhaseName.CHOOSE`
- ❌ **Never use**: `'voting'`, `'choose'` (string literals)
- ✅ **Validation**: Check against enum values, not strings

### **2. Frontend (React/Next.js)**
- ✅ **Use**: `GamePhaseName.CHOOSE` or `'choose'` (string)
- ❌ **Never use**: `'voting'` (deprecated)
- ✅ **Components**: Expect `'choose'` phase name

### **3. Configuration Files**
- ✅ **Use**: `GamePhaseName.CHOOSE`
- ❌ **Never use**: `'voting'` (deprecated)

## 🚫 **Deprecated Phase Names**

| Old Name | New Name | Reason |
|----------|----------|---------|
| `'voting'` | `'choose'` | Frontend expects `'choose'` |
| `'over'` | `'game-over'` | More descriptive |

## 📝 **Code Examples**

### **Backend Engine**
```typescript
// ✅ CORRECT
export interface FibbingItRound {
  phase: 'prompt' | 'choose' | 'reveal' | 'scoring'; // Use 'choose'
}

// ❌ WRONG
export interface FibbingItRound {
  phase: 'prompt' | 'voting' | 'reveal' | 'scoring'; // Don't use 'voting'
}
```

### **Frontend Components**
```typescript
// ✅ CORRECT
case 'choose':
  return <VotingView />;

// ❌ WRONG
case 'voting':
  return <VotingView />;
```

### **Configuration**
```typescript
// ✅ CORRECT
export const FIBBING_IT_CONFIG: GameConfig = {
  phases: [
    { name: GamePhaseName.CHOOSE, duration: 45, ... }
  ]
};

// ❌ WRONG
export const FIBBING_IT_CONFIG: GameConfig = {
  phases: [
    { name: 'voting', duration: 45, ... } // Don't use 'voting'
  ]
};
```

## 🔍 **Validation Rules**

### **Phase Transitions**
1. `lobby` → `prompt` (when game starts)
2. `prompt` → `choose` (when all answers submitted)
3. `choose` → `reveal` (when all votes submitted)
4. `reveal` → `scoring` (after reveal timer)
5. `scoring` → `round-end` (after scoring timer)
6. `round-end` → `prompt` (next round) or `game-over` (final round)

### **Action Validation**
- `submitAnswer`: Only allowed in `prompt` phase
- `submitVote`: Only allowed in `choose` phase
- `start`: Only allowed in `lobby` phase

## 🧪 **Testing Requirements**

### **Unit Tests**
- ✅ Test phase transitions use correct enum values
- ✅ Test action validation against correct phases
- ✅ Test configuration uses correct phase names

### **Integration Tests**
- ✅ Test complete game flow uses correct phases
- ✅ Test frontend receives correct phase names
- ✅ Test backend validation accepts correct phases

## 🚨 **Breaking Changes**

If you need to change a phase name:
1. **Update** the `GamePhaseName` enum
2. **Update** all backend engines
3. **Update** all frontend components
4. **Update** all configuration files
5. **Update** all tests
6. **Document** the change here

## 📚 **Related Files**

- **Types**: `packages/types/src/index.ts` - `GamePhaseName` enum
- **Config**: `packages/types/src/index.ts` - `FIBBING_IT_CONFIG`
- **Engine**: `apps/api/src/rooms/games/fibbing-it-new.engine.ts`
- **Validation**: `apps/api/src/rooms/services/game-gateway.service.ts`
- **Frontend**: `apps/web/src/components/games/fibbing-it/`

## ✅ **Compliance Checklist**

Before committing phase-related changes:

- [ ] Phase names use `GamePhaseName` enum values
- [ ] No string literals for phase names
- [ ] Frontend components expect correct phase names
- [ ] Backend validation uses correct phase names
- [ ] Configuration files use correct phase names
- [ ] Tests validate correct phase names
- [ ] Documentation updated if needed

---

**Remember**: There is **ONE** standard. Follow it everywhere. No exceptions.
