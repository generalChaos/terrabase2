# Quick Deployment Guide - Python Image API

## 🚀 **Immediate Deployment (30 minutes)**

### **Step 1: Prepare the Service (5 minutes)**

1. **Navigate to the image processor directory:**
   ```bash
   cd apps/image-processor
   ```

2. **Check current status:**
   ```bash
   # Test if service runs locally
   python src/main.py
   # Should start on http://localhost:8000
   ```

3. **Verify all endpoints work:**
   ```bash
   # Test key endpoints
   curl http://localhost:8000/health
   curl http://localhost:8000/docs
   ```

### **Step 2: Deploy to Railway (10 minutes)**

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize Railway project:**
   ```bash
   railway init
   # Select "Deploy from current directory"
   ```

4. **Set environment variables:**
   ```bash
   railway variables set SUPABASE_URL=your_supabase_url
   railway variables set SUPABASE_KEY=your_supabase_key
   railway variables set API_KEY=your_secure_api_key
   railway variables set CORS_ORIGINS=https://mightyteams.com
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

### **Step 3: Configure Frontend (10 minutes)**

1. **Update environment variables in Next.js:**
   ```bash
   # In apps/mighty-team-designs/.env.local
   NEXT_PUBLIC_IMAGE_PROCESSOR_URL=https://your-app.railway.app/api/v1
   IMAGE_PROCESSOR_API_KEY=your_secure_api_key
   ```

2. **Update API client configuration:**
   ```typescript
   // In apps/mighty-team-designs/lib/config.ts
   const config = {
     imageProcessor: {
       baseUrl: process.env.NEXT_PUBLIC_IMAGE_PROCESSOR_URL || 'http://localhost:8000/api/v1',
       apiKey: process.env.IMAGE_PROCESSOR_API_KEY || '',
       timeout: 30000,
       retries: 3
     }
   }
   ```

3. **Test integration:**
   ```bash
   # Start frontend
   cd apps/mighty-team-designs
   npm run dev
   # Test logo generation flow
   ```

### **Step 4: Verify Deployment (5 minutes)**

1. **Check Railway deployment:**
   - Go to Railway dashboard
   - Verify service is running
   - Check logs for errors

2. **Test API endpoints:**
   ```bash
   # Test health endpoint
   curl https://your-app.railway.app/health
   
   # Test asset generation
   curl -X POST https://your-app.railway.app/api/v1/generate-asset-pack \
     -H "Content-Type: application/json" \
     -d '{"team_name": "Test Team", "sport": "Soccer"}'
   ```

3. **Test frontend integration:**
   - Go to your Next.js app
   - Try the logo generation flow
   - Verify assets are generated

## 🔧 **Quick Fixes for Common Issues**

### **Issue: Service won't start**
```bash
# Check Python version
python --version  # Should be 3.11+

# Install dependencies
pip install -r requirements.txt

# Check environment variables
cat .env
```

### **Issue: CORS errors**
```python
# In src/main.py, update CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **Issue: Database connection errors**
```bash
# Check Supabase credentials
railway variables get SUPABASE_URL
railway variables get SUPABASE_KEY

# Test connection
curl -H "apikey: $SUPABASE_KEY" $SUPABASE_URL/rest/v1/
```

### **Issue: Memory errors**
```bash
# Increase Railway memory limit
railway variables set RAILWAY_MEMORY_LIMIT=2GB
```

## 📊 **Monitoring Setup (Optional)**

### **Basic Health Monitoring**
```python
# Add to src/main.py
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
```

### **Railway Metrics**
- Go to Railway dashboard
- Check "Metrics" tab
- Monitor CPU, Memory, and Network usage

## 🚨 **Emergency Rollback**

If deployment fails:

1. **Revert to previous version:**
   ```bash
   railway rollback
   ```

2. **Or redeploy from specific commit:**
   ```bash
   railway up --detach
   ```

3. **Check logs:**
   ```bash
   railway logs
   ```

## ✅ **Deployment Checklist**

- [ ] Service starts without errors
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] Database connection working
- [ ] Frontend can reach API
- [ ] Asset generation works
- [ ] Error handling in place
- [ ] Monitoring configured

## 🎯 **Next Steps After Deployment**

1. **Set up custom domain** (if needed)
2. **Configure SSL certificates** (Railway handles this)
3. **Set up monitoring alerts**
4. **Test with real user data**
5. **Optimize performance** based on usage

This quick guide gets your Python image API deployed and running in production within 30 minutes!
