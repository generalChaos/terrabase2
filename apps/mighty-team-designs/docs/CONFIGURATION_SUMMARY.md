# Configuration Summary

## 🎯 **Current Setup**

### **Image Processor API**
- **Development**: Local server (`http://localhost:8000/api/v1`)
- **Production**: Railway deployment (`https://image-processor-api-production-106b.up.railway.app/api/v1`)
- **Usage**: Different endpoints for development vs production
- **Local Development**: Run `python src/main.py` in `apps/image-processor/`

### **Supabase Configuration**
- **Development**: Local Supabase (`http://127.0.0.1:54321`)
- **Production**: Production Supabase (needs to be configured)
- **Keys**: Different keys for development vs production

### **Storage Configuration**
- **Development**: Local filesystem (`./storage` directory)
- **Production**: Supabase storage (blob storage)
- **Override**: Can force local or Supabase with `STORAGE_TYPE` environment variable
- **Local API**: Development serves files via `/api/storage/` endpoint

## 🔧 **Environment Variables**

### **Development (.env.local)**
```bash
# Supabase (Local)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Image Processor (Local Development)
IMAGE_PROCESSOR_BASE_URL=http://localhost:8000/api/v1
IMAGE_PROCESSOR_API_KEY=dev-key

# Storage (Local Development)
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./storage
LOCAL_STORAGE_BASE_URL=http://localhost:3000/api/storage

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3003
NODE_ENV=development
```

### **Production (Vercel Environment Variables)**
```bash
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Image Processor (Production Railway)
IMAGE_PROCESSOR_BASE_URL=https://image-processor-api-production-106b.up.railway.app/api/v1
IMAGE_PROCESSOR_API_KEY=your_production_api_key

# Storage (Production Supabase)
STORAGE_TYPE=supabase
# Supabase storage is configured via NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# OpenAI
OPENAI_API_KEY=your_production_openai_key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

## 🚀 **Configuration Logic**

### **Image Processor**
- **Always uses Railway** (no local development server)
- **Environment variable override** available via `IMAGE_PROCESSOR_BASE_URL`
- **Different timeouts/retries** for development vs production

### **Supabase**
- **Development**: Local Supabase instance
- **Production**: Production Supabase project
- **Environment variable override** available

### **Storage**
- **Development**: Local filesystem with API serving
- **Production**: Supabase blob storage
- **Environment variable override** available with `STORAGE_TYPE`

### **Validation**
- **Runtime validation** in production
- **Warnings in development** for missing variables
- **Auto-fallback** to sensible defaults

## 📝 **Setup Instructions**

### **For Development**
1. Copy `env.example` to `.env.local`
2. Start local Supabase: `supabase start`
3. Start local image processor: `cd apps/image-processor && python src/main.py`
4. Start Next.js: `npm run dev`
5. Files will be stored in `./storage` directory and served via `/api/storage/`

### **For Production**
1. Set environment variables in Vercel dashboard
2. Configure production Supabase project
3. Deploy to Vercel

## ⚠️ **Important Notes**

- **Local image processor** - development uses localhost:8000
- **Production image processor** - production uses Railway deployment
- **Local storage** - development uses filesystem, production uses Supabase
- **Supabase keys differ** between development and production
- **Environment validation** runs in production
- **Fallback values** provided for development
- **Storage override** - can force local or Supabase with `STORAGE_TYPE`
