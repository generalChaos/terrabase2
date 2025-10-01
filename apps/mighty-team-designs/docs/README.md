# Mighty Team Designs - Documentation

## Project Overview
A web application that generates team logos based on a two-round questionnaire system.

## Architecture Decisions

### Question Flow Strategy
**Decision**: Two-round questionnaire system
- **Round 1**: Basic info (Team Name, Sport, Age Group)
- **Round 2**: AI-generated or pregenerated specific questions

**Rationale**: Minimizes back-and-forth while providing targeted questions based on initial input.

### Question Generation Approach
**Decision**: Pregenerated questions for MVP
**Rationale**: Faster response, predictable UX, cost-effective for target audience
**Evolution**: Plan to add AI customization in Phase 2

### Technical Stack
**Decision**: Next.js 15 with API routes
**Rationale**: Consistent with existing magic-marker app, simplified deployment

### Database Strategy
**Decision**: Supabase with optimized schema for team logos
**Approach**: 
- `team_design_flows` - Main flow tracking with multiple logo variants
- `team_logos` - Individual logo variants with generation metadata
- `question_sets` - AI-generated and cached question sets
- `logo_prompts` - Team-specific AI prompts for logo generation
- Supabase Storage for logo files

## User Flow

### Round 1 Questions
1. **Team Name**: Open text field
2. **Sport**: Hybrid dropdown (Soccer, Basketball, Baseball, etc. + "Other" option)
3. **Age Group**: Dropdown (U6, U8, U10, U12, U14, U16, U19, Adult, Mixed Age)

### Round 2 Questions
- **Count**: 3 questions
- **Types**: Mix of multiple choice and open text
- **Default**: Most likely option preselected
- **Generation**: Pregenerated based on Round 1 answers

### Logo Generation
- **Trigger**: Automatic after Round 2 completion
- **Variants**: Generate 2-3 logo options per team
- **Model**: gpt-image-1 (high resolution)
- **Resolution**: 2048x2048+ (4x higher than DALL-E 3)
- **Format**: PNG initially
- **Selection**: Users pick their favorite variant

## Target Audience
- **Youth leagues** (U6-U19)
- **Recreational leagues** (adult)
- **Community rec programs**
- **Tournament teams**
- **Seasonal teams** (parent-run, volunteer coaches)

## Key Features
- **Multiple Logo Variants**: Generate 2-3 options per team
- **AI Question Generation**: Generate and cache question sets
- **Debug Mode**: Feature flag for detailed state tracking
- **Cost Tracking**: Monitor AI generation costs per variant
- **Optimized Schema**: Built specifically for team logo generation
- **Token Optimization**: GPT-4o-mini for questions, gpt-image-1 for logos
- **High Resolution**: 2048x2048+ logo output

## Next Steps
1. Set up Next.js application
2. Create database schema and migrations
3. Implement AI question generation and caching
4. Build logo generation with multiple variants
5. Create UI/UX flow with variant selection

## Implementation Decisions

### Error Handling
- **Retry Strategy**: Retry with max attempts (3 retries)
- **Question Fallback**: Use generic question set if AI generation fails
- **Logo Generation**: Handle failures gracefully, show error to user
- **Scope**: Single logo variant for now (not multiple)

### Question Set Coverage
- **Initial Scope**: 10 combinations
  - Youth Soccer (U8, U10, U12, U14, U16) - 5 combinations
  - Youth Basketball (U10, U12, U14, U16) - 4 combinations  
  - Adult Recreational (all sports) - 1 generic set
- **Generation**: AI-generated on first request, cached for reuse
- **Fallback**: Generic question set for unmatched combinations

### Logo Regeneration
- **Current**: No manual regeneration (only handle failures)
- **Future**: Will add regeneration capabilities later

### UI/UX Flow
- **Progressive Disclosure**: Single page with sections that reveal as user progresses
- **Logo Display**: Single logo variant for now
- **Progress**: Visual progress indicator through the flow

### Testing Strategy
- **Focus**: Unit tests for core functionality
- **Scope**: API routes, question generation, logo generation logic
