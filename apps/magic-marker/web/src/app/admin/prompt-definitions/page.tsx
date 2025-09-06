'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'

interface PromptDefinition {
  id: string
  name: string
  type: string
  prompt_text: string
  input_schema: Record<string, unknown>
  output_schema: Record<string, unknown>
  return_schema: Record<string, unknown>
  model: string
  response_format: string
  max_tokens?: number
  temperature?: number
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Component for displaying schema in a readable format
function SchemaDisplay({ schema, title }: { schema: Record<string, unknown>, title: string }) {
  return (
    <div className="bg-gray-50 rounded-md p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono overflow-x-auto">
        {JSON.stringify(schema, null, 2)}
      </pre>
    </div>
  )
}

// Component for displaying input/output types with tooltip
function TypeDisplay({ 
  schema, 
  title, 
  type,
  onViewSchema
}: { 
  schema: Record<string, unknown>, 
  title: string, 
  type: 'input' | 'output',
  onViewSchema: (schema: 'input' | 'output' | 'return') => void
}) {
  const getTypeSummary = (schema: Record<string, unknown>) => {
    if (!schema.properties) return 'No properties defined'
    
    const required = (schema.required as string[]) || []
    const properties = Object.entries(schema.properties).map(([key, prop]: [string, unknown]) => {
      const isRequired = required.includes(key)
      const propType = (prop as { type?: string }).type || 'unknown'
      const isOptional = (prop as { optional?: boolean }).optional || !isRequired
      
      return {
        name: key,
        type: propType,
        required: isRequired,
        optional: isOptional,
        description: (prop as { description?: string }).description || ''
      }
    })
    
    return properties
  }

  const typeSummary = getTypeSummary(schema)
  // const hasMultipleFields = Array.isArray(typeSummary) && typeSummary.length > 1 // Unused for now

  return (
    <div className="relative group">
      <div className="flex items-center space-x-2">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <div className="relative">
          <button 
            onClick={() => onViewSchema(type)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            title="Click to view full schema"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
            <div className="font-medium mb-2">{title} Schema</div>
            {Array.isArray(typeSummary) ? (
              <div className="space-y-1">
                {typeSummary.map((field, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-mono text-blue-300">{field.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        field.required ? 'bg-red-600' : 'bg-gray-600'
                      }`}>
                        {field.required ? 'required' : 'optional'}
                      </span>
                      <span className="text-yellow-300">{field.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>{typeSummary}</div>
            )}
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="text-gray-300 text-xs">Click to view full schema</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Type summary */}
      <div className="mt-2">
        {Array.isArray(typeSummary) ? (
          <div className="flex flex-wrap gap-2">
            {typeSummary.slice(0, 3).map((field, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  field.required
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {field.name}: {field.type}
                {field.required && <span className="ml-1 text-red-500">*</span>}
              </span>
            ))}
            {typeSummary.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{typeSummary.length - 3} more
              </span>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">{typeSummary}</div>
        )}
      </div>
    </div>
  )
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
//     'conversational_question': 'Generate follow-up questions',
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
  const [viewingSchema, setViewingSchema] = useState<{prompt: PromptDefinition, schema: 'input' | 'output' | 'return'} | null>(null)
  const [activeTab, setActiveTab] = useState<{[key: string]: string}>({})

  useEffect(() => {
    loadPrompts()
  }, [])

  const getActiveTab = (promptId: string) => {
    return activeTab[promptId] || 'output-constraints'
  }

  const setActiveTabForPrompt = (promptId: string, tab: string) => {
    setActiveTab(prev => ({ ...prev, [promptId]: tab }))
  }

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
      description="Manage AI prompt definitions"
    >
      {/* Status Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
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
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Pipeline Flow</h2>
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

      {/* Prompt Definitions List */}
      <div className="space-y-6">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Step Number */}
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full">
                    {getStepNumber(prompt)}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {prompt.name}
                    </h3>
                  </div>
                  
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {prompt.type}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {prompt.model}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    prompt.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {prompt.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditing(prompt)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Text
                  </button>
                  <button
                    onClick={() => toggleActive(prompt)}
                    className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
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
            
            <div className="p-6 space-y-6">
              {/* Prompt Text */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Prompt Text</h4>
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

              {/* Tabbed Interface */}
              <div className="mt-4">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTabForPrompt(prompt.id, 'output-constraints')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        getActiveTab(prompt.id) === 'output-constraints'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Output Constraints
                    </button>
                    <button
                      onClick={() => setActiveTabForPrompt(prompt.id, 'schemas')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        getActiveTab(prompt.id) === 'schemas'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Schemas
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-4">
                  {getActiveTab(prompt.id) === 'output-constraints' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="text-xs text-blue-800 font-mono">
                        <div className="font-semibold mb-1">Return Schema:</div>
                        <pre className="text-xs">{JSON.stringify(prompt.return_schema, null, 2)}</pre>
                        
                        {prompt.type === 'conversational_question' && (
                          <>
                            <div className="mt-3 font-semibold">Schema Alignment Rules:</div>
                            <div className="text-xs space-y-1">
                              <div>• Questions array must match questions_generation schema exactly</div>
                              <div>• Each question must have: id, text, type, options, required</div>
                              <div>• type must be &quot;multiple_choice&quot; (matches questions_generation enum)</div>
                              <div>• options array: 2-6 items, all strings</div>
                              <div>• When done: true, questions array must be empty []</div>
                              <div>• When done: false, questions array must have exactly 1 question</div>
                              <div>• summary field only present when done: true</div>
                            </div>
                            
                            <div className="mt-3 font-semibold">End State Rules:</div>
                            <div className="text-xs space-y-1">
                              <div>• done: true → questions: [], summary: &quot;complete Q&A summary&quot;</div>
                              <div>• done: false → questions: [single_question], no summary</div>
                              <div>• Summary must include all 6 aspects covered in conversation</div>
                              <div>• Summary should create detailed image generation prompt</div>
                            </div>
                          </>
                        )}
                        
                        <div className="mt-3 font-semibold">JSON Formatting Rules:</div>
                        <div className="text-xs">• No extra keys. No preamble. No markdown. Only JSON.</div>
                        <div className="text-xs">• Follow the schema exactly.</div>
                      </div>
                    </div>
                  )}

                  {getActiveTab(prompt.id) === 'schemas' && (
                    <div className="space-y-6">
                      {/* Input/Output Types Summary */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Schema Summary</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <TypeDisplay 
                            schema={prompt.input_schema} 
                            title="Input" 
                            type="input"
                            onViewSchema={(schemaType) => setViewingSchema({prompt, schema: schemaType})}
                          />
                          <TypeDisplay 
                            schema={prompt.output_schema} 
                            title="Output" 
                            type="output"
                            onViewSchema={(schemaType) => setViewingSchema({prompt, schema: schemaType})}
                          />
                        </div>
                      </div>

                      {/* Full Schemas */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Full Schemas</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <SchemaDisplay 
                            schema={prompt.input_schema} 
                            title="Input Schema" 
                          />
                          <SchemaDisplay 
                            schema={prompt.output_schema} 
                            title="Output Schema" 
                          />
                          <SchemaDisplay 
                            schema={prompt.return_schema} 
                            title="Return Schema" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>


              {/* Metadata */}
              <div className="text-xs text-gray-500">
                Created: {new Date(prompt.created_at).toLocaleDateString()}
                {prompt.updated_at !== prompt.created_at && (
                  <span className="ml-2">
                    • Updated: {new Date(prompt.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Schema Viewer Modal */}
      {viewingSchema && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {viewingSchema.prompt.name} - {viewingSchema.schema.charAt(0).toUpperCase() + viewingSchema.schema.slice(1)} Schema
                </h3>
                <button
                  onClick={() => setViewingSchema(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {JSON.stringify(
                    viewingSchema.schema === 'input' ? viewingSchema.prompt.input_schema :
                    viewingSchema.schema === 'output' ? viewingSchema.prompt.output_schema :
                    viewingSchema.prompt.return_schema,
                    null,
                    2
                  )}
                </pre>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setViewingSchema(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
