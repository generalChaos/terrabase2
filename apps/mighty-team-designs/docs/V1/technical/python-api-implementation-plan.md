# Python Image API - Implementation & Deployment Plan

## 🎯 **Overview**

This document outlines the complete implementation and deployment plan for the Python FastAPI image processing service that powers the Mighty Team Designs app.

## 🏗️ **Current State Analysis**

### **What We Have**
- **Working FastAPI Service**: `apps/image-processor/` with 8+ endpoints
- **Docker Support**: Dockerfile and docker-compose configurations
- **Core Features**: Logo processing, asset generation, banner creation
- **AI Integration**: Background removal, upscaling, image enhancement
- **Database Ready**: Supabase integration configured

### **Current Endpoints**
```python
# Core Image Processing
POST /api/v1/upscale                    # Image upscaling
POST /api/v1/process-logo/optimized     # Logo cleanup with AI
POST /api/v1/remove-background          # AI background removal

# Asset Generation
POST /api/v1/place-logo                 # Logo on t-shirt
POST /api/v1/generate-asset-pack        # Complete asset pack
POST /api/v1/generate-roster-banner     # Team banner with roster

# Web Assets
POST /api/v1/prepare-web-assets         # Web-optimized assets
POST /api/v1/generate-web-assets        # Generate web assets
```

## 🚀 **Implementation Plan**

### **Phase 1: Service Optimization (Week 1)**

#### **1.1 Code Quality & Documentation**
**Tasks:**
- [ ] Add comprehensive API documentation
- [ ] Implement proper error handling and logging
- [ ] Add request/response validation
- [ ] Create health check endpoints
- [ ] Add API versioning strategy

**Code Updates:**
```python
# Enhanced error handling
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "timestamp": datetime.utcnow().isoformat(),
            "path": str(request.url)
        }
    )

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0"
    )
```

#### **1.2 Performance Optimization**
**Tasks:**
- [ ] Implement request caching with Redis
- [ ] Add image processing queue for batch operations
- [ ] Optimize memory usage for large images
- [ ] Add request timeout handling
- [ ] Implement graceful shutdown

**Performance Features:**
```python
# Redis caching for processed images
@cache_result(expire=3600)  # 1 hour cache
async def process_logo_cached(logo_url: str) -> str:
    return await process_logo(logo_url)

# Async processing queue
from celery import Celery
celery_app = Celery('image-processor')

@celery_app.task
async def process_asset_pack_async(team_data: dict):
    # Process asset pack in background
    pass
```

#### **1.3 Security & Validation**
**Tasks:**
- [ ] Add API key authentication
- [ ] Implement rate limiting
- [ ] Add input validation and sanitization
- [ ] Secure file upload handling
- [ ] Add CORS configuration

**Security Implementation:**
```python
# API key authentication
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_api_key(token: str = Depends(security)):
    if token.credentials != os.getenv("API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return token

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/v1/upscale")
@limiter.limit("10/minute")
async def upscale_image(request: Request, data: UpscaleRequest):
    # Process image
    pass
```

### **Phase 2: Production Readiness (Week 2)**

#### **2.1 Environment Configuration**
**Tasks:**
- [ ] Create production environment config
- [ ] Set up environment-specific settings
- [ ] Configure logging for production
- [ ] Add monitoring and metrics
- [ ] Set up error tracking

**Environment Setup:**
```python
# config/settings.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_key: str
    
    # Supabase
    supabase_url: str
    supabase_key: str
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Storage
    temp_dir: str = "/app/temp"
    output_dir: str = "/app/output"
    max_file_size_mb: int = 50
    
    # CORS
    cors_origins: list = ["http://localhost:3000"]
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

#### **2.2 Database Integration**
**Tasks:**
- [ ] Set up Supabase connection
- [ ] Create database models for image processing
- [ ] Implement asset storage and retrieval
- [ ] Add processing history tracking
- [ ] Set up data cleanup jobs

**Database Models:**
```python
# models/database.py
from sqlalchemy import Column, String, DateTime, Text, Integer
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ProcessedImage(Base):
    __tablename__ = "processed_images"
    
    id = Column(String, primary_key=True)
    original_url = Column(String, nullable=False)
    processed_url = Column(String, nullable=False)
    processing_type = Column(String, nullable=False)  # upscale, cleanup, etc.
    parameters = Column(Text)  # JSON string of processing parameters
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
class AssetPack(Base):
    __tablename__ = "asset_packs"
    
    id = Column(String, primary_key=True)
    team_name = Column(String, nullable=False)
    sport = Column(String, nullable=False)
    logo_url = Column(String, nullable=False)
    tshirt_front_url = Column(String)
    tshirt_back_url = Column(String)
    banner_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### **2.3 Monitoring & Observability**
**Tasks:**
- [ ] Add Prometheus metrics
- [ ] Implement health checks
- [ ] Set up logging aggregation
- [ ] Add performance monitoring
- [ ] Create alerting rules

**Monitoring Setup:**
```python
# monitoring/metrics.py
from prometheus_client import Counter, Histogram, generate_latest

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path).inc()
    REQUEST_DURATION.observe(process_time)
    
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

### **Phase 3: Deployment Setup (Week 3)**

#### **3.1 Railway Deployment**
**Tasks:**
- [ ] Set up Railway project
- [ ] Configure environment variables
- [ ] Set up database connections
- [ ] Configure custom domain
- [ ] Set up SSL certificates

**Railway Configuration:**
```yaml
# railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "uvicorn src.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"

