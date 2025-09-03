'use client'

import { useState, useEffect } from 'react'
import { PromptService, Prompt } from '@/lib/promptService'

export default function PromptManagementPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      setLoading(true)
      const data = await PromptService.getAllActivePrompts()
      setPrompts(data)
    } catch (err) {
      setError('Failed to load prompts')
      console.error('Error loading prompts:', err)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setEditContent(prompt.content)
    setError(null)
    setSuccess(null)
  }

  const cancelEditing = () => {
    setEditingPrompt(null)
    setEditContent('')
    setError(null)
    setSuccess(null)
  }

  const savePrompt = async () => {
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
          content: editContent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save prompt')
      }

      // Update local state
      setPrompts(prev => prev.map(p => 
        p.id === editingPrompt.id 
          ? { ...p, content: editContent, updated_at: new Date().toISOString() }
          : p
      ))

      setSuccess('Prompt updated successfully!')
      setEditingPrompt(null)
      setEditContent('')
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Prompt Management</h1>
          <p className="mt-2 text-gray-600">
            Manage AI prompts and monitor their performance
          </p>
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

        {/* Prompts List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Active Prompts</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
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
                        <div className="space-y-4">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={8}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter prompt content..."
                          />
                          <div className="flex space-x-3">
                            <button
                              onClick={savePrompt}
                              disabled={saving}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                              {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-md p-4">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                            {prompt.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {editingPrompt?.id !== prompt.id && (
                    <div className="ml-4 flex space-x-2">
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
      </div>
    </div>
  )
}
