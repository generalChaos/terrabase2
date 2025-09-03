# Terrabase2 App Documentation

## 📚 **Documentation Overview**

This directory contains comprehensive documentation for the Terrabase2 application portfolio.

## 📁 **Documentation Structure**

```
docs/app/
├── README.md                 # This file
├── dev-log.md               # Development log and decisions
├── architecture.md          # System architecture overview
├── deployment.md            # Deployment guides and strategies
├── api/                     # API documentation
│   ├── party-game.md       # Party Game API docs
│   └── magic-marker.md     # Magic Marker API docs
├── frontend/                # Frontend documentation
│   ├── portal.md           # Portal app docs
│   ├── party-game-web.md   # Party Game frontend docs
│   └── magic-marker-web.md # Magic Marker frontend docs
└── infrastructure/          # Infrastructure documentation
    ├── docker.md           # Containerization guide
    ├── terraform.md        # Infrastructure as code
    └── monitoring.md       # Monitoring and observability
```

## 🎯 **Quick Start**

### **Development**
```bash
# Setup development environment
pnpm setup:dev

# Start all applications
pnpm dev

# Start specific app
pnpm dev:portal
pnpm dev:party-game
pnpm dev:magic-marker
```

### **Deployment**
```bash
# Deploy everything
pnpm deploy:all

# Deploy frontend only
pnpm vercel:deploy:portal
pnpm vercel:deploy:party-game
pnpm vercel:deploy:magic-marker

# Deploy backend only
pnpm railway:deploy:party-game-api
pnpm railway:deploy:magic-marker-api
```

## 🏗️ **Architecture Overview**

### **Applications**
- **Portal**: Portfolio landing page (Next.js)
- **Party Game**: Real-time multiplayer game (NestJS + Next.js)
- **Magic Marker**: AI image generation tool (Express + Vite/React)

### **Infrastructure**
- **Development**: Docker Compose with hot reloading
- **Production**: Vercel (frontend) + Railway (backend)
- **Future**: AWS with Terraform (when scaling needed)

### **Shared Packages**
- **@tb2/shared-types**: Common TypeScript types
- **@tb2/shared-config**: Configuration utilities
- **@tb2/shared-ui**: Reusable UI components
- **@tb2/magic-marker-shared**: Magic Marker specific types

## 📊 **Project Status**

| Component | Status | Environment | URL |
|-----------|--------|-------------|-----|
| Portal | ✅ Ready | Development | http://localhost:3000 |
| Portal | 🔄 Deploying | Production | https://terrabase2.vercel.app |
| Party Game API | ✅ Ready | Development | http://localhost:3001 |
| Party Game API | 🔄 Deploying | Production | https://party-game-api.railway.app |
| Party Game Web | ✅ Ready | Development | http://localhost:3002 |
| Party Game Web | 🔄 Deploying | Production | https://party-game.vercel.app |
| Magic Marker API | ✅ Ready | Development | http://localhost:3003 |
| Magic Marker API | 🔄 Deploying | Production | https://magic-marker-api.railway.app |
| Magic Marker Web | ✅ Ready | Development | http://localhost:3004 |
| Magic Marker Web | 🔄 Deploying | Production | https://magic-marker.vercel.app |

## 🔧 **Development Tools**

### **Package Management**
- **pnpm**: Fast, disk space efficient package manager
- **Turbo**: Monorepo build system and task runner

### **Containerization**
- **Docker**: Development environment consistency
- **Docker Compose**: Multi-service orchestration

### **Infrastructure**
- **Terraform**: Infrastructure as code for AWS
- **Vercel**: Frontend hosting and deployment
- **Railway**: Backend hosting and deployment

## 📈 **Cost Analysis**

### **Current (Vercel + Railway)**
- Frontend: $0/month (Vercel free tier)
- Backend: $15/month (Railway)
- **Total: $15/month**

### **Future (AWS)**
- ECS Fargate: $15/month
- RDS PostgreSQL: $15/month
- ALB: $5/month
- Route 53: $1/month
- ElastiCache: $10/month
- **Total: $46/month**

## 🚀 **Deployment Strategy**

### **Phase 1: Vercel + Railway (Current)**
- Cost-effective for personal projects
- Easy deployment and management
- Good performance and reliability

### **Phase 2: AWS Migration (Future)**
- When scaling is needed
- Enterprise-grade features
- Higher cost but better performance

## 📋 **Getting Started**

1. **Read the dev log**: [dev-log.md](./dev-log.md)
2. **Understand architecture**: [architecture.md](./architecture.md)
3. **Set up development**: [deployment.md](./deployment.md)
4. **Deploy to production**: Follow deployment guides

## 🤝 **Contributing**

This is a personal project, but documentation is maintained for:
- Future reference
- Knowledge sharing
- Best practices documentation
- Decision tracking

## 📞 **Support**

For questions or issues:
- Check the dev log for historical decisions
- Review architecture documentation
- Consult deployment guides
- Check GitHub issues

---

*Last updated: 2024-09-02*
