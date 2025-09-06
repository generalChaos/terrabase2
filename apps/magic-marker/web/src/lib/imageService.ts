// ImageService - Handles operations on the new images table
import { supabase } from '@/lib/supabase';
import { Image, ImageType } from './newTypes';

// Re-export types for external use
export type { Image, ImageType };

export class ImageService {
  /**
   * Create a new image record
   */
  static async createImage(
    analysisResult: string,
    imageType: ImageType,
    filePath: string,
    fileSize?: number,
    mimeType?: string
  ): Promise<Image> {
    console.log('🖼️ [ImageService] Creating image record:', {
      imageType,
      filePath: filePath.substring(0, 50) + '...',
      fileSize,
      mimeType
    });

    const { data, error } = await supabase
      .from('images')
      .insert({
        analysis_result: analysisResult,
        image_type: imageType,
        file_path: filePath,
        file_size: fileSize,
        mime_type: mimeType
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [ImageService] Error creating image:', error);
      throw new Error(`Failed to create image: ${error.message}`);
    }

    console.log('✅ [ImageService] Image created successfully:', data.id);
    return data;
  }

  /**
   * Get image by ID
   */
  static async getImage(imageId: string): Promise<Image | null> {
    console.log('🔍 [ImageService] Getting image:', imageId.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ [ImageService] Image not found');
        return null;
      }
      console.error('❌ [ImageService] Error getting image:', error);
      return null;
    }

    console.log('✅ [ImageService] Image found:', {
      id: data.id,
      type: data.image_type,
      filePath: data.file_path.substring(0, 50) + '...'
    });

    return data;
  }

  /**
   * Get all images of a specific type
   */
  static async getImagesByType(imageType: ImageType): Promise<Image[]> {
    console.log('🔍 [ImageService] Getting images by type:', imageType);

    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('image_type', imageType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [ImageService] Error getting images by type:', error);
      return [];
    }

    console.log('✅ [ImageService] Found images:', data.length);
    return data || [];
  }

  /**
   * Update image analysis result
   */
  static async updateAnalysisResult(
    imageId: string,
    analysisResult: string
  ): Promise<Image> {
    console.log('🔄 [ImageService] Updating analysis result:', imageId.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('images')
      .update({
        analysis_result: analysisResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', imageId)
      .select()
      .single();

    if (error) {
      console.error('❌ [ImageService] Error updating analysis result:', error);
      throw new Error(`Failed to update analysis result: ${error.message}`);
    }

    console.log('✅ [ImageService] Analysis result updated successfully');
    return data;
  }

  /**
   * Delete image
   */
  static async deleteImage(imageId: string): Promise<void> {
    console.log('🗑️ [ImageService] Deleting image:', imageId.substring(0, 8) + '...');

    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('❌ [ImageService] Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }

    console.log('✅ [ImageService] Image deleted successfully');
  }

  /**
   * Get all images (for admin/listing purposes)
   */
  static async getAllImages(): Promise<Image[]> {
    console.log('🔍 [ImageService] Getting all images');

    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [ImageService] Error getting all images:', error);
      return [];
    }

    console.log('✅ [ImageService] Found images:', data.length);
    return data || [];
  }
}
