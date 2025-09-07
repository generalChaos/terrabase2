'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import CollapsibleDebugSection from '@/components/admin/CollapsibleDebugSection'
import StatusCard from '@/components/admin/StatusCard'
import SchemaPreview from '@/components/admin/SchemaPreview'
import ErrorExplanation from '@/components/admin/ErrorExplanation'
import DebugModeToggle from '@/components/admin/DebugModeToggle'

interface PromptDefinition {
  id: string
  name: string
  type: string
  prompt_text: string
  input_schema: Record<string, unknown>
  output_schema: Record<string, unknown>
  model: string
  response_format: string
  max_tokens?: number
  temperature?: number
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}


// Component for editing prompt text
function EditPromptText({ prompt, onSave, onCancel, saving }: {
  prompt: PromptDefinition
  onSave: (promptText: string) => void
  onCancel: () => void
  saving: boolean
}) {
  const [promptText, setPromptText] = useState('')
  
  useEffect(() => {
    setPromptText(prompt.prompt_text)
  }, [prompt])
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prompt Text (Use placeholders like {`{image}`}, {`{text}`}, {`{context}`}, {`{instructions}`})
        </label>
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          placeholder="Enter prompt text with placeholders..."
        />
      </div>
      
      {/* Placeholder Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <h5 className="text-sm font-medium text-blue-800 mb-2">Available Placeholders:</h5>
        <div className="text-xs text-blue-700 space-y-1">
          <div><code className="bg-blue-100 px-1 rounded">{`{image}`}</code> - Base64 encoded image</div>
          <div><code className="bg-blue-100 px-1 rounded">{`{text}`}</code> - Text input</div>
          <div><code className="bg-blue-100 px-1 rounded">{`{context}`}</code> - Additional context</div>
          <div><code className="bg-blue-100 px-1 rounded">{`{instructions}`}</code> - Specific instructions</div>
          <div><code className="bg-blue-100 px-1 rounded">{`{analysis}`}</code> - Analysis result</div>
          <div><code className="bg-blue-100 px-1 rounded">{`{previousAnswers}`}</code> - Previous answers</div>
          <div><code className="bg-blue-100 px-1 rounded">{`{conversationContext}`}</code> - Conversation context</div>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={() => onSave(promptText)}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// Get step number for a prompt based on sort_order
const getStepNumber = (prompt: PromptDefinition): number => {
  return prompt.sort_order
}

// Get step description - unused for now
// const getStepDescription = (promptName: string): string => {
//   const descriptions = {
//     'image_analysis': 'Analyze uploaded image',
//     'questions_generation': 'Generate questions from analysis',
//     'text_processing': 'Process text (utility)',
// Removed deprecated prompt types
//   }
//   return descriptions[promptName as keyof typeof descriptions] || 'Unknown step'
// }

export default function PromptDefinitionsPage() {
  const [prompts, setPrompts] = useState<PromptDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPrompt, setEditingPrompt] = useState<PromptDefinition | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    loadPrompts()
  }, [])


  const loadPrompts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/prompt-definitions')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load prompt definitions')
      }
      
      setPrompts(data.prompts || [])
    } catch (err) {
      setError('Failed to load prompt definitions')
      console.error('Error loading prompts:', err)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (prompt: PromptDefinition) => {
    setEditingPrompt(prompt)
    setError(null)
    setSuccess(null)
  }

  const cancelEditing = () => {
    setEditingPrompt(null)
    setError(null)
    setSuccess(null)
  }

  const savePrompt = async (promptText: string) => {
    if (!editingPrompt) return

    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/admin/prompt-definitions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPrompt.id,
          prompt_text: promptText,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save prompt')
      }

      // Update local state
      setPrompts(prev => prev.map(p => 
        p.id === editingPrompt.id 
          ? { ...p, prompt_text: promptText, updated_at: new Date().toISOString() }
          : p
      ))

      setSuccess('Prompt updated successfully!')
      setEditingPrompt(null)
    } catch (err) {
      setError('Failed to save prompt')
      console.error('Error saving prompt:', err)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (prompt: PromptDefinition) => {
    try {
      const response = await fetch('/api/admin/prompt-definitions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: prompt.id,
          active: !prompt.active,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update prompt status')
      }

      // Update local state
      setPrompts(prev => prev.map(p => 
        p.id === prompt.id 
          ? { ...p, active: !p.active }
          : p
      ))

      setSuccess(`Prompt ${!prompt.active ? 'activated' : 'deactivated'} successfully!`)
    } catch (err) {
      setError('Failed to update prompt status')
      console.error('Error updating prompt:', err)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prompt definitions...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout 
      title="Prompt Definitions" 
      description="Edit prompt text and manage AI pipeline settings"
    >
      {/* Debug Toggle */}
      <div className="mb-6 flex justify-end">
        <DebugModeToggle debugMode={debugMode} onToggle={setDebugMode} />
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6">
          <ErrorExplanation error={error} />
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">{success}</div>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Overview */}
      <div className="mb-8">
        <StatusCard
          title="AI Pipeline Flow"
          status="active"
          value={prompts.filter(p => p.active).length}
          subtitle="Active prompts in processing order"
          critical={true}
        />
        
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <div className="flex flex-wrap items-center gap-4">
            {prompts
              .filter(p => p.active)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((prompt, index, array) => (
                <div key={prompt.id} className="flex items-center space-x-2">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
                    {prompt.sort_order}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {prompt.name.replace('_', ' ')}
                  </span>
                  {index < array.length - 1 && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Prompts are ordered by their sort_order value. Each step builds on the previous one.
          </p>
        </div>
      </div>

      {/* Prompt Definitions List */}
      <div className="space-y-6">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="bg-white shadow rounded-lg">
            {/* Clean Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full">
                    {getStepNumber(prompt)}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {prompt.name.replace('_', ' ')}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {prompt.type}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {prompt.model}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        prompt.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {prompt.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditing(prompt)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Prompt
                  </button>
                  <button
                    onClick={() => toggleActive(prompt)}
                    className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      prompt.active
                        ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                        : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
                    }`}
                  >
                    {prompt.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="p-6">
              {/* Prompt Text - Always Visible */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Prompt Text</h4>
                {editingPrompt?.id === prompt.id ? (
                  <EditPromptText
                    prompt={prompt}
                    onSave={savePrompt}
                    onCancel={cancelEditing}
                    saving={saving}
                  />
                ) : (
                  <div className="bg-gray-50 rounded-md p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {prompt.prompt_text}
                    </pre>
                  </div>
                )}
              </div>

              {/* Debug Information - Collapsible */}
              <CollapsibleDebugSection 
                title="Schema & Technical Details" 
                defaultOpen={debugMode}
              >
                <div className="space-y-6">
                  {/* Schema Previews */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SchemaPreview
                      schema={prompt.input_schema}
                      type="input"
                      explanation="Defines what data the AI receives as input"
                      howItWorks="Used to validate and structure input data before sending to the AI model"
                    />
                    <SchemaPreview
                      schema={prompt.output_schema}
                      type="output"
                      explanation="Defines the exact format the AI must return"
                      howItWorks="Enforced via OpenAI Function Calling to guarantee 100% schema compliance"
                    />
                  </div>

                  {/* Advanced Schema Details */}
                  <CollapsibleDebugSection 
                    title="Full Schema Details" 
                    defaultOpen={false}
                  >
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Input Schema</h5>
                        <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                          {JSON.stringify(prompt.input_schema, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Output Schema</h5>
                        <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                          {JSON.stringify(prompt.output_schema, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CollapsibleDebugSection>

                  {/* Schema Enforcement Rules */}
                  {prompt.type === 'questions_generation' && (
                    <CollapsibleDebugSection 
                      title="Questions Generation Rules" 
                      defaultOpen={false}
                    >
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h6 className="font-medium text-blue-900 mb-3">Schema Alignment Rules</h6>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Questions array must match questions_generation schema exactly</li>
                          <li>• Each question must have: id, text, type, options, required</li>
                          <li>• type must be &quot;multiple_choice&quot; (matches questions_generation enum)</li>
                          <li>• options array: 2-6 items, all strings</li>
                          <li>• When done: true, questions array must be empty []</li>
                          <li>• When done: false, questions array must have exactly 1 question</li>
                          <li>• summary field only present when done: true</li>
                        </ul>
                        
                        <h6 className="font-medium text-blue-900 mb-3 mt-4">End State Rules</h6>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• done: true → questions: [], summary: &quot;complete Q&A summary&quot;</li>
                          <li>• done: false → questions: [single_question], no summary</li>
                          <li>• Summary must include all 6 aspects covered in conversation</li>
                          <li>• Summary should create detailed image generation prompt</li>
                        </ul>
                      </div>
                    </CollapsibleDebugSection>
                  )}

                  {/* Metadata */}
                  <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                    Created: {new Date(prompt.created_at).toLocaleDateString()}
                    {prompt.updated_at !== prompt.created_at && (
                      <span className="ml-2">
                        • Updated: {new Date(prompt.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </CollapsibleDebugSection>
            </div>
          </div>
        ))}
      </div>

    </AdminLayout>
  )
}
