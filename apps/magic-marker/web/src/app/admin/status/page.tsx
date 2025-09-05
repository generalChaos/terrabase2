'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'

interface SystemStatus {
  environment: string
  database: {
    connected: boolean
    error?: string
  }
  openai: {
    configured: boolean
    error?: string
  }
  supabase: {
    configured: boolean
    error?: string
  }
  prompts: {
    database_enabled: boolean
    total_prompts: number
    active_prompts: number
  }
  storage: {
    uploads_available: boolean
    error?: string
  }
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSystemStatus()
  }, [])

  const loadSystemStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/status')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load system status')
      }
      
      setStatus(data)
    } catch (err) {
      setError('Failed to load system status')
      console.error('Error loading system status:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (status: boolean) => {
    return status ? '✅' : '❌'
  }

  if (loading) {
    return (
      <AdminLayout title="System Status" description="Check system health and configuration">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading system status...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !status) {
    return (
      <AdminLayout title="System Status" description="Check system health and configuration">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium">Error</div>
            <p className="mt-2 text-gray-600">{error || 'Failed to load system status'}</p>
            <button
              onClick={loadSystemStatus}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="System Status" description="Check system health and configuration">
      {/* Environment Info */}
      <div className="mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Environment</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Environment</dt>
                <dd className="mt-1 text-sm text-gray-900">{status.environment}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date().toLocaleString()}</dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Database Status */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="mr-2">🗄️</span>
              Database
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Connection</span>
              <span className={`text-sm font-medium ${getStatusColor(status.database.connected)}`}>
                {getStatusIcon(status.database.connected)} {status.database.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {status.database.error && (
              <div className="mt-2 text-sm text-red-600">
                Error: {status.database.error}
              </div>
            )}
          </div>
        </div>

        {/* OpenAI Status */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="mr-2">🤖</span>
              OpenAI
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Configuration</span>
              <span className={`text-sm font-medium ${getStatusColor(status.openai.configured)}`}>
                {getStatusIcon(status.openai.configured)} {status.openai.configured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            {status.openai.error && (
              <div className="mt-2 text-sm text-red-600">
                Error: {status.openai.error}
              </div>
            )}
          </div>
        </div>

        {/* Supabase Status */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="mr-2">⚡</span>
              Supabase
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Configuration</span>
              <span className={`text-sm font-medium ${getStatusColor(status.supabase.configured)}`}>
                {getStatusIcon(status.supabase.configured)} {status.supabase.configured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            {status.supabase.error && (
              <div className="mt-2 text-sm text-red-600">
                Error: {status.supabase.error}
              </div>
            )}
          </div>
        </div>

        {/* Storage Status */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="mr-2">💾</span>
              Storage
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Uploads</span>
              <span className={`text-sm font-medium ${getStatusColor(status.storage.uploads_available)}`}>
                {getStatusIcon(status.storage.uploads_available)} {status.storage.uploads_available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            {status.storage.error && (
              <div className="mt-2 text-sm text-red-600">
                Error: {status.storage.error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prompts Status */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="mr-2">✏️</span>
            Prompts Configuration
          </h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Database Prompts</dt>
              <dd className={`mt-1 text-sm font-medium ${getStatusColor(status.prompts.database_enabled)}`}>
                {getStatusIcon(status.prompts.database_enabled)} {status.prompts.database_enabled ? 'Enabled' : 'Disabled'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Prompts</dt>
              <dd className="mt-1 text-sm text-gray-900">{status.prompts.total_prompts}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Active Prompts</dt>
              <dd className="mt-1 text-sm text-gray-900">{status.prompts.active_prompts}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Test Database Connection</h3>
            <p className="text-sm text-gray-600 mb-4">
              Verify database connectivity and prompt retrieval
            </p>
            <a
              href="/api/debug/prompts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Test Database
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">System Diagnostics</h3>
            <p className="text-sm text-gray-600 mb-4">
              Run comprehensive system health check
            </p>
            <a
              href="/api/debug/deployment"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Run Diagnostics
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
