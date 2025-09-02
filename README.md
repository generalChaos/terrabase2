# Terrabase2

A personal project portfolio showcasing various applications and tools built with modern web technologies. This monorepo demonstrates full-stack development skills across different tech stacks and deployment strategies.

## 🚀 **Live Applications**

### 🌐 [Portal](https://terrabase2.vercel.app) - Portfolio Landing Page
Modern portfolio website showcasing all projects with responsive design and smooth navigation.

- **Frontend**: Next.js + React + TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Status**: ✅ **Staging Ready** with comprehensive test suite

### 🎮 Party Game - Real-time Multiplayer Game
Real-time multiplayer party game with WebSocket support, featuring multiple game modes and interactive gameplay experiences.

- **Frontend**: Next.js + React + TypeScript
- **Backend**: NestJS + WebSocket + Prisma
- **Database**: PostgreSQL
- **Deployment**: Vercel (Frontend) + Railway (Backend)
- **Status**: 🔄 **In Development**

### 🎨 Magic Marker - AI Image Generation Tool
AI-powered image analysis and generation tool with advanced computer vision capabilities and creative AI features.

- **Frontend**: React + Vite + TypeScript
- **Backend**: Express + Node.js
- **Database**: SQLite
- **Deployment**: Vercel (Frontend) + Railway (Backend)
- **Status**: 🔄 **In Development**

