# Image Processor API - Deployment Guide

This comprehensive guide covers deploying the Python Image API to various platforms and environments.

## 🚀 **Quick Start**

### Local Development
```bash
# Start the service locally
cd apps/image-processor
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Development
```bash
# Build and run with Docker Compose
cd apps/image-processor
docker-compose up --build
```

### Production Deployment
```bash
# Use the deployment script
cd apps/image-processor/deploy
./deploy.sh full
```

## 📋 **Prerequisites**

### Required
- **Docker** (for containerized deployment)
- **Git** (for code management)
- **Python 3.11+** (for local development)

### Optional
- **Railway CLI** (for Railway deployment)
- **Supabase Account** (for database storage)
- **Domain & SSL** (for production)

## 🏗️ **Deployment Options**

### 1. Railway (Recommended for Production)

**Best for**: Production deployments, easy scaling, managed infrastructure

**Pros**:
- ✅ Easy deployment from GitHub
- ✅ Automatic HTTPS
- ✅ Built-in monitoring
- ✅ Environment variable management
- ✅ Automatic scaling

**Cons**:
- ❌ Limited customization
- ❌ Vendor lock-in
- ❌ Cost for higher tiers

**Deployment Steps**:
1. Follow the [Railway Deployment Guide](deploy/railway-deploy.md)
2. Set up environment variables in Railway dashboard
3. Connect your GitHub repository
4. Deploy automatically

### 2. Docker Compose (Self-Hosted)

**Best for**: VPS deployment, full control, cost-effective

**Pros**:
- ✅ Full control over infrastructure
- ✅ Cost-effective for high usage
- ✅ Customizable configuration
- ✅ No vendor lock-in

**Cons**:
- ❌ Requires server management
- ❌ Manual SSL setup
- ❌ No automatic scaling

**Deployment Steps**:
```bash
# 1. Clone repository
git clone <your-repo>
cd apps/image-processor

# 2. Configure environment
cp env.example .env
# Edit .env with your settings

# 3. Deploy
docker-compose -f deploy/docker-compose.prod.yml up -d

# 4. Verify
curl http://localhost:8000/health
```

### 3. Local Development

**Best for**: Development, testing, debugging

**Setup**:
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set up environment
cp env.example .env
# Edit .env with your settings

# 3. Run the service
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## ⚙️ **Configuration**

### Environment Variables

#### Required Variables
```bash
# Storage Configuration
STORAGE_TYPE=supabase  # or 'local' or 'none'
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Service Configuration
LOG_LEVEL=INFO
SERVICE_NAME=image-processor
SERVICE_VERSION=1.0.0
```

#### Optional Variables
```bash
# File Validation
MAX_IMAGE_SIZE_BYTES=10485760      # 10MB
MAX_LOGO_SIZE_BYTES=5242880        # 5MB
MAX_BANNER_SIZE_BYTES=15728640     # 15MB
MAX_IMAGE_WIDTH=8192
MAX_IMAGE_HEIGHT=8192
MIN_IMAGE_WIDTH=16
MIN_IMAGE_HEIGHT=16

# CORS
CORS_ORIGINS=http://localhost:3000,https://your-domain.com

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Database Setup (Supabase)

If using Supabase storage, create these tables:

```sql
-- See deploy/railway-deploy.md for complete SQL schema
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
-- ... (additional tables)
```

## 🔧 **Deployment Scripts**

### Automated Deployment Script

The `deploy/deploy.sh` script provides easy deployment options:

```bash
# Make executable
chmod +x deploy/deploy.sh

# Show menu
./deploy.sh

# Direct commands
./deploy.sh build          # Build Docker image
./deploy.sh test           # Run tests
./deploy.sh deploy         # Deploy with Docker Compose
./deploy.sh railway        # Deploy to Railway
./deploy.sh health         # Health check
./deploy.sh logs           # Show logs
./deploy.sh stop           # Stop services
./deploy.sh cleanup        # Clean up Docker
./deploy.sh full           # Full deployment (build + test + deploy)
```

### Manual Docker Commands

```bash
# Build image
docker build -t image-processor-api .

# Run container
docker run -p 8000:8000 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_ANON_KEY=your_key \
  image-processor-api

# Run with Docker Compose
docker-compose -f deploy/docker-compose.prod.yml up -d
```

## 📊 **Monitoring & Health Checks**

### Health Endpoints

```bash
# Basic health check
curl http://localhost:8000/health

# Detailed statistics
curl http://localhost:8000/api/v1/stats

# Endpoint-specific stats
curl http://localhost:8000/api/v1/stats/endpoint/process-logo/optimized
```

