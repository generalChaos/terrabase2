// Magic Marker Web - Isolated Types
export interface ImageAnalysis {
  id: string;
  originalImagePath: string;
  analysisResult: string;
  questions: Question[];
  answers?: QuestionAnswer[];
  finalImagePath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice';
  options: string[];
  required: boolean;
}

export interface ImageGenerationRequest {
  imageAnalysisId: string;
  answers: QuestionAnswer[];
}

export interface QuestionAnswer {
  questionId: string;
  answer: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  finalImagePath?: string;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  imageAnalysisId: string;
  questions: Question[];
  error?: string;
}

export interface ProcessingStatus {
  status: 'uploading' | 'analyzing' | 'generating' | 'completed' | 'error';
  progress: number;
  message: string;
}
