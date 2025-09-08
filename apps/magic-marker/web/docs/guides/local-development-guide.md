# Local Development Guide

Complete guide for setting up Magic Marker with local Supabase development environment.

## 🚀 **Quick Start**

### **1. Prerequisites**

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm 8+** - Install with `npm install -g pnpm`
- **Docker** - [Download here](https://www.docker.com/) (required for local Supabase)
- **Supabase CLI** - Install with `npm install -g supabase`
- **OpenAI API Key** - [Get API key](https://platform.openai.com/api-keys)

### **2. Clone and Install**

```bash
# Clone the repository
git clone https://github.com/yourusername/party-game.git
cd party-game

# Install dependencies
pnpm install
```

### **3. Set Up Local Supabase**

```bash
# Navigate to Magic Marker web app
cd apps/magic-marker/web

# Initialize Supabase project
supabase init

# Start local Supabase services
supabase start

# Apply database migrations
supabase db reset
```

### **4. Configure Environment**

Create `.env.local` file:

```env
# Local Supabase Development Environment
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# OpenAI API Configuration (for server-side API routes)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Prompt Management Configuration
USE_DATABASE_PROMPTS=true
```

### **5. Start Development Server**

```bash
# Start the development server
pnpm dev

# The app will be available at http://localhost:3002
```

## 🗄️ **Local Supabase Management**

### **Starting and Stopping Services**

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Check status
supabase status

# View logs
supabase logs
```

### **Database Management**

```bash
# Reset database (applies all migrations)
supabase db reset

# Apply new migrations
supabase migration up

# Create new migration
supabase migration new migration_name

# View database in browser
supabase dashboard
```

### **Storage Management**

The local Supabase instance automatically creates:
- `images` bucket for file storage
- Public access policies
- CORS configuration

## 🔧 **Development Workflow**

### **1. Making Database Changes**

```bash
# Create a new migration
supabase migration new add_new_table

# Edit the migration file in supabase/migrations/
# Apply the migration
supabase migration up

# Reset database if needed
supabase db reset
```

### **2. Testing API Endpoints**

```bash
# Test image upload
curl -X POST -F "image=@test-image.jpg" http://localhost:3002/api/upload

# Test conversational question generation
curl -X POST http://localhost:3002/api/conversational-question \
  -H "Content-Type: application/json" \
  -d '{"imageAnalysis": "Test analysis", "previousAnswers": [], "conversationContext": {"questions": [], "previousAnswers": []}, "imageId": "test-id"}'

# Test OpenAI connectivity
curl http://localhost:3002/api/debug/test-openai
```

### **3. Debugging**

```bash
# View Supabase logs
supabase logs

# View application logs
pnpm dev

# Check database connection
supabase db ping

# View local dashboard
supabase dashboard
```

## 🧪 **Testing**

### **Run E2E Tests**

```bash
# Install Playwright
npx playwright install

# Run all tests
pnpm test:e2e

# Run with UI mode
pnpm test:e2e:ui

# Run specific test
pnpm test:e2e --grep "upload"
```

### **Test Database Operations**

```bash
# Connect to local database
supabase db shell

# Run SQL queries
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

## 🚀 **Deployment Preparation**

### **1. Test Production Build**

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Test the production build
curl http://localhost:3002
```

### **2. Environment Variables for Production**

Update environment variables for production deployment:

```env
# Production Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Prompt Management Configuration
USE_DATABASE_PROMPTS=true
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Supabase Not Starting**

```bash
# Check Docker is running
docker --version

# Restart Supabase
supabase stop
supabase start

# Check logs
supabase logs
```

#### **2. Database Connection Issues**

```bash
# Check if Supabase is running
supabase status

# Test database connection
supabase db ping

# Reset database
supabase db reset
```

#### **3. Port Already in Use**

```bash
# Kill process on port 3002
lsof -ti:3002 | xargs kill -9

# Or use different port
PORT=3003 pnpm dev
```

#### **4. OpenAI API Errors**

```bash
# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Check environment variables
cat .env.local
```

#### **5. Migration Issues**

```bash
# Reset database and apply all migrations
supabase db reset

# Check migration status
supabase migration list

# Apply specific migration
supabase migration up --target 20240105000000
```

### **Debug Mode**

```bash
# Enable debug logging
DEBUG=* pnpm dev

# Check browser console for client-side errors
# Check terminal for server-side errors
```

## 📊 **Performance Monitoring**

### **Database Performance**

```bash
# View database statistics
supabase dashboard

# Check query performance
# Use the Supabase dashboard SQL editor
```

### **API Performance**

```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3002/api/upload

# Check memory usage
ps aux | grep node
```

## 🔒 **Security Considerations**

### **Local Development**

- Local Supabase uses default credentials (safe for development)
- OpenAI API key should be kept secure
- Never commit `.env.local` to version control

### **Environment Variables**

```bash
# Check if sensitive data is exposed
grep -r "sk-proj" . --exclude-dir=node_modules
grep -r "eyJ" . --exclude-dir=node_modules
```

## 📚 **Additional Resources**

### **Supabase CLI Commands**

```bash
# Help
supabase --help

# Project management
supabase init
supabase start
supabase stop
supabase status

# Database management
supabase db reset
supabase migration new name
supabase migration up
supabase migration down

# Development
supabase dashboard
supabase logs
supabase db shell
```

### **Useful Commands**

```bash
# Clean up Docker containers
docker system prune

# Reset everything
supabase stop
docker system prune
supabase start
supabase db reset
```

---

*This guide is maintained and updated with each release.*
