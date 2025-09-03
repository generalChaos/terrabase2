# Terrabase2 Hybrid Deployment Guide
## Vercel (Frontend) + Railway (Backend)

## 🎯 **Strategy Overview**

### **Frontend (Vercel)**
- **Portal**: Next.js app
- **Party Game Web**: Next.js app  
- **Magic Marker Web**: Vite/React app
- **Cost**: $0/month (free tier)

### **Backend (Railway)**
- **Party Game API**: NestJS API
- **Magic Marker API**: Express API
- **PostgreSQL**: Database
- **Redis**: Caching
- **Cost**: $15/month total

### **Total Cost**: $15/month

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │
│   - Portal      │    │   - Party Game  │
│   - Party Game  │    │     API         │
│   - Magic Marker│    │   - Magic Marker│
│   (Frontend)    │    │     API         │
└─────────────────┘    │   - PostgreSQL  │
         │              │   - Redis       │
         └──────────────┘   └─────────────────┘
```

## 🚀 **Deployment Steps**

### **Phase 1: Deploy Frontend to Vercel**

#### **1. Install Vercel CLI**
```bash
npm i -g vercel
```

#### **2. Deploy Portal**
```bash
cd apps/portal
vercel --prod
```

#### **3. Deploy Party Game Web**
```bash
cd apps/party-game/web
vercel --prod
```

#### **4. Deploy Magic Marker Web**
```bash
cd apps/magic-marker/web
vercel --prod
```

### **Phase 2: Deploy Backend to Railway**

#### **1. Install Railway CLI**
```bash
npm i -g @railway/cli
```

#### **2. Login to Railway**
```bash
railway login
```

#### **3. Deploy Party Game API**
```bash
cd apps/party-game/api
railway up
```

#### **4. Deploy Magic Marker API**
```bash
cd apps/magic-marker/api
railway up
```

#### **5. Setup Database**
```bash
# Create PostgreSQL database
railway add postgresql

# Create Redis instance
railway add redis
```

## 🔧 **Configuration**

### **Environment Variables**

#### **Party Game API (Railway)**
```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
PORT=3001
```

#### **Magic Marker API (Railway)**
```
NODE_ENV=production
DATABASE_PATH=/app/data/magic_marker.db
PORT=3003
```

#### **Portal (Vercel)**
```
NODE_ENV=production
NEXT_PUBLIC_PARTY_GAME_API_URL=https://party-game-api.railway.app
NEXT_PUBLIC_MAGIC_MARKER_API_URL=https://magic-marker-api.railway.app
```

#### **Party Game Web (Vercel)**
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://party-game-api.railway.app
```

#### **Magic Marker Web (Vercel)**
```
NODE_ENV=production
VITE_API_URL=https://magic-marker-api.railway.app
```

## 🌐 **Deployment URLs**

### **Vercel (Frontend)**
- **Portal**: `https://terrabase2.vercel.app`
- **Party Game**: `https://party-game.vercel.app`
- **Magic Marker**: `https://magic-marker.vercel.app`

### **Railway (Backend)**
- **Party Game API**: `https://party-game-api.railway.app`
- **Magic Marker API**: `https://magic-marker-api.railway.app`

## 📊 **Cost Breakdown**

| Service | Platform | Cost | Purpose |
|---------|----------|------|---------|
| Portal | Vercel | Free | Frontend |
| Party Game Web | Vercel | Free | Frontend |
| Magic Marker Web | Vercel | Free | Frontend |
| Party Game API | Railway | $5/month | Backend |
| Magic Marker API | Railway | $5/month | Backend |
| PostgreSQL | Railway | $5/month | Database |
| **Total** | | **$15/month** | **All services** |

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

## 🛠️ **Development Workflow**

### **Local Development**
```bash
# Start infrastructure
pnpm docker:up

# Start all apps
pnpm dev
```

### **Deploy to Production**
```bash
# Deploy frontend
pnpm vercel:deploy:portal
pnpm vercel:deploy:party-game
pnpm vercel:deploy:magic-marker

# Deploy backend
cd apps/party-game/api && railway up
cd apps/magic-marker/api && railway up
```

## 📈 **Scaling Strategy**

### **When to Scale:**
1. **Vercel Limits**: >100GB bandwidth/month
2. **Railway Limits**: >$50/month costs
3. **Performance**: Need global distribution
4. **Features**: Need advanced AWS services

### **Migration Path:**
1. **Keep Vercel**: For static sites
2. **Move APIs**: To AWS ECS
3. **Add Database**: AWS RDS
4. **Use Terraform**: Existing infrastructure

## 🎯 **Benefits**

### **Cost Effective:**
- **Start**: $15/month
- **Scale**: Only when needed
- **No waste**: Pay for what you use

### **Easy Deployment:**
- **Git-based**: Push to deploy
- **Automatic**: CI/CD ready
- **Simple**: No complex setup

### **Performance:**
- **Global CDN**: Vercel edge network
- **Fast APIs**: Railway always warm
- **Reliable**: Both platforms are stable

### **Flexibility:**
- **Mix platforms**: Best of both worlds
- **Easy migration**: When ready for AWS
- **No lock-in**: Can move anytime

## 🚨 **Important Notes**

### **Railway Considerations:**
- **Cold starts**: Minimal (always warm)
- **Timeouts**: No limits
- **Scaling**: Automatic
- **Monitoring**: Built-in

### **Vercel Considerations:**
- **Functions**: 10-second timeout
- **Bandwidth**: 100GB/month free
- **Builds**: 6,000 minutes/month
- **Domains**: Unlimited

### **Database Strategy:**
- **PostgreSQL**: Railway managed
- **Redis**: Railway managed
- **Backups**: Automatic
- **Scaling**: Easy

This hybrid approach gives you the best of both worlds: free frontend hosting with Vercel and reliable backend services with Railway, all for just $15/month!
