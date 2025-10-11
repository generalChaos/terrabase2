interface ServiceConfig {
  imageProcessor: {
    baseUrl: string
    apiKey: string
    timeout: number
    retries: number
    retryDelay: number
  }
  supabase: {
    url: string
    anonKey: string
  }
  storage: {
    type: 'local' | 'supabase'
    localPath: string
    localBaseUrl: string
  }
  app: {
    environment: string
    isDevelopment: boolean
    isProduction: boolean
  }
}

const getServiceConfig = (): ServiceConfig => {
  const environment = process.env.NODE_ENV || 'development'
  const isDevelopment = environment === 'development'
  const isProduction = environment === 'production'
  
  // Environment-specific defaults
  const getImageProcessorUrl = () => {
    if (process.env.IMAGE_PROCESSOR_BASE_URL) {
      return process.env.IMAGE_PROCESSOR_BASE_URL
    }
    // Development uses local server, production uses Railway
    return isDevelopment 
      ? 'http://localhost:8000/api/v1'
      : 'https://image-processor-api-production-106b.up.railway.app/api/v1'
  }

  const getSupabaseUrl = () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return process.env.NEXT_PUBLIC_SUPABASE_URL
    }
    return isDevelopment
      ? 'http://127.0.0.1:54321'
      : 'https://your-project.supabase.co' // This should be set in production
  }

  const getSupabaseAnonKey = () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
    return isDevelopment
      ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      : 'your-production-anon-key' // This should be set in production
  }

  const getStorageConfig = () => {
    const storageType = process.env.STORAGE_TYPE as 'local' | 'supabase' | undefined
    
    // Default: local for development, supabase for production
    const defaultType = isDevelopment ? 'local' : 'supabase'
    const type = storageType || defaultType
    
    return {
      type,
      localPath: process.env.LOCAL_STORAGE_PATH || './storage',
      localBaseUrl: process.env.LOCAL_STORAGE_BASE_URL || 'http://localhost:3000/api/storage'
    }
  }
  
  return {
    imageProcessor: {
      baseUrl: getImageProcessorUrl(),
      apiKey: process.env.IMAGE_PROCESSOR_API_KEY || (isDevelopment ? 'dev-key' : ''),
      timeout: parseInt(process.env.IMAGE_PROCESSOR_TIMEOUT || (isProduction ? '60000' : '30000')),
      retries: parseInt(process.env.IMAGE_PROCESSOR_RETRIES || (isProduction ? '5' : '3')),
      retryDelay: parseInt(process.env.IMAGE_PROCESSOR_RETRY_DELAY || (isProduction ? '2000' : '1000'))
    },
    supabase: {
      url: getSupabaseUrl(),
      anonKey: getSupabaseAnonKey()
    },
    storage: getStorageConfig(),
    app: {
      environment,
      isDevelopment,
      isProduction
    }
  }
}

export const config = getServiceConfig()

// Environment validation
export const validateConfig = () => {
  const errors: string[] = []
  
  // Check required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !config.supabase.url.includes('127.0.0.1')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !config.supabase.anonKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }
  
  if (config.app.isProduction && !process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is required in production')
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation failed:', errors)
    if (config.app.isProduction) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`)
    }
  }
  
  return errors.length === 0
}

// Auto-validate on import in production
if (config.app.isProduction) {
  validateConfig()
}
