# Architecture Overview

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Supabase      │    │   OpenAI API    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Frontend  │ │    │ │  PostgreSQL │ │    │ │   GPT-5     │ │
│ │   (React)   │ │◄──►│ │  Database   │ │    │ │   DALL-E 3  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │  API Routes │ │    │ │   Storage   │ │    │                 │
│ │  (Backend)  │ │◄──►│ │   (Files)   │ │    │                 │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Flow

### 1. Question Generation Flow
```
User Input (Team Name, Sport, Age Group)
    ↓
Check for existing question set
    ↓
If not found: Generate with AI → Cache in database
    ↓
Return question set to user
```

### 2. Logo Generation Flow
```
User completes Round 2 questions
    ↓
Generate logo prompt from answers
    ↓
Generate 2-3 logo variants with DALL-E 3
    ↓
Store variants in Supabase Storage
    ↓
Save metadata to team_logos table
    ↓
Return variants to user for selection
```

## Database Schema

### Core Tables
- **`team_design_flows`** - Main flow tracking
- **`team_logos`** - Individual logo variants
- **`question_sets`** - AI-generated question sets
- **`logo_prompts`** - AI prompts for logo generation

### Key Relationships
- `team_design_flows` 1:many `team_logos`
- `question_sets` selected by sport + age_group
- `logo_prompts` used for AI generation

## API Endpoints

### Flow Management
- `POST /api/flows` - Create new team design flow
- `GET /api/flows/[id]` - Get flow status
- `PUT /api/flows/[id]` - Update flow data

### Question Generation
- `GET /api/questions/generate` - Generate questions for team type
- `GET /api/questions/sets` - Get cached question sets

### Logo Generation
- `POST /api/logos/generate` - Generate logo variants
- `GET /api/logos/[id]` - Get logo details
- `PUT /api/logos/[id]/select` - Select preferred variant

## AI Integration

### Question Generation
- **Model**: GPT-5
- **Input**: Team name, sport, age group
- **Output**: 3 targeted questions
- **Caching**: Store in `question_sets` table

### Logo Generation
- **Model**: DALL-E 3
- **Input**: Team info + Round 2 answers
- **Output**: 2-3 logo variants
- **Storage**: Supabase Storage + metadata in `team_logos`

## State Management

### Flow States
- `round1` - User completing basic info
- `round2` - User answering generated questions
- `generating` - AI generating logo variants
- `completed` - User has selected final logo
- `failed` - Generation failed

### Debug Mode
- Feature flag for detailed state tracking
- Additional logging and error details
- Development and troubleshooting aid

## Performance Considerations

### Caching Strategy
- Question sets cached after first generation
- Logo variants stored in Supabase Storage
- Database queries optimized with indexes

### Cost Management
- Track AI generation costs per variant
- Monitor usage patterns
- Implement rate limiting if needed

## Security

### Row Level Security (RLS)
- Public read access for question sets
- Public read access for generated logos
- Public create/update access for flows

### API Security
- Environment variables for API keys
- Input validation on all endpoints
- Error handling without sensitive data exposure

## Deployment

### Next.js App
- Deploy to Vercel
- Environment variables for Supabase and OpenAI
- Automatic deployments from main branch

### Database
- Supabase hosted PostgreSQL
- Automatic backups and scaling
- Real-time capabilities available

### Storage
- Supabase Storage for logo files
- CDN for fast image delivery
- Automatic cleanup of old files
