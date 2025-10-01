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
      apiKey: process.env.IMAGE_PROCESSOR_API_KEY || '',
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
