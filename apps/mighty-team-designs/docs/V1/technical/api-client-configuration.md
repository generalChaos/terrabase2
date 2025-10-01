# API Client Configuration

## 🎯 **Overview**

This document outlines the API client configuration for the Mighty Team Designs app, including environment-based service configuration, retry logic, and error handling.

## 🔧 **Configuration Strategy**

### **Environment-Based Configuration**
Instead of hardcoded development checks, we use environment variables to configure service endpoints and behavior.

### **Configuration Object Approach**
```typescript
// apps/mighty-team-designs/lib/config.ts
interface ServiceConfig {
  imageProcessor: {
    baseUrl: string
    timeout: number
    retries: number
    retryDelay: number
  }
  supabase: {
    url: string
    anonKey: string
  }
  app: {
    environment: string
    isDevelopment: boolean
    isProduction: boolean
  }
}

const getServiceConfig = (): ServiceConfig => {
  const environment = process.env.NODE_ENV || 'development'
  
  return {
    imageProcessor: {
      baseUrl: process.env.IMAGE_PROCESSOR_BASE_URL || 'http://localhost:8000/api/v1',
      timeout: parseInt(process.env.IMAGE_PROCESSOR_TIMEOUT || '30000'),
      retries: parseInt(process.env.IMAGE_PROCESSOR_RETRIES || '3'),
      retryDelay: parseInt(process.env.IMAGE_PROCESSOR_RETRY_DELAY || '1000')
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    },
    app: {
      environment,
      isDevelopment: environment === 'development',
      isProduction: environment === 'production'
    }
  }
}

export const config = getServiceConfig()
```

## 🔄 **API Client Implementation**

### **Base API Client**
```typescript
// apps/mighty-team-designs/lib/apiClient.ts
import { config } from './config'

interface ApiError extends Error {
  status?: number
  endpoint?: string
  retryCount?: number
}

export class ImageProcessorClient {
  private async makeRequest<T>(
    endpoint: string, 
    data: any, 
    retryCount = 0
  ): Promise<T> {
    const url = `${config.imageProcessor.baseUrl}${endpoint}`
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.imageProcessor.timeout)

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'MightyTeamDesigns/1.0'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as ApiError
        error.status = response.status
        error.endpoint = endpoint
        error.retryCount = retryCount
        throw error
      }

      return await response.json()
      
    } catch (error) {
      // Handle retry logic
      if (retryCount < config.imageProcessor.retries) {
        const isRetryableError = this.isRetryableError(error)
        
        if (isRetryableError) {
          console.warn(`Request failed, retrying... (${retryCount + 1}/${config.imageProcessor.retries})`)
          
          // Exponential backoff with jitter
          const delay = config.imageProcessor.retryDelay * Math.pow(2, retryCount) + Math.random() * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          
          return this.makeRequest(endpoint, data, retryCount + 1)
        }
      }
      
      // Log error details
      console.error('Image processor request failed:', {
        endpoint,
        retryCount,
        error: error.message,
        status: (error as ApiError).status
      })
      
      throw error
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx errors
    if (error.name === 'AbortError') return true
    if (error.name === 'TypeError' && error.message.includes('fetch')) return true
    if (error.status >= 500) return true
    if (error.status === 429) return true // Rate limited
    
    return false
  }

  // Public API methods
  async upscaleImage(data: UpscaleRequest) {
    return this.makeRequest<UpscaleResponse>('/upscale', data)
  }

  async generateAssetPack(data: AssetPackRequest) {
    return this.makeRequest<AssetPackResponse>('/generate-asset-pack', data)
  }

  async generateBanner(data: BannerRequest) {
    return this.makeRequest<BannerResponse>('/generate-roster-banner', data)
  }

  async cleanLogo(data: CleanLogoRequest) {
    return this.makeRequest<CleanLogoResponse>('/process-logo/optimized', data)
  }
}

export const imageProcessor = new ImageProcessorClient()
```

## 🔄 **Retry Logic Strategy**

### **Exponential Backoff with Jitter**
```typescript
// Calculate delay with exponential backoff and jitter
const baseDelay = config.imageProcessor.retryDelay
const exponentialDelay = baseDelay * Math.pow(2, retryCount)
const jitter = Math.random() * 1000
const totalDelay = exponentialDelay + jitter

await new Promise(resolve => setTimeout(resolve, totalDelay))
```

### **Retryable Error Types**
- **Network Errors**: Connection failures, DNS resolution issues
- **Timeout Errors**: Request timeouts, AbortError
- **Server Errors**: 5xx status codes
- **Rate Limiting**: 429 status code
- **Temporary Failures**: 502, 503, 504 status codes

### **Non-Retryable Error Types**
- **Client Errors**: 4xx status codes (except 429)
- **Authentication Errors**: 401, 403
- **Validation Errors**: 400, 422
- **Not Found**: 404

## 🛠️ **Error Handling**

### **Error Types**
```typescript
interface ApiError extends Error {
  status?: number
  endpoint?: string
  retryCount?: number
  isRetryable?: boolean
}

interface NetworkError extends ApiError {
  type: 'network'
  originalError: Error
}

interface TimeoutError extends ApiError {
  type: 'timeout'
  timeoutMs: number
}

interface ServerError extends ApiError {
  type: 'server'
  statusCode: number
}
```

