'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AdminLayout from '@/components/AdminLayout';
// import { PromptType, PromptTypeMap } from '@/lib/promptTypes' // Unused for now;

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface ConversationState {
  questions: Question[];
  answers: Record<string, string>;
  currentQuestionIndex: number;
  isComplete: boolean;
  summary?: string;
}

interface PromptDefinition {
  id: string;
  name: string;
  type: string;
  active: boolean;
  prompt_text: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  return_schema: Record<string, unknown>;
  model: string;
  response_format: string;
  max_tokens?: number;
  temperature?: number;
  sort_order: number;
}

interface TestResult {
  success: boolean;
  response?: Record<string, unknown>;
  error?: string;
  executionTime?: number;
  tokensUsed?: number;
}

export default function PromptTesterPage() {
  const [prompts, setPrompts] = useState<PromptDefinition[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptDefinition | null>(null);
  const [inputData, setInputData] = useState<string>('{}');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Individual input fields
  const [inputFields, setInputFields] = useState<Record<string, unknown>>({});
  
  // Conversational Q&A state
  const [conversationState, setConversationState] = useState<ConversationState>({
    questions: [],
    answers: {},
    currentQuestionIndex: 0,
    isComplete: false,
    summary: undefined
  });
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  // Helper function to determine current conversation step
  const getCurrentStep = (conversationState: ConversationState) => {
    const totalQuestions = conversationState.questions.length;
    const stepNames = ['Mood', 'Colors', 'Style', 'Lighting', 'Composition', 'Elements'];
    
    if (conversationState.isComplete) {
      return { step: 'Complete', stepNumber: 7, totalSteps: 6 };
    }
    
    return {
      step: stepNames[totalQuestions] || 'Unknown',
      stepNumber: totalQuestions + 1,
      totalSteps: 6
    };
  };

  // Load prompts on mount
  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setIsLoadingPrompts(true);
      const response = await fetch('/api/admin/prompt-definitions');
      const data = await response.json();
      // Only show active prompts and sort by sort_order
      const activePrompts = (data.prompts || [])
        .filter((prompt: PromptDefinition) => prompt.active)
        .sort((a: PromptDefinition, b: PromptDefinition) => a.sort_order - b.sort_order);
      setPrompts(activePrompts);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const handlePromptSelect = (prompt: PromptDefinition) => {
    setSelectedPrompt(prompt);
    setTestResult(null);
    setUploadedImage(null);
    
    // Generate sample input based on the prompt type
    const sampleInput = generateSampleInput(prompt.type);
    setInputData(JSON.stringify(sampleInput, null, 2));
    
    // Initialize input fields with sample data
    setInputFields(sampleInput);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.size, file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      console.log('Data URL generated, length:', dataUrl.length);
      
      // Extract base64 part from data URL (remove "data:image/...;base64," prefix)
      const base64 = dataUrl.split(',')[1];
      console.log('Base64 extracted, length:', base64.length);
      
      setUploadedImage(dataUrl); // Keep full data URL for preview
      
      // Update input fields with the base64 image (without data URL prefix)
      if (selectedPrompt) {
        setInputFields(prev => ({
          ...prev,
          image: base64
        }));
        console.log('Input fields updated with base64 image');
      } else {
        console.log('No selected prompt, cannot update input fields');
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
    };
    
    reader.readAsDataURL(file);
  };

  const handleInputFieldChange = (fieldName: string, value: unknown) => {
    const newFields = { ...inputFields, [fieldName]: value };
    setInputFields(newFields);
    setInputData(JSON.stringify(newFields, null, 2));
  };

  const generateSampleInput = (promptType: string): Record<string, unknown> => {
    // Use a placeholder that indicates a real image should be uploaded
    const imagePlaceholder = 'PLACEHOLDER_FOR_REAL_IMAGE';
    
    const samples: Record<string, Record<string, unknown>> = {
      'image_analysis': {
        image: imagePlaceholder,
        prompt: 'Describe what you see in this image, focusing on colors, composition, and artistic style.'
      },
      'questions_generation': {
        prompt: 'This is a test image showing a beautiful landscape with mountains and a lake at sunset. The composition is well-balanced with warm colors and dramatic lighting.'
      },
      'image_generation': {
        prompt: 'A beautiful landscape with mountains and a lake at sunset, in a happy and bright style'
      },
      'text_processing': {
        prompt: 'This is a test text to process. Please analyze it and provide insights.'
      },
      'conversational_question': {
        prompt: 'I want to create an image. Help me discover my artistic preferences through a fun conversation.'
      }
    };

    return samples[promptType] || {};
  };

  const runTest = async () => {
    if (!selectedPrompt) return;

    try {
      setIsLoading(true);
      setTestResult(null);

      const startTime = Date.now();
      
      const response = await fetch('/api/test-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptName: selectedPrompt.name,
          input: inputFields
        })
      });

      const executionTime = Date.now() - startTime;
      const result = await response.json();

      setTestResult({
        success: result.success,
        response: result.response,
        error: result.error,
        executionTime,
        tokensUsed: result.tokensUsed
      });

      // If this is a conversational question and we got questions back, update conversation state
      if (selectedPrompt.type === 'conversational_question' && result.success && result.response) {
        const { questions, done, summary } = result.response;
        if (questions && Array.isArray(questions)) {
          setConversationState(prev => ({
            ...prev,
            questions: [...prev.questions, ...questions],
            isComplete: done || false,
            summary: summary || prev.summary
          }));
        }
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateNextQuestion = async () => {
    if (!selectedPrompt || selectedPrompt.type !== 'conversational_question') return;

    try {
      setIsGeneratingQuestion(true);
      
      // Build conversation context from current state
      const conversationContext = {
        questions: conversationState.questions,
        previousAnswers: Object.values(conversationState.answers),
        artisticDirection: conversationState.summary || 'Discovering artistic preferences'
      };

      const response = await fetch('/api/test-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptName: selectedPrompt.name,
          input: {
            prompt: `Continue the conversation. Previous context: ${JSON.stringify(conversationContext)}`
          }
        })
      });

      const result = await response.json();

      if (result.success && result.response) {
        const { questions, done, summary } = result.response;
        if (questions && Array.isArray(questions)) {
          setConversationState(prev => ({
            ...prev,
            questions: [...prev.questions, ...questions],
            isComplete: done || false,
            summary: summary || prev.summary
          }));
        }
      }
    } catch (error) {
      console.error('Failed to generate next question:', error);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setConversationState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer
      },
      currentQuestionIndex: prev.currentQuestionIndex + 1
    }));
  };

  const resetConversation = () => {
    setConversationState({
      questions: [],
      answers: {},
      currentQuestionIndex: 0,
      isComplete: false,
      summary: undefined
    });
    setTestResult(null);
  };

  const validateInput = (): string[] => {
    if (!selectedPrompt) return [];

    const input = inputFields;
    const schema = selectedPrompt.input_schema;
    const errors: string[] = [];

    // Basic validation for required fields
    if (schema.type === 'object' && schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in input)) {
          errors.push(`Missing required field: ${field}`);
        } else if (input[field] === null || input[field] === undefined || input[field] === '') {
          errors.push(`Required field '${field}' cannot be empty`);
        }
      }
    }

    // Validate specific field types based on schema
    if (schema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        if (input[fieldName] !== undefined) {
          const fieldValue = input[fieldName];
          const fieldDef = fieldSchema as Record<string, unknown>;
          
          // String validation
          if (fieldDef.type === 'string') {
            if (typeof fieldValue !== 'string') {
              errors.push(`Field '${fieldName}' must be a string`);
            } else if (fieldDef.minLength && typeof fieldDef.minLength === 'number' && fieldValue.length < fieldDef.minLength) {
              errors.push(`Field '${fieldName}' must be at least ${fieldDef.minLength} characters`);
            }
          }
          
          // Array validation
          if (fieldDef.type === 'array') {
            if (!Array.isArray(fieldValue)) {
              errors.push(`Field '${fieldName}' must be an array`);
            } else if (fieldDef.minItems && typeof fieldDef.minItems === 'number' && fieldValue.length < fieldDef.minItems) {
              errors.push(`Field '${fieldName}' must have at least ${fieldDef.minItems} items`);
            }
          }
        }
      }
    }

    // Check for placeholder images (only if no image was uploaded)
    if (input.image && typeof input.image === 'string' && input.image.includes('PLACEHOLDER_FOR_REAL_IMAGE') && !uploadedImage) {
      errors.push('Please upload an image or replace the placeholder with actual base64 image data');
    }
    
    // Validate base64 format if image is provided
    if (input.image && typeof input.image === 'string' && !input.image.includes('PLACEHOLDER_FOR_REAL_IMAGE')) {
      // Check if it looks like base64 (alphanumeric characters, +, /, =)
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(input.image)) {
        errors.push('Image data appears to be invalid base64 format');
      }
    }

    return errors;
  };

  const inputErrors = validateInput();

  if (isLoadingPrompts) {
    return (
      <AdminLayout 
        title="Prompt Tester" 
        description="Test and debug AI prompts with real inputs and outputs"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-900">Loading prompts...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Prompt Tester" 
      description="Test and debug AI prompts with real inputs and outputs"
    >
      <div className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Prompt Selection and Input */}
          <div className="space-y-6">
            {/* Prompt Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Select Prompt</h2>
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handlePromptSelect(prompt)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedPrompt?.id === prompt.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{prompt.name}</div>
                        <div className="text-sm text-gray-500">{prompt.type}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          prompt.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {prompt.active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-gray-500">#{prompt.sort_order}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Data */}
            {selectedPrompt && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Input Data</h2>
                <div className="space-y-4">

                  {/* Individual Input Fields */}
                  {selectedPrompt && selectedPrompt.input_schema && selectedPrompt.input_schema.properties ? (
                    <div className="space-y-4">
                      {Object.entries(selectedPrompt.input_schema.properties).map(([fieldName, fieldSchema]) => {
                        const fieldDef = fieldSchema as Record<string, unknown>;
                        const fieldValue = String(inputFields[fieldName] || '');
                        const isRequired = Array.isArray(selectedPrompt.input_schema.required) && selectedPrompt.input_schema.required.includes(fieldName);
                        
                        return (
                          <div key={fieldName}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {fieldName}
                              {isRequired && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            
                            {fieldDef.type === 'string' && fieldName === 'image' ? (
                              <div className="space-y-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {uploadedImage && (
                                  <div className="mt-2">
                                    <Image 
                                      src={uploadedImage} 
                                      alt="Uploaded" 
                                      width={300}
                                      height={128}
                                      className="max-w-xs max-h-32 object-contain border rounded"
                                    />
                                    <p className="text-xs text-green-600 mt-1">✓ Image uploaded successfully</p>
                                  </div>
                                )}
                                <div className="text-xs text-gray-500">
                                  Or paste base64 data directly:
                                </div>
                                <textarea
                                  value={String(fieldValue)}
                                  onChange={(e) => handleInputFieldChange(fieldName, e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded text-xs text-gray-900 bg-white"
                                  placeholder="Paste base64 image data here..."
                                  rows={2}
                                />
                              </div>
                            ) : fieldDef.type === 'string' ? (
                              <textarea
                                value={String(fieldValue)}
                                onChange={(e) => handleInputFieldChange(fieldName, e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                                placeholder={`Enter ${String(fieldName)}...`}
                                rows={fieldName === 'prompt' ? 3 : 1}
                              />
                            ) : null}
                            
                            {fieldDef.type === 'array' && (
                              <div className="space-y-2">
                                <textarea
                                  value={Array.isArray(fieldValue) ? JSON.stringify(fieldValue, null, 2) : ''}
                                  onChange={(e) => {
                                    try {
                                      const parsed = JSON.parse(e.target.value);
                                      handleInputFieldChange(fieldName, parsed);
                                    } catch {
                                      // Keep the text as is if it's not valid JSON yet
                                    }
                                  }}
                                  className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm text-gray-900 bg-white"
                                  placeholder={`Enter ${String(fieldName)} as JSON array...`}
                                  rows={4}
                                />
                                <p className="text-xs text-gray-500">
                                  Enter as JSON array format: [&quot;item1&quot;, &quot;item2&quot;, ...]
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Raw JSON View (Collapsible) */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      View Raw JSON
                    </summary>
                    <div className="mt-2">
                      <textarea
                        value={inputData}
                        onChange={(e) => setInputData(e.target.value)}
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-xs text-gray-900 bg-gray-50"
                        placeholder="Raw JSON will be generated automatically..."
                      />
                    </div>
                  </details>

                  {inputErrors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      {inputErrors.map((error, index) => (
                        <div key={index}>• {error}</div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        const sample = generateSampleInput(selectedPrompt.type);
                        setInputData(JSON.stringify(sample, null, 2));
                        setInputFields(sample);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                      title="Load pre-filled sample data for testing this prompt type"
                    >
                      Load Sample Data
                    </button>
                    {inputFields.image && typeof inputFields.image === 'string' && inputFields.image.includes('PLACEHOLDER_FOR_REAL_IMAGE') && !uploadedImage ? (
                      <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        ⚠️ Upload an image or replace PLACEHOLDER_FOR_REAL_IMAGE with base64 data
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Schema and Results */}
          <div className="space-y-6">
            {/* Schema Information */}
            {selectedPrompt && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Schema Information</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Input Schema</h3>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32 text-gray-800">
                      {JSON.stringify(selectedPrompt.input_schema, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Output Schema</h3>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32 text-gray-800">
                      {JSON.stringify(selectedPrompt.output_schema, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Return Schema (Sent to AI)</h3>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32 text-gray-800">
                      {JSON.stringify(selectedPrompt.return_schema, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Test Results */}
            <div className="bg-white rounded-lg shadow p-6" data-test-results>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
                <button
                  onClick={runTest}
                  disabled={!selectedPrompt || isLoading || inputErrors.length > 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Testing...' : 'Run Test'}
                </button>
              </div>

              {testResult && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      testResult.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {testResult.success ? 'Success' : 'Failed'}
                    </span>
                    {testResult.executionTime && (
                      <span className="text-sm text-gray-600">
                        {testResult.executionTime}ms
                      </span>
                    )}
                    {testResult.tokensUsed && (
                      <span className="text-sm text-gray-600">
                        {testResult.tokensUsed} tokens
                      </span>
                    )}
                    {selectedPrompt?.type === 'conversational_question' && (
                      (() => {
                        const currentStep = getCurrentStep(conversationState);
                        return (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            Step {currentStep.stepNumber}/{currentStep.totalSteps}: {currentStep.step}
                          </span>
                        );
                      })()
                    )}
                  </div>

                  {testResult.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-800 mb-2">Error</h3>
                      <pre className="text-sm text-red-700 whitespace-pre-wrap">
                        {testResult.error}
                      </pre>
                    </div>
                  )}

                  {testResult.response && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-800 mb-2">Response</h3>
                      
                      {/* Check if response contains base64 image */}
                      {testResult.response.image_base64 ? (
                        <div className="mb-4">
                          <h4 className="font-medium text-green-700 mb-2">Generated Image:</h4>
                          <Image 
                            src={`data:image/png;base64,${testResult.response.image_base64}`}
                            alt="Generated image"
                            width={400}
                            height={256}
                            className="max-w-full h-auto max-h-64 border border-gray-300 rounded"
                          />
                        </div>
                      ) : null}
                      
                      <pre className="text-sm text-green-700 whitespace-pre-wrap overflow-auto max-h-64">
                        {JSON.stringify(testResult.response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {!testResult && selectedPrompt && (
                <div className="text-gray-500 text-center py-8">
                  Click &quot;Run Test&quot; to test the selected prompt
                </div>
              )}
            </div>

            {/* Conversational Q&A UI */}
            {selectedPrompt?.type === 'conversational_question' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Conversational Q&A Flow</h2>
                    {(() => {
                      const currentStep = getCurrentStep(conversationState);
                      return (
                        <div className="mt-1 text-sm text-gray-600">
                          Current Step: <span className="font-medium text-blue-600">{currentStep.step}</span> 
                          ({currentStep.stepNumber}/{currentStep.totalSteps})
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={resetConversation}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Reset
                    </button>
                    {!conversationState.isComplete && conversationState.questions.length > 0 && (
                      <button
                        onClick={generateNextQuestion}
                        disabled={isGeneratingQuestion}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {isGeneratingQuestion ? 'Generating...' : 'Next Question'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step-by-step Instructions */}
                {conversationState.questions.length === 0 && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-3">How to Test the Conversational Flow:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                      <li><strong>Click &quot;Run Test&quot;</strong> to start the conversation with the AI</li>
                      <li><strong>Answer each question</strong> by clicking on one of the provided options</li>
                      <li><strong>Click &quot;Next Question&quot;</strong> to generate follow-up questions based on your answers</li>
                      <li><strong>Watch the conversation evolve</strong> as the AI learns about your preferences</li>
                      <li><strong>See the summary</strong> when the AI decides the conversation is complete</li>
                    </ol>
                    <div className="mt-3 p-3 bg-blue-100 rounded text-xs text-blue-800">
                      💡 <strong>Tip:</strong> The AI will ask 3-5 questions to understand your artistic preferences, then provide a summary of what it learned.
                    </div>
                  </div>
                )}

                {/* Conversation Summary */}
                {conversationState.summary && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Conversation Summary</h3>
                    <p className="text-blue-700">{conversationState.summary}</p>
                  </div>
                )}
                {/* Progress Indicator */}
                {conversationState.questions.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">
                        {Object.keys(conversationState.answers).length} of {conversationState.questions.length} answered
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${conversationState.questions.length > 0 
                            ? (Object.keys(conversationState.answers).length / conversationState.questions.length) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Questions and Answers */}
                <div className="space-y-4">
                  {conversationState.questions.map((question, index) => (
                    <div key={question.id} className={`border rounded-lg p-4 transition-all duration-200 ${
                      conversationState.answers[question.id] 
                        ? 'border-green-200 bg-green-50' 
                        : index === Object.keys(conversationState.answers).length
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-900">
                          Question {index + 1}
                          {index === Object.keys(conversationState.answers).length && !conversationState.answers[question.id] && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Current
                            </span>
                          )}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          conversationState.answers[question.id] 
                            ? 'bg-green-100 text-green-800' 
                            : index === Object.keys(conversationState.answers).length
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {conversationState.answers[question.id] ? 'Answered' : 
                           index === Object.keys(conversationState.answers).length ? 'Current' : 'Pending'}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{question.text}</p>
                      
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            onClick={() => handleAnswerSelect(question.id, option)}
                            disabled={conversationState.answers[question.id] !== undefined}
                            className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                              conversationState.answers[question.id] === option
                                ? 'border-green-500 bg-green-50 text-green-900 shadow-sm'
                                : conversationState.answers[question.id]
                                  ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                                  : index === Object.keys(conversationState.answers).length
                                    ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-900 cursor-pointer'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                                conversationState.answers[question.id] === option
                                  ? 'border-green-500 bg-green-500'
                                  : 'border-gray-300'
                              }`}>
                                {conversationState.answers[question.id] === option && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                              <span className="flex-1">{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* No questions yet */}
                  {conversationState.questions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No questions yet. Click &quot;Run Test&quot; to start the conversation.</p>
                    </div>
                  )}

                  {/* Conversation complete */}
                  {conversationState.isComplete && conversationState.questions.length > 0 && (
                    <div className="text-center py-8 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-green-800">
                        <div className="text-4xl mb-4">🎉</div>
                        <h3 className="font-medium mb-2 text-lg">Conversation Complete!</h3>
                        <p className="mb-4">The AI has gathered enough information about your artistic preferences.</p>
                        <div className="flex justify-center space-x-3">
                          <button
                            onClick={resetConversation}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Start New Conversation
                          </button>
                          <button
                            onClick={() => {
                              // Scroll to test results
                              const resultsElement = document.querySelector('[data-test-results]');
                              resultsElement?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View Test Results
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Conversation Stats */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{conversationState.questions.length}</div>
                      <div className="text-sm text-gray-600">Questions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{Object.keys(conversationState.answers).length}</div>
                      <div className="text-sm text-gray-600">Answered</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {conversationState.isComplete ? '✓' : '○'}
                      </div>
                      <div className="text-sm text-gray-600">Status</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