[env]
PYTHONPATH = "/app"
LOG_LEVEL = "INFO"
```

**Environment Variables:**
```bash
# Railway Environment Variables
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
API_KEY=your_secure_api_key
REDIS_URL=redis://redis:6379
CORS_ORIGINS=https://mightyteams.com,https://www.mightyteams.com
```

#### **3.2 Docker Optimization**
**Tasks:**
- [ ] Optimize Dockerfile for production
- [ ] Add multi-stage builds
- [ ] Implement proper caching
- [ ] Add security scanning
- [ ] Optimize image size

**Production Dockerfile:**
```dockerfile
# Multi-stage build for production
FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgcc-s1 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY src/ ./src/
COPY .env.example .env

# Create directories
RUN mkdir -p /app/models /app/temp /app/output

# Set environment
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### **3.3 CI/CD Pipeline**
**Tasks:**
- [ ] Set up GitHub Actions
- [ ] Add automated testing
- [ ] Implement deployment automation
- [ ] Add security scanning
- [ ] Set up rollback procedures

**GitHub Actions Workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]
    paths: ['apps/image-processor/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd apps/image-processor
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd apps/image-processor
          pytest

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railwayapp/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: image-processor
```

### **Phase 4: Integration & Testing (Week 4)**

#### **4.1 Frontend Integration**
**Tasks:**
- [ ] Update API client configuration
- [ ] Test all endpoints with frontend
- [ ] Implement error handling
- [ ] Add retry logic
- [ ] Test mobile performance

**API Client Updates:**
```typescript
// lib/apiClient.ts
export class ImageProcessorClient {
  private baseUrl: string;
  private apiKey: string;
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_IMAGE_PROCESSOR_URL || 'http://localhost:8000/api/v1';
    this.apiKey = process.env.IMAGE_PROCESSOR_API_KEY || '';
  }
  
  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async generateAssetPack(data: AssetPackRequest): Promise<AssetPackResponse> {
    return this.makeRequest('/generate-asset-pack', data);
  }
  
  async generateBanner(data: BannerRequest): Promise<BannerResponse> {
    return this.makeRequest('/generate-roster-banner', data);
  }
}
```

#### **4.2 Load Testing**
**Tasks:**
- [ ] Set up load testing with k6 or Artillery
- [ ] Test concurrent image processing
- [ ] Measure response times
- [ ] Test memory usage
- [ ] Validate error handling

**Load Test Script:**
```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 10 },
    { duration: '2m', target: 0 },
  ],
};

export default function() {
  let response = http.post('https://image-processor.railway.app/api/v1/generate-asset-pack', {
    team_name: 'Test Team',
    sport: 'Soccer',
    logo_url: 'https://example.com/logo.png',
    players: [
      { number: 1, name: 'Player 1' },
      { number: 2, name: 'Player 2' }
    ]
  });
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 30s': (r) => r.timings.duration < 30000,
  });
}
```

## 📊 **Deployment Architecture**

### **Production Stack**
```
┌─────────────────────────────────────┐
│           Frontend (Vercel)         │
│        Next.js + Supabase           │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        Python API (Railway)         │
│     FastAPI + Redis + Supabase      │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│         Storage (Supabase)          │
│      PostgreSQL + File Storage      │
└─────────────────────────────────────┘
```

### **Environment Configuration**
```bash
# Development
IMAGE_PROCESSOR_BASE_URL=http://localhost:8000/api/v1
IMAGE_PROCESSOR_API_KEY=dev-key

# Production
IMAGE_PROCESSOR_BASE_URL=https://image-processor.railway.app/api/v1
IMAGE_PROCESSOR_API_KEY=prod-secure-key
```

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security scan completed
- [ ] Performance testing done

### **Deployment**
- [ ] Deploy to Railway
- [ ] Configure custom domain
- [ ] Set up SSL certificates
- [ ] Update DNS records
- [ ] Test all endpoints

### **Post-Deployment**
- [ ] Monitor application health
- [ ] Check error rates
- [ ] Validate performance metrics
- [ ] Test frontend integration
- [ ] Set up alerting

## 📈 **Success Metrics**

### **Performance Targets**
- **Response Time**: < 30 seconds for asset generation
- **Uptime**: > 99.5%
- **Error Rate**: < 1%
- **Concurrent Users**: 100+ simultaneous requests
- **Memory Usage**: < 2GB per instance

### **Business Metrics**
- **Asset Generation Success**: > 95%
- **User Satisfaction**: > 4.5/5
- **Processing Time**: < 5 minutes end-to-end
- **Cost per Request**: < $0.10

## 🔧 **Maintenance & Monitoring**

### **Daily Monitoring**
- Check application health
- Review error logs
- Monitor performance metrics
- Check resource usage

### **Weekly Tasks**
- Review security logs
- Update dependencies
- Check storage usage
- Review cost analysis

### **Monthly Tasks**
- Security audit
- Performance optimization
- Backup verification
- Disaster recovery testing

This implementation plan provides a comprehensive roadmap for deploying and maintaining the Python image processing API in production, ensuring reliability, performance, and scalability for the Mighty Team Designs app.
