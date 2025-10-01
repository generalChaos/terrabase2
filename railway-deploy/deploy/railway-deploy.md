# Railway Deployment Guide

This guide walks you through deploying the Python Image API to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Supabase Project**: Set up a Supabase project for database storage

## Step 1: Connect Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the `apps/image-processor` folder as the root directory

## Step 2: Configure Environment Variables

In the Railway dashboard, go to your service and add these environment variables:

### Required Variables
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Storage Configuration
STORAGE_TYPE=supabase
SUPABASE_ENABLED=true
SUPABASE_REQUESTS_TABLE=processing_requests
SUPABASE_RESULTS_TABLE=processing_results
SUPABASE_ERRORS_TABLE=validation_errors
SUPABASE_METRICS_TABLE=performance_metrics
SUPABASE_CLEANUP_ENABLED=true
SUPABASE_CLEANUP_DAYS=30

# Service Configuration
LOG_LEVEL=INFO
SERVICE_NAME=image-processor
SERVICE_VERSION=1.0.0

# File Validation
MAX_IMAGE_SIZE_BYTES=10485760
MAX_LOGO_SIZE_BYTES=5242880
MAX_BANNER_SIZE_BYTES=15728640
MAX_IMAGE_WIDTH=8192
MAX_IMAGE_HEIGHT=8192
MIN_IMAGE_WIDTH=16
MIN_IMAGE_HEIGHT=16

# CORS (update with your frontend URLs)
CORS_ORIGINS=https://mighty-team-designs.vercel.app,https://mighty-team-designs-git-main-ricovelasco.vercel.app
```

### Optional Variables
```bash
# Redis (if you want to add Redis later)
REDIS_URL=redis://redis:6379

# Model paths (Railway will handle these)
REALESRGAN_MODEL_PATH=/app/models/RealESRGAN_x4plus.pth
ESRGAN_MODEL_PATH=/app/models/RRDB_ESRGAN_x4.pth
```

## Step 3: Deploy

1. Railway will automatically build and deploy your service
2. The build process will:
   - Install Python dependencies
   - Download AI models (Real-ESRGAN, etc.)
   - Set up the FastAPI application
3. Monitor the build logs for any issues

## Step 4: Verify Deployment

1. **Health Check**: Visit `https://your-app.railway.app/health`
2. **API Docs**: Visit `https://your-app.railway.app/docs`
3. **Test Endpoint**: Try a simple request:
   ```bash
   curl https://your-app.railway.app/health
   ```

## Step 5: Set Up Supabase Database

Create these tables in your Supabase database:

### processing_requests
```sql
CREATE TABLE processing_requests (
    id SERIAL PRIMARY KEY,
    request_id TEXT UNIQUE NOT NULL,
    endpoint TEXT NOT NULL,
    image_url TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    client_ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_processing_requests_request_id ON processing_requests(request_id);
CREATE INDEX idx_processing_requests_endpoint ON processing_requests(endpoint);
CREATE INDEX idx_processing_requests_created_at ON processing_requests(created_at);
```

### processing_results
```sql
CREATE TABLE processing_results (
    id SERIAL PRIMARY KEY,
    request_id TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    processing_time_ms INTEGER,
    file_size_bytes INTEGER,
    output_url TEXT,
    error_message TEXT,
    processing_steps TEXT[] DEFAULT '{}',
    endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_processing_results_request_id ON processing_results(request_id);
CREATE INDEX idx_processing_results_success ON processing_results(success);
CREATE INDEX idx_processing_results_endpoint ON processing_results(endpoint);
CREATE INDEX idx_processing_results_created_at ON processing_results(created_at);
```

### validation_errors
```sql
CREATE TABLE validation_errors (
    id SERIAL PRIMARY KEY,
    request_id TEXT NOT NULL,
    field TEXT NOT NULL,
    error_message TEXT NOT NULL,
    value TEXT,
    endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_validation_errors_request_id ON validation_errors(request_id);
CREATE INDEX idx_validation_errors_field ON validation_errors(field);
CREATE INDEX idx_validation_errors_created_at ON validation_errors(created_at);
```

### performance_metrics
```sql
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    request_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT DEFAULT 'ms',
    endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_performance_metrics_request_id ON performance_metrics(request_id);
CREATE INDEX idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_created_at ON performance_metrics(created_at);
```

## Step 6: Update Frontend Configuration

Update your Next.js app's environment variables:

```bash
# .env.local
IMAGE_PROCESSOR_BASE_URL=https://your-app.railway.app/api/v1
IMAGE_PROCESSOR_TIMEOUT=30000
IMAGE_PROCESSOR_RETRIES=3
IMAGE_PROCESSOR_RETRY_DELAY=1000
```

## Step 7: Monitor and Maintain

### Monitoring
- **Railway Dashboard**: Monitor CPU, memory, and logs
- **Supabase Dashboard**: Monitor database usage and performance
- **API Health**: Use `/health` and `/stats` endpoints

### Logs
```bash
# View logs in Railway dashboard
# Or use Railway CLI
railway logs
```

### Statistics
```bash
# Get processing statistics
curl https://your-app.railway.app/api/v1/stats

# Get endpoint-specific stats
curl https://your-app.railway.app/api/v1/stats/endpoint/process-logo/optimized
```

### Cleanup
```bash
# Clean up old records (run periodically)
curl -X POST https://your-app.railway.app/api/v1/cleanup?days=30
```

## Troubleshooting

### Common Issues

1. **Build Fails**: Check Python dependencies and system packages
2. **Memory Issues**: Railway has memory limits; monitor usage
3. **Model Download**: AI models are large; build may take time
4. **CORS Errors**: Update CORS_ORIGINS with your frontend URLs

### Debug Commands

```bash
# Check service status
railway status

# View logs
railway logs --tail

# Connect to service
railway shell

# Restart service
railway redeploy
```

## Scaling

### Railway Scaling Options
- **Vertical**: Upgrade to higher tier for more resources
- **Horizontal**: Railway doesn't support multiple instances yet
- **Database**: Use Supabase for shared state

### Performance Optimization
- Monitor memory usage with large images
- Consider implementing caching
- Use Supabase for shared storage
- Optimize AI model loading

## Cost Estimation

### Railway Pricing
- **Hobby Plan**: $5/month (512MB RAM, 1GB storage)
- **Pro Plan**: $20/month (8GB RAM, 100GB storage)

### Supabase Pricing
- **Free Tier**: 500MB database, 1GB bandwidth
- **Pro Plan**: $25/month (8GB database, 250GB bandwidth)

### Estimated Monthly Cost
- **Development**: ~$5-10/month
- **Production**: ~$25-45/month

## Security Considerations

1. **Environment Variables**: Never commit secrets
2. **CORS**: Restrict to your domains only
3. **Rate Limiting**: Consider implementing rate limits
4. **File Validation**: Already implemented
5. **Database**: Use Supabase RLS policies

## Next Steps

1. **Deploy**: Follow this guide to deploy to Railway
2. **Test**: Verify all endpoints work correctly
3. **Monitor**: Set up monitoring and alerts
4. **Scale**: Monitor usage and scale as needed
5. **Optimize**: Based on real usage patterns
