// New TypeScript interfaces for the hybrid schema
// This file defines the types that match our new database structure

// Image types for the new images table
export type ImageType = 'original' | 'additional' | 'final';

export interface Image {
  id: string;
  analysis_result: string;
  image_type: ImageType;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
}

// Analysis Flow types for the new analysis_flows table
export interface AnalysisFlow {
  id: string;
  session_id: string;
  
  // Image References
  original_image_id: string;
  additional_image_ids: string[];
  final_image_id?: string;
  
  // Image paths (added by API enhancement)
  original_image_path?: string;
  final_image_path?: string;
  
  // Normalized counters
  total_questions: number;
  total_answers: number;
  current_step?: string;
  
  // JSONB data
  questions: Question[];
  answers: QuestionAnswer[];
  context_data: Record<string, unknown>;
  
  // Cost tracking
  total_cost_usd: number;
  total_tokens: number;
  
  // Status
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Question and Answer types (unchanged)
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

// Updated ImageAnalysis interface that combines Image + AnalysisFlow
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

// Prompt Definition interface (updated with sort_order)
export interface PromptDefinition {
  id: string;
  name: string;
  type: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  prompt_text: string;
  model: string;
  response_format: 'json_object' | 'text';
  max_tokens?: number;
  temperature?: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Processing Step interface (updated for new schema)
export interface ProcessingStep {
  id?: string;
  flow_id: string; // Changed from image_id to flow_id
  step_type: 'analysis' | 'questions' | 'image_generation';
  step_order: number;
  prompt_id?: string;
  prompt_content?: string;
  input_data: unknown;
  output_data: unknown;
  response_time_ms: number;
  tokens_used?: number;
  model_used: string;
  success: boolean;
  error_message?: string;
  created_at?: string;
}

// API Response types
export interface UploadResponse {
  success: boolean;
  imageAnalysisId: string;
  questions: Question[];
  error?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  finalImagePath?: string;
  error?: string;
}

export interface ProcessingStatus {
  status: 'uploading' | 'analyzing' | 'generating' | 'completed' | 'error';
  progress: number;
  message: string;
}

// Conversation state for the new schema
export interface ConversationState {
  questions: Question[];
  answers: QuestionAnswer[];
  currentQuestionIndex: number;
  totalQuestions: number;
  totalAnswers: number;
  isComplete: boolean;
  summary?: string;
  contextData: Record<string, unknown>;
}
