# Environment Setup

## Local Development Setup

### Prerequisites
- Node.js 18+ 
- pnpm 8+
- Supabase CLI
- Git

### Environment Variables

#### Required Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

#### Optional Variables
```bash
# Debug Mode
NEXT_PUBLIC_DEBUG_MODE=true

# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

### Environment File Structure
```
apps/mighty-team-designs/
├── .env.local                 # Local environment variables
├── .env.example              # Example environment file
├── .env.development          # Development environment
├── .env.production           # Production environment
└── .env.test                 # Test environment
```

## Supabase Local Setup

### 1. Initialize Supabase
```bash
cd apps/mighty-team-designs
supabase init
```

### 2. Start Local Supabase
```bash
supabase start
```

### 3. Get Local Credentials
```bash
supabase status
```

### 4. Create Database Schema
```bash
# Run migrations
supabase db reset

# Or apply specific migration
supabase db push
```

### 5. Set Up Storage
```bash
# Create storage bucket
supabase storage create team-logos

# Set up RLS policies
supabase db push
```

## Database Schema Migration

### 1. Create Migration Files
```bash
# Create initial schema
supabase migration new create_team_design_schema

# Create question sets
supabase migration new create_question_sets

# Create logo prompts
supabase migration new create_logo_prompts
```

### 2. Migration File Structure
```
supabase/migrations/
├── 20240101000000_create_team_design_schema.sql
├── 20240101000001_create_question_sets.sql
├── 20240101000002_create_logo_prompts.sql
└── 20240101000003_seed_initial_data.sql
```

## Development Workflow

### 1. Start Development Server
```bash
# Start Supabase
supabase start

# Start Next.js
pnpm dev
```

### 2. Database Management
```bash
# View database
supabase db diff

# Reset database
supabase db reset

# View logs
supabase logs
```

### 3. Testing
```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Production Environment

### Environment Variables
```bash
# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# OpenAI Production
OPENAI_API_KEY=your_production_openai_key

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Storage bucket created
- [ ] RLS policies enabled
- [ ] API keys secured
- [ ] Error monitoring enabled

## Security Considerations

### API Key Management
- **Never commit** API keys to version control
- **Use environment variables** for all secrets
- **Rotate keys** regularly
- **Monitor usage** for unusual activity

### Database Security
- **Enable RLS** on all tables
- **Use service role key** only on server-side
- **Validate all inputs** before database operations
- **Log all database access** for monitoring

### Network Security
- **Use HTTPS** in production
- **Validate CORS** settings
- **Rate limit** API endpoints
- **Monitor** for suspicious activity

## Troubleshooting

### Common Issues

#### Supabase Connection Failed
```bash
# Check if Supabase is running
supabase status

# Restart Supabase
supabase stop
supabase start
```

#### Environment Variables Not Loading
```bash
# Check .env.local file exists
ls -la .env.local

# Restart development server
pnpm dev
```

#### Database Migration Failed
```bash
# Check migration status
supabase migration list

# Reset and retry
supabase db reset
```

#### OpenAI API Errors
```bash
# Check API key
echo $OPENAI_API_KEY

# Test API connection
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

## Development Tools

### Recommended VS Code Extensions
- **Supabase** - Database management
- **Tailwind CSS IntelliSense** - CSS autocomplete
- **ES7+ React/Redux/React-Native snippets** - React shortcuts
- **TypeScript Importer** - Auto imports
- **Prettier** - Code formatting
- **ESLint** - Code linting