## 🛠️ **Getting Started**

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm 8+** - Install with `npm install -g pnpm`
- **PostgreSQL 16+** - [Download here](https://www.postgresql.org/download/) (for Party Game)
- **Git** - [Download here](https://git-scm.com/)

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/generalChaos/terrabase2.git
cd terrabase2

# 2. Install dependencies
pnpm install

# 3. Build shared packages
pnpm build

# 4. Start development servers
pnpm dev
```

### Detailed Setup Instructions

#### **1. Environment Setup**

```bash
# Verify Node.js version (should be 18+)
node --version

# Verify pnpm installation
pnpm --version

# If pnpm is not installed:
npm install -g pnpm
```

#### **2. Database Setup (Party Game)**

```bash
# Start PostgreSQL service (macOS with Homebrew)
brew services start postgresql

# Create database
createdb party

# Or using psql
psql -U postgres
CREATE DATABASE party;
\q
```

#### **3. Environment Variables**

Create environment files for each application:

```bash
# Portal app (optional - uses defaults)
touch apps/portal/.env.local

# Party Game API
touch apps/party-game/api/.env
# Add: DATABASE_URL="postgresql://username:password@localhost:5432/party"

# Magic Marker API
touch apps/magic-marker/api/.env
# Add: OPENAI_API_KEY="your-openai-api-key"
```

#### **4. First-Time Setup**

```bash
# Install all dependencies
pnpm install

# Build shared packages
pnpm build

# Run database migrations (Party Game)
pnpm migrate:party-game

# Seed database (Party Game)
pnpm seed:party-game
```

#### **5. Verify Setup**

```bash
# Test Portal app
pnpm dev:portal
# Should open at http://localhost:3000

# Test Party Game
pnpm dev:party-game
# API: http://localhost:3001
# Web: http://localhost:3002

# Test Magic Marker
pnpm dev:magic-marker
# API: http://localhost:3003
# Web: http://localhost:3004
```

### Development

```bash
# Run all projects in development mode
pnpm dev

# Run specific project
pnpm dev:portal          # Portal only (localhost:3000)
pnpm dev:party-game      # Party Game (API + Web)
pnpm dev:magic-marker    # Magic Marker (API + Web)
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific app
cd apps/portal && pnpm test
cd apps/portal && pnpm test:e2e

# Run tests with coverage
pnpm test:coverage
```

### Database Setup (Party Game)

```bash
# Run migrations
pnpm migrate:party-game

# Seed database
pnpm seed:party-game
```

### Troubleshooting

#### **Common Issues**

**Port already in use:**
```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**Database connection issues:**
```bash
# Check PostgreSQL status
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql
```

**pnpm install fails:**
```bash
# Clear pnpm cache
pnpm store prune

# Delete node_modules and reinstall
rm -rf node_modules
pnpm install
```

**Build errors:**
```bash
# Clean and rebuild
pnpm clean
pnpm build
```

## 📁 **Project Structure**

```
terrabase2/
├── apps/
│   ├── portal/                    # Portfolio landing page
│   │   ├── src/
│   │   │   ├── app/              # Next.js app directory
│   │   │   ├── lib/              # Configuration and utilities
│   │   │   └── __tests__/        # Unit tests
│   │   ├── tests/
│   │   │   └── e2e/              # End-to-end tests
│   │   ├── public/               # Static assets
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
│       ├── api/                  # Express backend
│       │   ├── src/
│       │   └── railway.json      # Railway deployment config
│       └── web/                  # Vite/React frontend
│           └── src/
├── packages/
│   ├── shared-types/             # Common TypeScript types
│   ├── shared-config/            # Shared configuration
│   ├── shared-ui/                # Shared UI components
│   └── magic-marker-shared/      # Magic Marker specific types
├── docs/                         # Project documentation
│   ├── app/                      # Application documentation
│   ├── api/                      # API documentation
│   └── architecture/             # Architecture documentation
├── infrastructure/               # Infrastructure as Code
│   └── terraform/                # Terraform configurations
└── scripts/                      # Development scripts
```

## 🚀 **Deployment**

### **Current Deployment Strategy**

**Frontend Applications (Vercel):**
- **Portal**: `https://terrabase2.vercel.app` ✅ **Live**
- **Party Game Web**: `https://party-game-web.vercel.app` 🔄 **In Development**
- **Magic Marker Web**: `https://magic-marker-web.vercel.app` 🔄 **In Development**

**Backend Applications (Railway):**
- **Party Game API**: `https://party-game.railway.app` 🔄 **In Development**
- **Magic Marker API**: `https://magic-marker.railway.app` 🔄 **In Development**

### **Deployment Commands**

```bash
# Deploy Portal to Vercel
cd apps/portal
vercel --prod

# Deploy Party Game API to Railway
cd apps/party-game/api
railway up

# Deploy Magic Marker API to Railway
cd apps/magic-marker/api
railway up

# Deploy all applications
pnpm deploy:all
```

### **Environment Configuration**

The applications automatically detect their deployment environment:
- **Development**: Uses localhost URLs
- **Vercel**: Uses Railway API URLs
- **Future AWS**: Uses custom domain URLs

## 🛠️ **Tech Stack**

### **Frontend Technologies**
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Vite** - Fast build tool (Magic Marker)
- **Lucide React** - Icon library

### **Backend Technologies**
- **NestJS** - Node.js framework (Party Game)
- **Express** - Web framework (Magic Marker)
- **Prisma** - Database ORM (Party Game)
- **SQLite** - Embedded database (Magic Marker)
- **PostgreSQL** - Relational database (Party Game)
- **WebSocket** - Real-time communication (Party Game)

### **Development & Deployment**
- **Turborepo** - Monorepo build system
- **pnpm** - Package manager
- **Jest** - Unit testing
- **Playwright** - E2E testing
- **Vercel** - Frontend hosting
- **Railway** - Backend hosting
- **Docker** - Containerization
- **Terraform** - Infrastructure as Code

### **AI & External Services**
- **OpenAI API** - AI image generation (Magic Marker)
- **Socket.io** - WebSocket implementation

## 🧪 **Testing**

### **Test Coverage**
- **Portal App**: ✅ **Comprehensive test suite**
  - Unit Tests: 9/9 passing
  - Component Tests: 6/6 passing
  - E2E Tests: 1/1 passing
  - Coverage: 64.28% statements, 72.72% lines

### **Testing Commands**
```bash
# Run all tests
pnpm test

# Run tests for specific app
cd apps/portal && pnpm test
cd apps/portal && pnpm test:e2e

# Run tests with coverage
pnpm test:coverage

# Run E2E tests with UI
pnpm test:e2e:ui
```

### **Testing Strategy**
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright (Chrome, Firefox, Safari)
- **Coverage**: 60% threshold for personal projects
- **CI/CD Ready**: Automated testing on deployment

## 📚 **Documentation**

### **Application Documentation**
- [App Overview](docs/app/README.md) - Complete application documentation
- [Development Log](docs/app/dev-log.md) - Project history and decisions
- [Architecture](docs/app/architecture.md) - System architecture overview
- [Deployment Guide](docs/app/deployment.md) - Deployment strategies and guides

### **API Documentation**
- [API Overview](docs/app/api/README.md) - Backend API documentation
- [Party Game API](docs/app/api/party-game.md) - Party Game API reference
- [Magic Marker API](docs/app/api/magic-marker.md) - Magic Marker API reference

### **Frontend Documentation**
- [Frontend Overview](docs/app/frontend/README.md) - Frontend applications guide
- [Portal App](docs/app/frontend/portal.md) - Portfolio landing page
- [Portal Testing Strategy](docs/app/frontend/portal-testing-strategy.md) - Testing approach
- [Portal Testing Implementation](docs/app/frontend/portal-testing-implementation.md) - Test implementation details
- [Party Game Web](docs/app/frontend/party-game-web.md) - Game interface
- [Magic Marker Web](docs/app/frontend/magic-marker-web.md) - AI tool interface

### **Deployment Documentation**
- [Staging Deployment Guide](docs/app/deployment/staging-deployment-guide.md) - Complete staging deployment process
- [Vercel Deployment Guide](docs/app/deployment/vercel-deployment-guide.md) - Frontend deployment
- [Railway Deployment Guide](docs/app/deployment/railway-deployment-guide.md) - Backend deployment

### **Infrastructure Documentation**
- [Infrastructure Overview](docs/app/infrastructure/README.md) - Infrastructure components
- [Docker Guide](docs/app/infrastructure/docker.md) - Containerization
- [Terraform Guide](docs/app/infrastructure/terraform.md) - Infrastructure as Code
- [Monitoring Guide](docs/app/infrastructure/monitoring.md) - Observability

### **Legacy Documentation**
- [API Documentation](docs/api/README.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Development Guide](docs/development/contributing.md)
- [Game Logic](docs/games/fibbing-it-game-flow.md)

## Contributing

This is a personal portfolio project, but feel free to explore the code and learn from the implementations.

## License

Private project - All rights reserved.
