# Quick Start Guide

Get the Image Processor API running in 5 minutes!

## 🚀 **Railway Deployment (Recommended)**

### 1. Prerequisites
- GitHub repository with your code
- Railway account ([railway.app](https://railway.app))
- Supabase account ([supabase.com](https://supabase.com))

### 2. Deploy to Railway
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to `apps/image-processor`
5. Add environment variables (see below)
6. Deploy! 🎉

### 3. Environment Variables
Add these in Railway dashboard:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
STORAGE_TYPE=supabase
CORS_ORIGINS=https://your-frontend-domain.com
```

### 4. Set Up Database
Run this SQL in your Supabase SQL editor:
```sql
-- See deploy/railway-deploy.md for complete schema
CREATE TABLE processing_requests (
    id SERIAL PRIMARY KEY,
    request_id TEXT UNIQUE NOT NULL,
    endpoint TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Test
```bash
curl https://your-app.railway.app/health
```

## 🐳 **Docker Deployment**

### 1. Quick Start
```bash
cd apps/image-processor
cp env.example .env
# Edit .env with your settings
docker-compose up --build
```

### 2. Test
```bash
curl http://localhost:8000/health
```

## 🛠️ **Local Development**

### 1. Install Dependencies
```bash
cd apps/image-processor
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp env.example .env
# Edit .env with your settings
```

### 3. Run
```bash
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Test
```bash
curl http://localhost:8000/health
```

## 📋 **What You Get**

- **Health Check**: `/health`
- **API Docs**: `/docs`
- **Logo Processing**: `/api/v1/process-logo/optimized`
- **Asset Pack Generation**: `/api/v1/generate-asset-pack`
- **Banner Generation**: `/api/v1/generate-roster-banner`
- **Statistics**: `/api/v1/stats`

## 🔧 **Configuration Options**

### Storage Types
- `local` - JSONL files (development)
- `supabase` - Database (production)
- `none` - No storage (testing)

### File Limits
- Images: 10MB max
- Logos: 5MB max
- Banners: 15MB max
- Dimensions: 16px - 8192px

## 🆘 **Need Help?**

1. **Health Check Fails**: Check environment variables
2. **Database Errors**: Verify Supabase connection
3. **CORS Issues**: Update CORS_ORIGINS
4. **Build Fails**: Check Python dependencies

## 📚 **Next Steps**

- Read [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed setup
- Check [DEPLOYMENT_CHECKLIST.md](deploy/DEPLOYMENT_CHECKLIST.md) for production
- Review [STORAGE_CONFIGURATION.md](docs/STORAGE_CONFIGURATION.md) for storage options

## 🎯 **Production Ready Features**

- ✅ Request ID tracking
- ✅ Input validation
- ✅ File size limits
- ✅ Structured logging
- ✅ Health monitoring
- ✅ Error handling
- ✅ Rate limiting (with nginx)
- ✅ Security headers
- ✅ Non-root Docker user

Your Image Processor API is now ready to handle production workloads! 🚀
