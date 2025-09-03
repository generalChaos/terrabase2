# Terrabase2 Vercel Deployment Guide

## 🚀 **Vercel-First Strategy**

### **Why Vercel:**
- **Free Tier**: Generous limits for personal projects
- **Next.js Optimized**: Perfect for our React apps
- **Easy Deployment**: Git-based, automatic deployments
- **Global CDN**: Fast performance worldwide
- **Zero Configuration**: Works out of the box

### **Cost Breakdown:**
- **Portal**: Free (Vercel)
- **Party Game Web**: Free (Vercel)
- **Magic Marker Web**: Free (Vercel)
- **APIs**: Free (Vercel Functions)
- **Total**: $0/month

## 📋 **Deployment Steps**

### **Step 1: Prepare Repository**
```bash
# Ensure all apps build successfully
pnpm build

# Test locally
pnpm dev
```

### **Step 2: Deploy to Vercel**

#### **Option A: Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy Portal
cd apps/portal
vercel --prod

# Deploy Party Game Web
cd ../party-game/web
vercel --prod

# Deploy Magic Marker Web
cd ../../magic-marker/web
vercel --prod
```

#### **Option B: GitHub Integration**
1. Connect GitHub repo to Vercel
2. Set up automatic deployments
3. Configure environment variables

### **Step 3: Configure Environment Variables**

#### **Portal Environment Variables:**
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://party-game-api.vercel.app
```

#### **Party Game Web Environment Variables:**
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://party-game-api.vercel.app
```

#### **Magic Marker Web Environment Variables:**
```
NODE_ENV=production
VITE_API_URL=https://magic-marker-api.vercel.app
```

## 🌐 **Deployment URLs**

### **Vercel URLs:**
- **Portal**: `https://terrabase2.vercel.app`
- **Party Game**: `https://party-game.vercel.app`
- **Magic Marker**: `https://magic-marker.vercel.app`

### **Custom Domain (Optional):**
- **Portal**: `https://terrabase2.com`
- **Party Game**: `https://party-game.terrabase2.com`
- **Magic Marker**: `https://magic-marker.terrabase2.com`

## 🔧 **Vercel Configuration**

### **Project Structure:**
```
terrabase2/
├── apps/
│   ├── portal/
│   │   ├── vercel.json
│   │   └── package.json
│   ├── party-game/
│   │   └── web/
│   │       ├── vercel.json
│   │       └── package.json
│   └── magic-marker/
│       └── web/
│           ├── vercel.json
│           └── package.json
```

### **Build Configuration:**
- **Portal**: Next.js app
- **Party Game Web**: Next.js app
- **Magic Marker Web**: Vite static build

## 📊 **Vercel Free Tier Limits**

### **Bandwidth**: 100GB/month
### **Function Executions**: 100GB-hours/month
### **Build Minutes**: 6,000 minutes/month
### **Domains**: Unlimited custom domains

### **For Personal Projects:**
- **Traffic**: ~10K visitors/month
- **Builds**: ~100 builds/month
- **Functions**: ~1M executions/month

## 🚀 **Deployment Commands**

### **Quick Deploy:**
```bash
# Deploy all apps
pnpm vercel:deploy

# Deploy specific app
pnpm vercel:deploy:portal
pnpm vercel:deploy:party-game
pnpm vercel:deploy:magic-marker
```

### **Custom Scripts (Add to package.json):**
```json
{
  "scripts": {
    "vercel:deploy": "vercel --prod",
    "vercel:deploy:portal": "cd apps/portal && vercel --prod",
    "vercel:deploy:party-game": "cd apps/party-game/web && vercel --prod",
    "vercel:deploy:magic-marker": "cd apps/magic-marker/web && vercel --prod"
  }
}
```

## 🔄 **CI/CD with GitHub Actions**

### **Automatic Deployment:**
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install -g vercel
      - run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 📈 **Scaling Strategy**

### **When to Move to AWS:**
1. **Bandwidth**: >100GB/month
2. **Functions**: >100GB-hours/month
3. **Builds**: >6,000 minutes/month
4. **Revenue**: >$100/month

### **Migration Path:**
1. **Keep Vercel**: For static sites
2. **Move APIs**: To AWS ECS
3. **Add Database**: AWS RDS
4. **Use Terraform**: Existing infrastructure

## 🎯 **Benefits of This Approach**

### **Immediate:**
- **Zero Cost**: Free hosting
- **Fast Deployment**: Minutes, not hours
- **Global CDN**: Fast performance
- **Automatic SSL**: HTTPS included

### **Long-term:**
- **Easy Migration**: When ready for AWS
- **Learning**: Vercel skills are valuable
- **Flexibility**: Can mix and match services
- **Cost Control**: Only pay when needed

## 🚨 **Important Notes**

### **API Limitations:**
- **Vercel Functions**: 10-second timeout
- **Cold Starts**: First request may be slow
- **Database**: Need external service (Railway, PlanetScale)

### **Workarounds:**
- **APIs**: Use Railway for complex APIs
- **Database**: Use Vercel Postgres or external
- **File Storage**: Use Vercel Blob or AWS S3

This Vercel-first approach gives you a professional deployment with zero cost, and you can always migrate to AWS when you actually need the scale!
