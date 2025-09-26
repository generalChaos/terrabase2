# Supabase Setup for Mighty Team Designs

This directory contains the Supabase configuration and migrations for the Mighty Team Designs app.

## Database Schema

The database is designed to support a two-round questionnaire flow for generating team logos:

### Core Tables

- **`team_design_flows`** - Main flow tracking with user sessions
- **`team_logos`** - Generated logo variants and metadata
- **`question_sets`** - Predefined and AI-generated question sets
- **`logo_prompts`** - AI prompts for logo generation
- **`debug_logs`** - Debug information for admin section
- **`system_metrics`** - Performance and usage metrics
- **`error_patterns`** - Error tracking and resolution

### Key Features

- **Anonymous session tracking** via `user_session_id`
- **Progressive disclosure** with step-by-step flow
- **Logo variants** support for multiple options
- **Debug mode** for detailed logging
- **Token optimization** with different models for different tasks
- **High-resolution output** with gpt-image-1

## Local Development

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

### Setup

1. Start local Supabase:
   ```bash
   supabase start
   ```

2. Apply migrations:
   ```bash
   supabase db reset
   ```

3. View local dashboard:
   - Studio: http://localhost:54323
   - API: http://localhost:54321

### Environment Variables

Copy `env.example` to `.env.local` and update with your local Supabase credentials:

```bash
cp env.example .env.local
```

The local Supabase instance will provide:
- `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>`

## Migrations

Migrations are applied in order:

1. **`20240101000000_create_team_design_schema.sql`** - Core tables
2. **`20240101000001_create_indexes.sql`** - Performance indexes
3. **`20240101000002_create_rls_policies.sql`** - Row Level Security
4. **`20240101000003_seed_initial_data.sql`** - Initial question sets and prompts
5. **`20240101000004_create_storage_bucket.sql`** - Logo storage bucket
6. **`20240101000005_create_functions.sql`** - Utility functions

## Storage

Team logos are stored in the `team-logos` bucket with:
- **File size limit**: 10MB
- **Allowed types**: PNG, JPEG, WebP, SVG
- **Public access** for easy display

## Admin Features

The admin section provides:
- **Debug logs** for troubleshooting
- **System metrics** for performance monitoring
- **Error patterns** for issue resolution
- **Question set management** for content updates

## Production Deployment

1. Link to production project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

2. Deploy migrations:
   ```bash
   supabase db push
   ```

3. Update environment variables with production credentials

## Troubleshooting

### Common Issues

1. **Migration fails**: Check for syntax errors in SQL files
2. **RLS policies**: Ensure policies allow necessary operations
3. **Storage bucket**: Verify bucket exists and policies are correct
4. **Functions**: Check function syntax and dependencies

### Debug Mode

Enable debug mode for detailed logging:
```sql
UPDATE team_design_flows 
SET debug_mode = true 
WHERE id = '<flow_id>';
```

### Monitoring

Check system health:
```sql
-- View recent errors
SELECT * FROM error_patterns 
WHERE last_occurrence > NOW() - INTERVAL '1 hour'
ORDER BY last_occurrence DESC;

-- View system metrics
SELECT * FROM system_metrics 
WHERE recorded_at > NOW() - INTERVAL '1 day'
ORDER BY recorded_at DESC;
```
