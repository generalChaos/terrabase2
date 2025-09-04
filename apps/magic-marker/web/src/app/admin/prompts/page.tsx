'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'

interface Prompt {
  id: string
  name: string
  content: string
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface PromptUsage {
  prompt_id: string
  step_type: string
  total_requests: number
  success_rate: number
  avg_response_time_ms: number
}

// Separate component for the editing textarea
function EditTextarea({ prompt, onSave, onCancel, saving }: {
  prompt: Prompt
  onSave: (content: string) => void
  onCancel: () => void
  saving: boolean
}) {
  const [content, setContent] = useState('')
  
  useEffect(() => {
    setContent(prompt.content)
  }, [prompt])
  
  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
        placeholder="Enter prompt content..."
      />
      <div className="flex space-x-3">
        <button
          onClick={() => onSave(content)}
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

// Component for creating new prompts
function CreatePromptForm({ onSave, onCancel, saving }: {
  onSave: (name: string, content: string) => void
  onCancel: () => void
  saving: boolean
}) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prompt Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          placeholder="e.g., image_analysis_v2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prompt Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          placeholder="Enter prompt content..."
        />
      </div>
      <div className="flex space-x-3">
        <button
          onClick={() => onSave(name, content)}
          disabled={saving || !name.trim() || !content.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Prompt'}
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

export default function PromptManagementPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [promptUsage, setPromptUsage] = useState<PromptUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [creatingPrompt, setCreatingPrompt] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadPrompts()
    loadPromptUsage()
  }, [])

  const loadPrompts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/prompts')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load prompts')
      }
      
      setPrompts(data.prompts || [])
    } catch (err) {
      setError('Failed to load prompts')
      console.error('Error loading prompts:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPromptUsage = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      const data = await response.json()
      
      if (response.ok && data.analytics) {
        setPromptUsage(data.analytics)
      }
    } catch (err) {
      console.error('Error loading prompt usage:', err)
    }
  }

  const getPromptUsage = (promptId: string) => {
    return promptUsage.filter(usage => usage.prompt_id === promptId)
  }

  const startEditing = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setError(null)
    setSuccess(null)
  }

  const cancelEditing = () => {
    setEditingPrompt(null)
    setCreatingPrompt(false)
    setError(null)
    setSuccess(null)
  }

  const createPrompt = async (name: string, content: string) => {
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, active: true })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create prompt')
      }
      
      setSuccess('Prompt created successfully')
      setCreatingPrompt(false)
      await loadPrompts()
    } catch (err) {
      setError('Failed to create prompt')
      console.error('Error creating prompt:', err)
    } finally {
      setSaving(false)
    }
  }

  const deletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(id)
      setError(null)
      
      const response = await fetch(`/api/admin/prompts/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete prompt')
      }
      
      setSuccess('Prompt deleted successfully')
      await loadPrompts()
    } catch (err) {
      setError('Failed to delete prompt')
      console.error('Error deleting prompt:', err)
    } finally {
      setDeleting(null)
    }
  }

  const reorderPrompt = async (promptId: string, direction: 'up' | 'down') => {
    try {
      setError(null)
      
      const response = await fetch('/api/admin/prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, direction })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reorder prompt')
      }
      
      setSuccess('Prompt reordered successfully')
      await loadPrompts()
    } catch (err) {
      setError('Failed to reorder prompt')
      console.error('Error reordering prompt:', err)
    }
  }

  const savePrompt = async (content: string) => {
    if (!editingPrompt) return

    try {
      setSaving(true)
      setError(null)
      
      // Update prompt via API
      const response = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPrompt.id,
          content: content,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save prompt')
      }

      // Update local state
      setPrompts(prev => prev.map(p => 
        p.id === editingPrompt.id 
          ? { ...p, content: content, updated_at: new Date().toISOString() }
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

  const toggleActive = async (prompt: Prompt) => {
    try {
      const response = await fetch('/api/admin/prompts', {
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
          <p className="mt-4 text-gray-600">Loading prompts...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout 
      title="Prompt Management" 
      description="Manage AI prompts and monitor their performance"
    >
      <div className="mb-6">
        <button
          onClick={() => setCreatingPrompt(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          + Create New Prompt
        </button>
      </div>

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

        {/* Create Prompt Form */}
        {creatingPrompt && (
          <div className="mb-6 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Create New Prompt</h2>
            </div>
            <div className="p-6">
              <CreatePromptForm
                onSave={createPrompt}
                onCancel={() => setCreatingPrompt(false)}
                saving={saving}
              />
            </div>
          </div>
        )}

        {/* Prompts List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Active Prompts</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="p-6">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      #{prompt.sort_order}
                    </span>
                    <h3 className="text-lg font-medium text-gray-900">
                      {prompt.name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      prompt.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {prompt.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Created: {new Date(prompt.created_at).toLocaleDateString()}
                      {prompt.updated_at !== prompt.created_at && (
                        <span className="ml-2">
                          • Updated: {new Date(prompt.updated_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Prompt Content */}
                  <div className="mt-4">
                    {editingPrompt?.id === prompt.id ? (
                      <EditTextarea
                        prompt={prompt}
                        onSave={savePrompt}
                        onCancel={cancelEditing}
                        saving={saving}
                      />
                    ) : (
                      <div className="bg-gray-50 rounded-md p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                          {prompt.content}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Usage Statistics */}
                  {getPromptUsage(prompt.id).length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Usage Statistics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {getPromptUsage(prompt.id).map((usage) => (
                          <div key={usage.step_type} className="bg-white border rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                usage.step_type === 'analysis' ? 'bg-blue-100 text-blue-800' :
                                usage.step_type === 'questions' ? 'bg-green-100 text-green-800' :
                                usage.step_type === 'conversational_question' ? 'bg-cyan-100 text-cyan-800' :
                                usage.step_type === 'answer_analysis' ? 'bg-yellow-100 text-yellow-800' :
                                usage.step_type === 'image_generation' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {usage.step_type.replace('_', ' ')}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {usage.total_requests} uses
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {(usage.success_rate || 0).toFixed(1)}% success • {(usage.avg_response_time_ms || 0).toFixed(0)}ms avg
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {editingPrompt?.id !== prompt.id && (
                    <div className="mt-4 flex items-center space-x-3">
                      {/* Order Controls */}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => reorderPrompt(prompt.id, 'up')}
                          disabled={prompts.findIndex(p => p.id === prompt.id) === 0}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => reorderPrompt(prompt.id, 'down')}
                          disabled={prompts.findIndex(p => p.id === prompt.id) === prompts.length - 1}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>
                      
                      <button
                        onClick={() => startEditing(prompt)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Edit
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
                      <button
                        onClick={() => deletePrompt(prompt.id)}
                        disabled={deleting === prompt.id}
                        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {deleting === prompt.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Link */}
        <div className="mt-8">
          <a
            href="/admin/analytics"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View Analytics
          </a>
        </div>
    </AdminLayout>
  )
}
