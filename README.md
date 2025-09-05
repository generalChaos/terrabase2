# Party Game Monorepo

A modern monorepo showcasing full-stack applications with AI integration, real-time multiplayer gaming, and portfolio management. Built with Next.js, Supabase, and OpenAI.

## 🚀 **Live Applications**

### 🌐 [Portal](https://terrabase2.vercel.app) - Portfolio Landing Page
Modern portfolio website showcasing all projects with responsive design and smooth navigation.

- **Frontend**: Next.js + React + TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Status**: ✅ **Live** with comprehensive test suite

### 🎨 [Magic Marker](https://magic-marker-web.vercel.app) - AI Image Analysis & Generation
AI-powered image analysis and generation tool with advanced computer vision capabilities and creative AI features.

- **Frontend**: Next.js + React + TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI**: OpenAI GPT-4o + DALL-E 3
- **Deployment**: Vercel (Full-stack)
- **Status**: ✅ **Live** with comprehensive error handling

### 🎮 Party Game - Real-time Multiplayer Game
Real-time multiplayer party game with WebSocket support, featuring multiple game modes and interactive gameplay experiences.

- **Frontend**: Next.js + React + TypeScript
- **Backend**: NestJS + WebSocket + Prisma
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Real-time
- **Deployment**: Vercel (Frontend) + Railway (Backend)
- **Status**: 🔄 **In Development**