### **Error Handling Strategy**
```typescript
private handleError(error: any, endpoint: string, retryCount: number): never {
  // Categorize error
  const errorType = this.categorizeError(error)
  
  // Add context
  const apiError = error as ApiError
  apiError.endpoint = endpoint
  apiError.retryCount = retryCount
  apiError.isRetryable = this.isRetryableError(error)
  
  // Log based on error type
  switch (errorType) {
    case 'network':
      console.error('Network error:', { endpoint, retryCount, error: error.message })
      break
    case 'timeout':
      console.error('Timeout error:', { endpoint, retryCount, timeout: config.imageProcessor.timeout })
      break
    case 'server':
      console.error('Server error:', { endpoint, retryCount, status: error.status })
      break
    default:
      console.error('Unknown error:', { endpoint, retryCount, error: error.message })
  }
  
  throw apiError
}
```

## 🔧 **Environment Variables**

### **Development Environment**
```bash
# .env.local
NODE_ENV=development
IMAGE_PROCESSOR_BASE_URL=http://localhost:8000/api/v1
IMAGE_PROCESSOR_TIMEOUT=30000
IMAGE_PROCESSOR_RETRIES=3
IMAGE_PROCESSOR_RETRY_DELAY=1000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Production Environment**
```bash
# Vercel Environment Variables
NODE_ENV=production
IMAGE_PROCESSOR_BASE_URL=https://your-vercel-app.vercel.app/api/compute
IMAGE_PROCESSOR_TIMEOUT=60000
IMAGE_PROCESSOR_RETRIES=5
IMAGE_PROCESSOR_RETRY_DELAY=2000
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

### **Staging Environment**
```bash
# Staging Environment Variables
NODE_ENV=staging
IMAGE_PROCESSOR_BASE_URL=https://staging-vercel-app.vercel.app/api/compute
IMAGE_PROCESSOR_TIMEOUT=45000
IMAGE_PROCESSOR_RETRIES=4
IMAGE_PROCESSOR_RETRY_DELAY=1500
NEXT_PUBLIC_SUPABASE_URL=your_staging_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_supabase_anon_key
```

## 📊 **Monitoring and Logging**

### **Request Logging**
```typescript
private logRequest(endpoint: string, data: any, retryCount: number) {
  console.log('API Request:', {
    endpoint,
    timestamp: new Date().toISOString(),
    retryCount,
    dataSize: JSON.stringify(data).length
  })
}
```

### **Response Logging**
```typescript
private logResponse(endpoint: string, response: any, duration: number) {
  console.log('API Response:', {
    endpoint,
    timestamp: new Date().toISOString(),
    duration,
    success: response.success,
    processingTime: response.processing_time_ms
  })
}
```

### **Error Logging**
```typescript
private logError(endpoint: string, error: any, retryCount: number) {
  console.error('API Error:', {
    endpoint,
    timestamp: new Date().toISOString(),
    retryCount,
    error: error.message,
    status: error.status,
    stack: error.stack
  })
}
```

## 🚀 **Best Practices**

### **Configuration Management**
1. **Single Source of Truth**: All configuration in one place
2. **Environment-Specific**: Different configs for dev/staging/prod
3. **Type Safety**: TypeScript interfaces for all config
4. **Validation**: Runtime validation of required values

### **Retry Strategy**
1. **Exponential Backoff**: Avoid overwhelming failing services
2. **Jitter**: Prevent thundering herd problems
3. **Max Retries**: Prevent infinite retry loops
4. **Selective Retry**: Only retry appropriate errors

### **Error Handling**
1. **Categorization**: Different handling for different error types
2. **Context**: Include relevant context in error messages
3. **Logging**: Comprehensive logging for debugging
4. **User-Friendly**: Convert technical errors to user messages

### **Performance**
1. **Timeout Management**: Appropriate timeouts for different operations
2. **Connection Pooling**: Reuse connections where possible
3. **Caching**: Cache responses when appropriate
4. **Monitoring**: Track performance metrics

## 🔍 **Testing Strategy**

### **Unit Tests**
```typescript
describe('ImageProcessorClient', () => {
  it('should retry on network errors', async () => {
    // Mock fetch to fail first two times, succeed on third
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) })
    
    global.fetch = mockFetch
    
    const client = new ImageProcessorClient()
    const result = await client.upscaleImage({ image_url: 'test.jpg' })
    
    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})
```

### **Integration Tests**
```typescript
describe('API Integration', () => {
  it('should handle real API calls', async () => {
    const client = new ImageProcessorClient()
    const result = await client.cleanLogo({
      logo_url: 'https://example.com/logo.png',
      team_name: 'Test Team'
    })
    
    expect(result.success).toBe(true)
    expect(result.cleaned_logo_url).toBeDefined()
  })
})
```

## 📈 **Performance Metrics**

### **Key Metrics**
- **Request Duration**: Average time per request
- **Retry Rate**: Percentage of requests that require retries
- **Success Rate**: Percentage of successful requests
- **Error Rate**: Percentage of failed requests
- **Timeout Rate**: Percentage of requests that timeout

### **Monitoring Dashboard**
```typescript
interface PerformanceMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  retriedRequests: number
  averageDuration: number
  p95Duration: number
  p99Duration: number
  errorRate: number
  retryRate: number
}
```

This configuration provides a robust, scalable API client that can handle the complexities of image processing while maintaining excellent user experience!