### Logs

```bash
# Docker Compose logs
docker-compose -f deploy/docker-compose.prod.yml logs -f

# Specific service logs
docker-compose -f deploy/docker-compose.prod.yml logs -f image-processor

# Railway logs
railway logs
```

### Monitoring

- **Health Checks**: `/health` endpoint
- **Metrics**: `/api/v1/stats` endpoints
- **Request Tracking**: Request IDs in logs
- **Error Tracking**: Structured error logging

## 🔒 **Security Considerations**

### Production Security

1. **Environment Variables**: Never commit secrets
2. **CORS**: Restrict to your domains only
3. **Rate Limiting**: Implement rate limits (nginx config included)
4. **File Validation**: Already implemented
5. **Database**: Use Supabase RLS policies
6. **HTTPS**: Always use HTTPS in production
7. **Non-root User**: Docker runs as non-root user

### Nginx Configuration

The included `deploy/nginx.conf` provides:
- Rate limiting (10 req/s general, 2 req/s heavy processing)
- Security headers
- Gzip compression
- Proper timeouts for long processing

## 🚨 **Troubleshooting**

### Common Issues

#### Build Failures
```bash
# Check Docker logs
docker build -t image-processor-api . 2>&1 | tee build.log

# Common fixes:
# - Update requirements.txt
# - Check Python version compatibility
# - Verify system dependencies
```

#### Memory Issues
```bash
# Monitor memory usage
docker stats

# Increase memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
```

#### Database Connection Issues
```bash
# Check Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     https://YOUR_PROJECT.supabase.co/rest/v1/

# Verify environment variables
docker-compose -f deploy/docker-compose.prod.yml config
```

#### CORS Issues
```bash
# Update CORS_ORIGINS in environment
CORS_ORIGINS=https://your-frontend-domain.com,https://your-other-domain.com
```

### Debug Commands

```bash
# Check service status
docker-compose -f deploy/docker-compose.prod.yml ps

# Connect to running container
docker-compose -f deploy/docker-compose.prod.yml exec image-processor bash

# View detailed logs
docker-compose -f deploy/docker-compose.prod.yml logs --tail=100 image-processor

# Restart service
docker-compose -f deploy/docker-compose.prod.yml restart image-processor
```

## 📈 **Scaling & Performance**

### Vertical Scaling

**Railway**:
- Upgrade to higher tier for more resources
- Monitor usage in Railway dashboard

**Docker Compose**:
- Increase memory limits in docker-compose.yml
- Add more CPU cores
- Use more powerful VPS

### Horizontal Scaling

**Railway**: Not supported yet
**Docker Compose**: Use load balancer (nginx) with multiple instances

### Performance Optimization

1. **Caching**: Implement Redis caching
2. **CDN**: Use CDN for static assets
3. **Database**: Optimize Supabase queries
4. **Images**: Optimize image processing pipeline
5. **Monitoring**: Track performance metrics

## 💰 **Cost Estimation**

### Railway
- **Hobby**: $5/month (512MB RAM, 1GB storage)
- **Pro**: $20/month (8GB RAM, 100GB storage)

### VPS (Docker Compose)
- **DigitalOcean**: $12-24/month (2-4GB RAM)
- **Linode**: $10-20/month (2-4GB RAM)
- **AWS EC2**: $15-30/month (t3.small-medium)

### Supabase
- **Free**: 500MB database, 1GB bandwidth
- **Pro**: $25/month (8GB database, 250GB bandwidth)

### Total Monthly Cost
- **Development**: $5-10/month
- **Production (small)**: $25-45/month
- **Production (large)**: $50-100/month

## 🔄 **CI/CD Integration**

### GitHub Actions Example

```yaml
name: Deploy to Railway
on:
  push:
    branches: [main]
    paths: ['apps/image-processor/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railway-app/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: image-processor
```

### Docker Hub Integration

```yaml
name: Build and Push Docker Image
on:
  push:
    branches: [main]
    paths: ['apps/image-processor/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./apps/image-processor
          push: true
          tags: your-username/image-processor:latest
```

## 📚 **Additional Resources**

- [Railway Deployment Guide](deploy/railway-deploy.md)
- [Docker Configuration](Dockerfile)
- [Nginx Configuration](deploy/nginx.conf)
- [Environment Variables](env.example)
- [API Documentation](http://localhost:8000/docs)

## 🆘 **Support**

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review logs: `./deploy.sh logs`
3. Run health check: `./deploy.sh health`
4. Check environment variables
5. Verify database connectivity

For additional help, check the service logs and error messages for specific guidance.