## 🛠️ **Getting Started**

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm 8+** - Install with `npm install -g pnpm`
- **Supabase Account** - [Sign up here](https://supabase.com/)
- **OpenAI API Key** - [Get API key](https://platform.openai.com/api-keys) (for Magic Marker)
- **Git** - [Download here](https://git-scm.com/)

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/party-game.git
cd party-game

# 2. Install dependencies
pnpm install

# 3. Set up environment variables (see below)
# 4. Start development servers
pnpm dev
```

### Environment Setup

#### **1. Supabase Setup**

**Option A: Local Development (Recommended)**
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize and start local Supabase
cd apps/magic-marker/web
supabase init
supabase start

# Apply migrations
supabase db reset
```

**Option B: Cloud Supabase (Production)**
1. Create a new Supabase project at [supabase.com](https://supabase.com/)
2. Get your project URL and anon key from Settings > API
3. Create the required tables (see Database Setup below)

#### **2. Environment Variables**

Create environment files for each application:

```bash
# Magic Marker Web App
touch apps/magic-marker/web/.env.local
```

Add to `apps/magic-marker/web/.env.local`:

**For Local Development:**
```env
# Local Supabase Development Environment
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# OpenAI API Configuration (for server-side API routes)
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Prompt Management Configuration
USE_DATABASE_PROMPTS=true
```

**For Production:**
```env
# Cloud Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI API Configuration (for server-side API routes)
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Prompt Management Configuration
USE_DATABASE_PROMPTS=true
```

```bash
# Portal App (optional - uses defaults)
touch apps/portal/.env.local

# Party Game API
touch apps/party-game/api/.env
# Add: DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
```

#### **3. Database Setup**

**Magic Marker (Supabase):**

**For Local Development:**
```bash
# Apply all migrations (includes all required tables)
cd apps/magic-marker/web
supabase db reset
```

**For Cloud Supabase:**
```sql
-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_image_path TEXT NOT NULL,
  analysis_result TEXT,
  questions JSONB,
  answers JSONB,
  final_image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt_definitions table for AI prompt management
CREATE TABLE IF NOT EXISTS prompt_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(100) NOT NULL,
  prompt_text TEXT NOT NULL,
  input_schema JSONB NOT NULL,
  return_schema JSONB NOT NULL,
  model VARCHAR(100) DEFAULT 'gpt-4o',
  max_tokens INTEGER DEFAULT 4000,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  response_format VARCHAR(50) DEFAULT 'json_object',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analysis_flows table for conversational question flows
CREATE TABLE IF NOT EXISTS analysis_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_image_id UUID REFERENCES images(id),
  session_id VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  total_questions INTEGER DEFAULT 0,
  questions JSONB DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  context_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_flows ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Allow public access" ON images FOR ALL USING (true);
CREATE POLICY "Allow public access" ON prompt_definitions FOR ALL USING (true);
CREATE POLICY "Allow public access" ON analysis_flows FOR ALL USING (true);
```

**Party Game (Supabase):**
```bash
# Run Prisma migrations
cd apps/party-game/api
pnpm prisma migrate deploy
```

#### **4. First-Time Setup**

```bash
# Install all dependencies
pnpm install

# Build shared packages (if any)
pnpm build

# Start development servers
pnpm dev
```

#### **5. Verify Setup**

```bash
# Test Magic Marker
# Should open at http://localhost:3002
# Upload an image to test the full flow

# Test Portal
# Should open at http://localhost:3000

# Test Party Game
# API: http://localhost:3001
# Web: http://localhost:3002
```

### Development

```bash
# Run all projects in development mode
pnpm dev

# Run specific project
pnpm dev:portal          # Portal only (localhost:3000)
pnpm dev:party-game      # Party Game (API + Web)
pnpm dev:magic-marker    # Magic Marker with Supabase (localhost:3002)

# Magic Marker specific commands
pnpm setup:magic-marker  # Setup Magic Marker with local Supabase
pnpm supabase:start      # Start local Supabase
pnpm supabase:stop       # Stop local Supabase
pnpm supabase:status     # Check Supabase status
pnpm supabase:reset      # Reset Supabase database
pnpm supabase:dashboard  # Open Supabase dashboard
```

### Testing

```bash
# Run Magic Marker E2E tests
cd apps/magic-marker/web
pnpm test:e2e

# Run Portal tests
cd apps/portal
pnpm test
pnpm test:e2e

# Run all tests
pnpm test
```

## 📁 **Project Structure**

```
party-game/
├── apps/
│   ├── portal/                    # Portfolio landing page
│   │   ├── src/
│   │   │   ├── app/              # Next.js app directory
│   │   │   ├── lib/              # Configuration and utilities
│   │   │   └── __tests__/        # Unit tests
│   │   ├── tests/
│   │   │   └── e2e/              # End-to-end tests
│   │   └── vercel.json           # Vercel deployment config
│   ├── party-game/
│   │   ├── api/                  # NestJS backend
│   │   │   ├── src/
│   │   │   ├── prisma/           # Database schema & migrations
│   │   │   └── railway.json      # Railway deployment config
│   │   └── web/                  # Next.js frontend
│   │       ├── src/
│   │       └── vercel.json       # Vercel deployment config
│   └── magic-marker/
│       └── web/                  # Next.js full-stack app
│           ├── src/
│           │   ├── app/
│           │   │   ├── api/      # Next.js API routes
│           │   │   └── page.tsx  # Main page
│           │   ├── lib/          # Utilities and services
│           │   └── components/   # React components
│           ├── e2e/              # Playwright E2E tests
│           └── vercel.json       # Vercel deployment config
├── docs/                         # Project documentation
└── scripts/                      # Development scripts
```

## 🚀 **Deployment**

### **Current Deployment Strategy**

**Vercel (Frontend + Magic Marker Full-stack):**
- **Portal**: `https://terrabase2.vercel.app` ✅ **Live**
- **Magic Marker**: `https://magic-marker-web.vercel.app` ✅ **Live**

**Railway (Backend):**
- **Party Game API**: `https://party-game.railway.app` 🔄 **In Development**

**Supabase (Database + Storage + Real-time):**
- **Database**: PostgreSQL with Row Level Security
- **Storage**: File storage for images
- **Real-time**: WebSocket subscriptions (Party Game)

### **Deployment Commands**

```bash
# Deploy Magic Marker to Vercel
cd apps/magic-marker/web
vercel --prod

# Deploy Portal to Vercel
cd apps/portal
vercel --prod

# Deploy Party Game API to Railway
cd apps/party-game/api
railway up
```

### **Environment Configuration**

The applications automatically detect their deployment environment:
- **Development**: Uses localhost URLs
- **Vercel**: Uses Supabase URLs
- **Production**: Uses production Supabase URLs

## 🛠️ **Tech Stack**

### **Frontend Technologies**
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icon library

### **Backend Technologies**
- **Next.js API Routes** - Serverless functions (Magic Marker)
- **NestJS** - Node.js framework (Party Game)
- **Prisma** - Database ORM (Party Game)
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - File storage
  - Row Level Security

### **AI & External Services**
- **OpenAI API** - GPT-4o for image analysis, DALL-E 3 for image generation
- **Supabase** - Database, storage, and real-time features

### **Development & Deployment**
- **Turborepo** - Monorepo build system
- **pnpm** - Package manager
- **Jest** - Unit testing
- **Playwright** - E2E testing
- **Vercel** - Frontend and full-stack hosting
- **Railway** - Backend hosting (Party Game)

## 🧪 **Testing**

### **Test Coverage**

**Magic Marker:**
- ✅ **E2E Tests**: Playwright test suite
  - Upload functionality tests
  - API endpoint tests
  - Full integration tests
  - Error handling tests

**Portal:**
- ✅ **Comprehensive test suite**
  - Unit Tests: 9/9 passing
  - Component Tests: 6/6 passing
  - E2E Tests: 1/1 passing
  - Coverage: 64.28% statements, 72.72% lines

### **Testing Commands**
```bash
# Run Magic Marker E2E tests
cd apps/magic-marker/web
pnpm test:e2e          # Run all tests
pnpm test:e2e:ui       # Run with UI mode
pnpm test:e2e:headed   # Run with browser visible
pnpm test:e2e:debug    # Run in debug mode

# Run Portal tests
cd apps/portal
pnpm test
pnpm test:e2e
```

### **Testing Strategy**
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright (Chrome, Firefox, Safari, Mobile)
- **API Tests**: Direct API endpoint testing
- **Error Handling**: Comprehensive error scenario testing
- **CI/CD Ready**: Automated testing on deployment

## 📚 **Documentation**

### **Application Documentation**
- [Magic Marker Setup Guide](docs/magic-marker-setup.md) - Complete setup and usage guide
- [Supabase Integration Guide](docs/supabase-integration.md) - Database and storage setup
- [Deployment Guide](docs/deployment-guide.md) - Deployment strategies and guides

### **API Documentation**
- [Magic Marker API](docs/magic-marker-api.md) - API routes and endpoints
- [Party Game API](docs/party-game-api.md) - WebSocket and REST API reference

### **Development Documentation**
- [Development Setup](docs/development-setup.md) - Local development guide
- [Testing Guide](docs/testing-guide.md) - Testing strategies and implementation
- [Error Handling](docs/error-handling.md) - Error handling patterns and best practices

## 🔧 **Troubleshooting**

### **Common Issues**

**Port already in use:**
```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

**Supabase connection issues:**
```bash
# Check environment variables
cat apps/magic-marker/web/.env.local

# Verify Supabase project is active
# Check Supabase dashboard for project status
```

**OpenAI API issues:**
```bash
# Check API key is set
echo $OPENAI_API_KEY

# Test API key with curl
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

**Build errors:**
```bash
# Clean and rebuild
rm -rf node_modules
pnpm install
pnpm build
```

**Magic Marker specific issues:**
```bash
# Check if dev server is running
curl http://localhost:3002

# Test API endpoints
curl http://localhost:3002/api/test-openai
curl http://localhost:3002/api/test-errors
```

## 🎯 **Features**

### **Magic Marker**
- ✅ **Image Upload**: Drag & drop or click to upload
- ✅ **AI Analysis**: GPT-4o analyzes images and generates questions
- ✅ **Interactive Questions**: 10 multiple-choice questions per image
- ✅ **AI Image Generation**: DALL-E 3 creates images based on answers
- ✅ **Supabase Storage**: Secure image storage and retrieval
- ✅ **Error Handling**: Comprehensive error handling and user feedback
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **E2E Testing**: Full test coverage with Playwright

### **Portal**
- ✅ **Portfolio Showcase**: Modern, responsive design
- ✅ **Project Links**: Direct links to all applications
- ✅ **Comprehensive Testing**: Unit, component, and E2E tests
- ✅ **Performance Optimized**: Fast loading and smooth animations

### **Party Game** (In Development)
- 🔄 **Real-time Multiplayer**: WebSocket-based gameplay
- 🔄 **Multiple Game Modes**: Various party game types
- 🔄 **Room Management**: Create and join game rooms
- 🔄 **Supabase Integration**: Real-time subscriptions and data persistence

## 🤝 **Contributing**

This is a personal portfolio project, but feel free to explore the code and learn from the implementations.

## 📄 **License**

Private project - All rights reserved.