import { supabase } from '@/lib/supabase'

export interface SimpleImageAnalysis {
  id: string
  originalImagePath: string
  analysisResult: string
  questions: Question[]
  answers?: QuestionAnswer[]
  finalImagePath?: string
  createdAt: Date
  updatedAt: Date
}

export interface Question {
  id: string
  text: string
  options: string[]
  required: boolean
}

export interface QuestionAnswer {
  questionId: string
  answer: string
}

export class SimpleImageService {
  /**
   * Create a new image analysis
   */
  static async createImageAnalysis(
    originalImagePath: string,
    analysisResult: string,
    questions: Question[]
  ): Promise<SimpleImageAnalysis> {
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const { data, error } = await supabase
      .from('images')
      .insert({
        id,
        original_image_path: originalImagePath,
        analysis_result: analysisResult,
        questions: JSON.stringify(questions),
        answers: JSON.stringify([]),
        final_image_path: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create image analysis: ${error.message}`)
    }

    return {
      id: data.id,
      originalImagePath: data.original_image_path,
      analysisResult: data.analysis_result,
      questions: JSON.parse(data.questions),
      answers: data.answers ? JSON.parse(data.answers) : [],
      finalImagePath: data.final_image_path,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  /**
   * Get image analysis by ID
   */
  static async getImageAnalysis(id: string): Promise<SimpleImageAnalysis | null> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get image analysis: ${error.message}`)
    }

    return {
      id: data.id,
      originalImagePath: data.original_image_path,
      analysisResult: data.analysis_result,
      questions: JSON.parse(data.questions),
      answers: data.answers ? JSON.parse(data.answers) : [],
      finalImagePath: data.final_image_path,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  /**
   * Update image analysis with answers
   */
  static async updateImageAnalysis(
    id: string,
    answers: QuestionAnswer[]
  ): Promise<SimpleImageAnalysis> {
    const { data, error } = await supabase
      .from('images')
      .update({
        answers: JSON.stringify(answers),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update image analysis: ${error.message}`)
    }

    return {
      id: data.id,
      originalImagePath: data.original_image_path,
      analysisResult: data.analysis_result,
      questions: JSON.parse(data.questions),
      answers: JSON.parse(data.answers),
      finalImagePath: data.final_image_path,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  /**
   * Set final generated image
   */
  static async setFinalImage(
    id: string,
    finalImagePath: string
  ): Promise<SimpleImageAnalysis> {
    const { data, error } = await supabase
      .from('images')
      .update({
        final_image_path: finalImagePath,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to set final image: ${error.message}`)
    }

    return {
      id: data.id,
      originalImagePath: data.original_image_path,
      analysisResult: data.analysis_result,
      questions: JSON.parse(data.questions),
      answers: data.answers ? JSON.parse(data.answers) : [],
      finalImagePath: data.final_image_path,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  /**
   * Get all image analyses
   */
  static async getAllImageAnalyses(): Promise<SimpleImageAnalysis[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get image analyses: ${error.message}`)
    }

    return data.map(item => ({
      id: item.id,
      originalImagePath: item.original_image_path,
      analysisResult: item.analysis_result,
      questions: JSON.parse(item.questions),
      answers: item.answers ? JSON.parse(item.answers) : [],
      finalImagePath: item.final_image_path,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }))
  }
}
