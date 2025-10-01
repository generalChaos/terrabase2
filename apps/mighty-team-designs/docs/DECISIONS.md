# Design Decisions

## Question Generation Strategy

### Current Status: Under Discussion

### Option 1: Pregenerated Questions
**Description**: Create fixed question sets for Round 2 based on common team types.

**Example Question Sets**:
```
High School Basketball:
- What style best represents your team? (Modern, Classic, Aggressive)
- What colors should dominate? (School colors, Team colors, Custom)
- Should the logo include a mascot? (Yes, No, Text-only)

Youth Soccer:
- What style best represents your team? (Playful, Professional, Energetic)
- What colors should dominate? (Bright colors, Team colors, Custom)
- Should the logo include a mascot? (Yes, No, Text-only)
```

**Pros**:
- Faster response (no AI call between rounds)
- Predictable user experience
- Easier to test and debug
- Lower API costs

**Cons**:
- Less personalized
- Limited flexibility for unique team types
- Manual maintenance of question sets

### Option 2: AI-Generated Questions
**Description**: Use GPT-5 to generate 3 targeted questions based on Round 1 answers.

**Example**:
```
Round 1: "Eagles" + "Basketball" + "High School"
↓
AI generates:
- What style best represents your high school basketball team? (Modern, Classic, Aggressive)
- What colors should dominate your Eagles logo? (School colors, Team colors, Custom)
- Should the logo include an eagle mascot? (Yes, No, Text-only)
```

**Pros**:
- Highly personalized
- Adapts to any team type
- Natural language customization
- Future-proof

**Cons**:
- Additional API call and latency
- Higher costs
- Potential for inconsistent question quality
- More complex error handling

### Option 3: Hybrid Approach
**Description**: Pregenerated question templates with AI customization.

**Example**:
```
Template: "What style best represents your team?"
AI Customization: "What style best represents your high school basketball team?"
```

**Pros**:
- Balance of speed and personalization
- Consistent question structure
- Natural language enhancement
- Moderate API usage

**Cons**:
- More complex implementation
- Still requires AI call
- Template maintenance needed

## Recommendation

**Decision**: Start with **Option 1 (Pregenerated)** for MVP, with plan to evolve to **Option 3 (Hybrid)**.

**Rationale**:
1. **Faster MVP**: Get to market quickly with proven question sets
2. **User Testing**: Validate the core flow before adding AI complexity
3. **Cost Control**: Lower API costs during initial development
4. **Evolution Path**: Easy to add AI customization later
5. **Target Audience**: Less organized teams need simple, fast solutions

## Updated Question Sets for Target Audience

**Focus**: Parent-run, seasonal teams with simple needs

**Question Set Categories**:
- **Youth Sports** (U6, U8, U10, U12, U14, U16, U19)
- **Recreational Adult** (Beer leagues, pickup games)
- **Community Rec** (Parks & recreation programs)
- **Tournament Teams** (One-off tournament participation)

**Question Examples**:
- **Style**: "What best fits your team?" (Fun, Serious, Tough, Friendly)
- **Colors**: "What colors work for your team?" (Team colors, School colors, Custom)
- **Mascot**: "Should your logo include a mascot?" (Yes, No, Text-only)

## Implementation Plan

### Phase 1: AI-Generated Questions with Caching
- Generate question sets on first request using AI
- Cache generated questions in database
- Implement question selection logic with fallbacks
- Build and test core flow

### Phase 2: Multiple Logo Variants
- Generate 2-3 logo variants per team
- Implement variant selection UI
- Add cost tracking per variant
- Test user preference patterns

### Phase 3: Enhanced Features
- Add debug mode for detailed state tracking
- Implement logo regeneration capabilities
- Add analytics and usage patterns
- A/B test different question generation strategies

## Database Schema Decisions

### Multiple Logo Variants
**Decision**: Generate 2-3 logo variants per team from the start
**Rationale**: Users get choice, better user experience, forward-looking design

### AI Question Generation with Caching
**Decision**: Generate question sets on first request, cache for reuse
**Rationale**: Best of both worlds - AI personalization with performance benefits

### Optimized Schema
**Decision**: Build team-specific schema instead of reusing magic-marker
**Rationale**: No compromises, optimal for team logo generation use case

### Debug Mode Feature Flag
**Decision**: Add debug_mode boolean for detailed state tracking
**Rationale**: Useful for development and troubleshooting, can be toggled off in production

## Questions for Further Discussion

1. **Question Set Coverage**: How many team type combinations should we support initially?
2. **Logo Variants**: Should we generate 2 or 3 variants per team?
3. **Question Quality**: How do we ensure AI-generated questions are effective?
4. **User Feedback**: How do we collect data to improve question sets and logo generation?
