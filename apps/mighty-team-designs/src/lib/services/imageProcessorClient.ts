import { config } from '../config'

interface ApiError extends Error {
  status?: number
  endpoint?: string
  retryCount?: number
  isRetryable?: boolean
}

interface UpscaleRequest {
  image_url: string
  scale_factor?: number
  model?: string
}

interface UpscaleResponse {
  success: boolean
  data?: {
    upscaled_url: string
    original_size: { width: number; height: number }
    upscaled_size: { width: number; height: number }
    scale_factor: number
    processing_time_ms: number
  }
  error?: string
}

interface AssetPackRequest {
  logo_url: string
  team_name: string
  sport?: string
  roster?: string[]
}

interface AssetPackResponse {
  success: boolean
  data?: {
    asset_pack_id: string
    assets: {
      clean_logo: string
      tshirt_front: string
      tshirt_back: string
      banner: string
    }
    processing_time_ms: number
  }
  error?: string
}

export class ImageProcessorClient {
  private baseUrl: string
  private apiKey: string
  private timeout: number
  private retries: number
  private retryDelay: number

  constructor() {
    this.baseUrl = config.imageProcessor.baseUrl
    this.apiKey = config.imageProcessor.apiKey
    this.timeout = config.imageProcessor.timeout
    this.retries = config.imageProcessor.retries
    this.retryDelay = config.imageProcessor.retryDelay
  }

  /**
   * Upscale an image using the Python image processor
   */
  async upscaleImage(request: UpscaleRequest): Promise<UpscaleResponse> {
    return this.makeRequest<UpscaleResponse>('/upscale', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Generate an asset pack (logo on shirts, banner, etc.)
   */
  async generateAssetPack(request: AssetPackRequest): Promise<AssetPackResponse> {
    return this.makeRequest<AssetPackResponse>('/asset-pack', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Get service health status
   */
  async getHealth(): Promise<{ status: string; service: string; version: string }> {
    return this.makeRequest<{ status: string; service: string; version: string }>('/health', {
      method: 'GET'
    })
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<{ success: boolean; data: any }> {
    return this.makeRequest<{ success: boolean; data: any }>('/stats', {
      method: 'GET'
    })
  }

  /**
   * Make a request with retry logic and error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        return data as T

      } catch (error) {
        lastError = error as Error
        
        // Don't retry on the last attempt
        if (attempt === this.retries) {
          break
        }

        // Don't retry on non-retryable errors
        if (!this.isRetryableError(error as Error)) {
          break
        }

        // Wait before retrying (exponential backoff with jitter)
        const delay = this.retryDelay * Math.pow(2, attempt) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw this.createApiError(lastError!, endpoint, this.retries)
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    // Network errors, timeouts, and 5xx errors are retryable
    if (error.name === 'AbortError') return true
    if (error.message.includes('fetch')) return true
    if (error.message.includes('timeout')) return true
    if (error.message.includes('HTTP 5')) return true
    return false
  }

  /**
   * Create a standardized API error
   */
  private createApiError(error: Error, endpoint: string, retryCount: number): ApiError {
    const apiError = error as ApiError
    apiError.endpoint = endpoint
    apiError.retryCount = retryCount
    apiError.isRetryable = this.isRetryableError(error)
    return apiError
  }
}

// Export a singleton instance
export const imageProcessorClient = new ImageProcessorClient()
