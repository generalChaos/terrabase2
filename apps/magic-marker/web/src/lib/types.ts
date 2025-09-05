// Re-export new types for backward compatibility
export * from './newTypes';

// Legacy types - these will be gradually replaced
export interface ImageAnalysis {
  id: string;
  originalImagePath: string;
  analysisResult: string;
  questions: Question[];
  answers?: QuestionAnswer[];
  finalImagePath?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // New fields from analysis_flows
  sessionId?: string;
  totalQuestions?: number;
  totalAnswers?: number;
  currentStep?: string;
  totalCostUsd?: number;
  totalTokens?: number;
  isActive?: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice';
  options: string[];
  required: boolean;
}

export interface QuestionAnswer {
  questionId: string;
  answer: string;
}

export interface ImageGenerationRequest {
  imageAnalysisId: string;
  answers: QuestionAnswer[];
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
