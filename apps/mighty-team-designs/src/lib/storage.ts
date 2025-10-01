import { createClient } from '@supabase/supabase-js'
import { config } from './config'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface StorageFile {
  fileName: string
  filePath: string
  publicUrl: string
  fileSize: number
  mimeType: string
  bucket?: string
}

export interface StorageUploadOptions {
  contentType?: string
  cacheControl?: string
  upsert?: boolean
}

export interface StorageConfig {
  type: 'local' | 'supabase'
  localPath?: string
  supabaseUrl?: string
  supabaseKey?: string
}

class StorageService {
  private config: StorageConfig
  private supabase?: any

  constructor() {
    this.config = this.getStorageConfig()
    
    if (this.config.type === 'supabase' && this.config.supabaseUrl && this.config.supabaseKey) {
      this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey)
    }
  }

  private getStorageConfig(): StorageConfig {
    const isDevelopment = config.app.isDevelopment
    
    // Check for explicit storage type override
    const storageType = process.env.STORAGE_TYPE as 'local' | 'supabase' | undefined
    
    if (storageType === 'local') {
      return {
        type: 'local',
        localPath: process.env.LOCAL_STORAGE_PATH || './storage'
      }
    }
    
    if (storageType === 'supabase') {
      return {
        type: 'supabase',
        supabaseUrl: config.supabase.url,
        supabaseKey: config.supabase.anonKey
      }
    }
    
    // Default behavior: local for development, supabase for production
    if (isDevelopment) {
      return {
        type: 'local',
        localPath: process.env.LOCAL_STORAGE_PATH || './storage'
      }
    }
    
    return {
      type: 'supabase',
      supabaseUrl: config.supabase.url,
      supabaseKey: config.supabase.anonKey
    }
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(
    file: Buffer | Uint8Array,
    fileName: string,
    bucket: string = 'team-logos',
    options: StorageUploadOptions = {}
  ): Promise<StorageFile> {
    const fileId = uuidv4()
    const timestamp = Date.now()
    const extension = path.extname(fileName)
    const baseName = path.basename(fileName, extension)
    const finalFileName = `${baseName}_${timestamp}${extension}`
    const filePath = `${bucket}/${finalFileName}`
    
    if (this.config.type === 'local') {
      return this.uploadToLocal(file, filePath, finalFileName, options)
    } else {
      return this.uploadToSupabase(file, filePath, bucket, finalFileName, options)
    }
  }

  /**
   * Get public URL for a file
   */
  async getPublicUrl(filePath: string, bucket: string = 'team-logos'): Promise<string> {
    if (this.config.type === 'local') {
      return this.getLocalPublicUrl(filePath)
    } else {
      return this.getSupabasePublicUrl(filePath, bucket)
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string, bucket: string = 'team-logos'): Promise<boolean> {
    if (this.config.type === 'local') {
      return this.deleteLocalFile(filePath)
    } else {
      return this.deleteSupabaseFile(filePath, bucket)
    }
  }

  /**
   * List files in a bucket/folder
   */
  async listFiles(bucket: string = 'team-logos', prefix?: string): Promise<StorageFile[]> {
    if (this.config.type === 'local') {
      return this.listLocalFiles(bucket, prefix)
    } else {
      return this.listSupabaseFiles(bucket, prefix)
    }
  }

  // Local storage methods
  private async uploadToLocal(
    file: Buffer | Uint8Array,
    filePath: string,
    fileName: string,
    options: StorageUploadOptions
  ): Promise<StorageFile> {
    const fullPath = path.join(this.config.localPath!, filePath)
    const dir = path.dirname(fullPath)
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true })
    
    // Write file
    await fs.writeFile(fullPath, file)
    
    // Get file stats
    const stats = await fs.stat(fullPath)
    
    return {
      fileName,
      filePath,
      publicUrl: this.getLocalPublicUrl(filePath),
      fileSize: stats.size,
      mimeType: options.contentType || 'application/octet-stream',
      bucket: path.dirname(filePath)
    }
  }

  private getLocalPublicUrl(filePath: string): string {
    const baseUrl = process.env.LOCAL_STORAGE_BASE_URL || 'http://localhost:3000/api/storage'
    return `${baseUrl}/${filePath}`
  }

  private async deleteLocalFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.config.localPath!, filePath)
      await fs.unlink(fullPath)
      return true
    } catch (error) {
      console.error('Error deleting local file:', error)
      return false
    }
  }

  private async listLocalFiles(bucket: string, prefix?: string): Promise<StorageFile[]> {
    try {
      const bucketPath = path.join(this.config.localPath!, bucket)
      const files = await fs.readdir(bucketPath, { withFileTypes: true })
      
      const storageFiles: StorageFile[] = []
      
      for (const file of files) {
        if (file.isFile()) {
          const fileName = file.name
          const filePath = `${bucket}/${fileName}`
          
          if (!prefix || fileName.startsWith(prefix)) {
            const fullPath = path.join(bucketPath, fileName)
            const stats = await fs.stat(fullPath)
            
            storageFiles.push({
              fileName,
              filePath,
              publicUrl: this.getLocalPublicUrl(filePath),
              fileSize: stats.size,
              mimeType: 'application/octet-stream',
              bucket
            })
          }
        }
      }
      
      return storageFiles
    } catch (error) {
      console.error('Error listing local files:', error)
      return []
    }
  }

  // Supabase storage methods
  private async uploadToSupabase(
    file: Buffer | Uint8Array,
    filePath: string,
    bucket: string,
    fileName: string,
    options: StorageUploadOptions
  ): Promise<StorageFile> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized')
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: options.contentType,
        cacheControl: options.cacheControl,
        upsert: options.upsert
      })

    if (error) {
      throw new Error(`Failed to upload to Supabase: ${error.message}`)
    }

    const publicUrl = this.getSupabasePublicUrl(filePath, bucket)

    return {
      fileName,
      filePath,
      publicUrl,
      fileSize: file.length,
      mimeType: options.contentType || 'application/octet-stream',
      bucket
    }
  }

  private getSupabasePublicUrl(filePath: string, bucket: string): string {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized')
    }

    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  private async deleteSupabaseFile(filePath: string, bucket: string): Promise<boolean> {
    if (!this.supabase) {
      return false
    }

    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        console.error('Error deleting Supabase file:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting Supabase file:', error)
      return false
    }
  }

  private async listSupabaseFiles(bucket: string, prefix?: string): Promise<StorageFile[]> {
    if (!this.supabase) {
      return []
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(prefix || '', { limit: 1000 })

      if (error) {
        console.error('Error listing Supabase files:', error)
        return []
      }

      return data.map((file: any) => ({
        fileName: file.name,
        filePath: prefix ? `${prefix}/${file.name}` : file.name,
        publicUrl: this.getSupabasePublicUrl(prefix ? `${prefix}/${file.name}` : file.name, bucket),
        fileSize: file.metadata?.size || 0,
        mimeType: file.metadata?.mimetype || 'application/octet-stream',
        bucket
      }))
    } catch (error) {
      console.error('Error listing Supabase files:', error)
      return []
    }
  }

  /**
   * Get storage configuration info
   */
  getConfig(): StorageConfig {
    return { ...this.config }
  }

  /**
   * Check if storage is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (this.config.type === 'local') {
        // Check if local storage directory exists and is writable
        await fs.access(this.config.localPath!, fs.constants.W_OK)
        return true
      } else {
        // Check Supabase connection
        if (!this.supabase) return false
        const { error } = await this.supabase.storage.listBuckets()
        return !error
      }
    } catch (error) {
      console.error('Storage availability check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const storage = new StorageService()

// Export types
export type { StorageFile, StorageUploadOptions, StorageConfig }
