# Terrabase2 Deployment Guide

## 🚀 **Deployment Overview**

This guide covers the complete deployment strategy for Terrabase2, from development to production.

## 📋 **Deployment Strategy**

### **Current Strategy: Vercel + Railway**
- **Frontend**: Vercel (free tier)
- **Backend**: Railway ($15/month)
- **Total Cost**: $15/month

### **Future Strategy: AWS**
- **Infrastructure**: Terraform-managed AWS
- **Estimated Cost**: $45-100/month
- **When**: When scaling is needed

## 🛠️ **Prerequisites**

### **Required Tools**
```bash
# Install Node.js (v18+)
# Install pnpm
npm install -g pnpm

# Install Vercel CLI
npm install -g vercel

# Install Railway CLI
npm install -g @railway/cli

# Install Docker (for development)
# Install Git
```

### **Required Accounts**
- **GitHub**: Source code repository
- **Vercel**: Frontend hosting
- **Railway**: Backend hosting
- **AWS**: Future infrastructure (optional)

## 🔧 **Development Deployment**

### **Local Development Setup**
```bash
# Clone repository
git clone <repository-url>
cd terrabase2

# Install dependencies
pnpm install

# Setup development environment
pnpm setup:dev

# Start all services
pnpm dev
```

### **Docker Development**
```bash
# Start infrastructure services
pnpm docker:up

# Start applications
pnpm dev

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down
```

## 🌐 **Production Deployment**

### **Phase 1: Frontend Deployment (Vercel)**

#### **1. Deploy Portal**
```bash
cd apps/portal
vercel --prod
```

#### **2. Deploy Party Game Web**
```bash
cd apps/party-game/web
vercel --prod
```

#### **3. Deploy Magic Marker Web**
```bash
cd apps/magic-marker/web
vercel --prod
```

### **Phase 2: Backend Deployment (Railway)**

#### **1. Deploy Party Game API**
```bash
cd apps/party-game/api
railway up
```

#### **2. Deploy Magic Marker API**
```bash
cd apps/magic-marker/api
railway up
```

#### **3. Setup Database**
```bash
# Create PostgreSQL database
railway add postgresql

# Create Redis instance
railway add redis
```

### **Phase 3: Configuration**

#### **Environment Variables**

**Portal (Vercel):**
```
NODE_ENV=production
NEXT_PUBLIC_PARTY_GAME_API_URL=https://party-game-api.railway.app
NEXT_PUBLIC_MAGIC_MARKER_API_URL=https://magic-marker-api.railway.app
```

**Party Game Web (Vercel):**
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://party-game-api.railway.app
```

**Magic Marker Web (Vercel):**
```
NODE_ENV=production
VITE_API_URL=https://magic-marker-api.railway.app
```

**Party Game API (Railway):**
```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
PORT=3001
```

**Magic Marker API (Railway):**
```
NODE_ENV=production
DATABASE_PATH=/app/data/magic_marker.db
PORT=3003
```

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Workflow**
```yaml
name: Deploy Terrabase2
on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install -g vercel
      - run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install -g @railway/cli
      - run: railway up --token ${{ secrets.RAILWAY_TOKEN }}
```

### **Secrets Configuration**
```bash
# GitHub Secrets
VERCEL_TOKEN=your_vercel_token
RAILWAY_TOKEN=your_railway_token
```

## 🌍 **Domain Configuration**

### **Custom Domain Setup**
1. **Purchase Domain**: Register terrabase2.com
2. **Vercel Configuration**: Add domain to Vercel project
3. **DNS Configuration**: Point domain to Vercel
4. **SSL Certificate**: Automatic with Vercel

### **Subdomain Strategy**
- **Portal**: terrabase2.com
- **Party Game**: party-game.terrabase2.com
- **Magic Marker**: magic-marker.terrabase2.com

## 📊 **Deployment URLs**

### **Vercel URLs**
- **Portal**: https://terrabase2.vercel.app
- **Party Game**: https://party-game.vercel.app
- **Magic Marker**: https://magic-marker.vercel.app

### **Railway URLs**
- **Party Game API**: https://party-game-api.railway.app
- **Magic Marker API**: https://magic-marker-api.railway.app

### **Custom Domain URLs**
- **Portal**: https://terrabase2.com
- **Party Game**: https://party-game.terrabase2.com
- **Magic Marker**: https://magic-marker.terrabase2.com

## 🔍 **Deployment Verification**

### **Health Checks**
```bash
# Check Portal
curl https://terrabase2.vercel.app

# Check Party Game API
curl https://party-game-api.railway.app/health

# Check Magic Marker API
curl https://magic-marker-api.railway.app/health
```

### **Functionality Tests**
1. **Portal**: Verify all links work
2. **Party Game**: Test game creation and joining
3. **Magic Marker**: Test image upload and processing

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Check build logs
vercel logs
railway logs

# Local build test
pnpm build
```

#### **Environment Variables**
```bash
# Check Vercel environment variables
vercel env ls

# Check Railway environment variables
railway variables
```

#### **Database Connection**
```bash
# Test database connection
railway connect postgresql
```

### **Rollback Strategy**
```bash
# Vercel rollback
vercel rollback

# Railway rollback
railway rollback
```

## 📈 **Scaling Strategy**

### **When to Scale**
1. **Bandwidth**: >100GB/month (Vercel)
2. **Cost**: >$50/month (Railway)
3. **Performance**: Need global distribution
4. **Features**: Need advanced AWS services

### **Migration to AWS**
```bash
# Initialize Terraform
pnpm infra:init

# Plan infrastructure
pnpm infra:plan

# Deploy infrastructure
pnpm infra:apply
```

## 💰 **Cost Optimization**

### **Current Costs**
- **Vercel**: $0/month (free tier)
- **Railway**: $15/month
- **Total**: $15/month

### **Cost Monitoring**
- **Vercel**: Monitor bandwidth usage
- **Railway**: Monitor resource usage
- **AWS**: Cost alerts and budgets

## 🔒 **Security Considerations**

### **Production Security**
- **HTTPS**: All traffic encrypted
- **Environment Variables**: Secure secret management
- **CORS**: Proper cross-origin configuration
- **Rate Limiting**: API rate limiting

### **Access Control**
- **GitHub**: Repository access control
- **Vercel**: Team access management
- **Railway**: Project access control
- **AWS**: IAM role management

## 📋 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates valid

### **Deployment**
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] Database configured
- [ ] Environment variables set

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Functionality tests passing
- [ ] Performance monitoring active
- [ ] Error tracking configured

---

*This deployment guide will be updated as the deployment strategy evolves.*
