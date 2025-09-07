'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import CollapsibleDebugSection from '@/components/admin/CollapsibleDebugSection'
import StatusCard from '@/components/admin/StatusCard'
import MetricCard from '@/components/admin/MetricCard'
import DebugModeToggle from '@/components/admin/DebugModeToggle'
import ErrorExplanation from '@/components/admin/ErrorExplanation'

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
  schema_enforcement?: {
    enabled: boolean
    function_calling_success_rate: number
    retry_fallback_rate: number
    total_attempts: number
    last_test?: string
  }
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)

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
            <ErrorExplanation error={error || 'Failed to load system status'} />
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
    <AdminLayout title="System Status" description="Monitor system health and performance metrics">
      {/* Debug Toggle */}
      <div className="mb-6 flex justify-end">
        <DebugModeToggle debugMode={debugMode} onToggle={setDebugMode} />
      </div>

      {/* Environment Overview */}
      <div className="mb-8">
        <StatusCard
          title="Environment"
          status="active"
          value={status.environment}
          subtitle={`Last updated: ${new Date().toLocaleString()}`}
          critical={true}
        />
      </div>

      {/* Core System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatusCard
          title="Database"
          status={status.database.connected ? 'success' : 'error'}
          value={status.database.connected ? 'Connected' : 'Disconnected'}
          subtitle="PostgreSQL connection"
        />
        <StatusCard
          title="OpenAI"
          status={status.openai.configured ? 'success' : 'error'}
          value={status.openai.configured ? 'Configured' : 'Not Configured'}
          subtitle="AI model access"
        />
        <StatusCard
          title="Supabase"
          status={status.supabase.configured ? 'success' : 'error'}
          value={status.supabase.configured ? 'Configured' : 'Not Configured'}
          subtitle="Backend services"
        />
        <StatusCard
          title="Storage"
          status={status.storage.uploads_available ? 'success' : 'error'}
          value={status.storage.uploads_available ? 'Available' : 'Unavailable'}
          subtitle="File uploads"
        />
      </div>

      {/* Debug Information - Collapsible */}
      <CollapsibleDebugSection 
        title="Detailed System Information" 
        defaultOpen={debugMode}
      >
        <div className="space-y-6">
          {/* Error Details */}
          {(status.database.error || status.openai.error || status.supabase.error || status.storage.error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-3">System Errors</h4>
              <div className="space-y-2">
                {status.database.error && (
                  <div className="text-sm text-red-800">
                    <strong>Database:</strong> {status.database.error}
                  </div>
                )}
                {status.openai.error && (
                  <div className="text-sm text-red-800">
                    <strong>OpenAI:</strong> {status.openai.error}
                  </div>
                )}
                {status.supabase.error && (
                  <div className="text-sm text-red-800">
                    <strong>Supabase:</strong> {status.supabase.error}
                  </div>
                )}
                {status.storage.error && (
                  <div className="text-sm text-red-800">
                    <strong>Storage:</strong> {status.storage.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Environment Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Environment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Environment:</span>
                <span className="ml-2 text-gray-600">{status.environment}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Check:</span>
                <span className="ml-2 text-gray-600">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleDebugSection>

      {/* Prompts Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Prompt Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Database Prompts"
            value={status.prompts.database_enabled ? 'Enabled' : 'Disabled'}
            subtitle="Prompt storage method"
            trend={status.prompts.database_enabled ? 'up' : 'down'}
          />
          <MetricCard
            title="Total Prompts"
            value={status.prompts.total_prompts}
            subtitle="All prompt definitions"
          />
          <MetricCard
            title="Active Prompts"
            value={status.prompts.active_prompts}
            subtitle="Currently in use"
            trend={status.prompts.active_prompts > 0 ? 'up' : 'down'}
          />
        </div>
      </div>

      {/* Schema Enforcement Status */}
      {status.schema_enforcement && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schema Enforcement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusCard
              title="Schema Enforcement"
              status={status.schema_enforcement.enabled ? 'success' : 'error'}
              value={status.schema_enforcement.enabled ? 'Enabled' : 'Disabled'}
              subtitle="AI response validation"
            />
            <MetricCard
              title="Function Calling Success"
              value={`${status.schema_enforcement.function_calling_success_rate.toFixed(1)}%`}
              subtitle="OpenAI function calling success rate"
              trend={status.schema_enforcement.function_calling_success_rate > 90 ? 'up' : 'down'}
            />
            <MetricCard
              title="Retry Fallback Rate"
              value={`${status.schema_enforcement.retry_fallback_rate.toFixed(1)}%`}
              subtitle="Fallback to retry mechanism"
              trend={status.schema_enforcement.retry_fallback_rate < 10 ? 'up' : 'down'}
            />
            <MetricCard
              title="Total Attempts"
              value={status.schema_enforcement.total_attempts}
              subtitle="Schema enforcement attempts"
            />
          </div>
          
          {status.schema_enforcement.last_test && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Last Test:</strong> {status.schema_enforcement.last_test}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        
        {/* Primary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Schema Enforcement Test</h3>
            <p className="text-sm text-gray-600 mb-4">
              Test all prompts with schema enforcement
            </p>
            <a
              href="/api/debug/test-all-prompts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Test Schema Enforcement
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Prompt Tester</h3>
            <p className="text-sm text-gray-600 mb-4">
              Interactive prompt testing interface
            </p>
            <a
              href="/admin/prompt-tester"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Open Tester
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
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

        {/* Advanced Testing - Collapsible */}
        <CollapsibleDebugSection 
          title="Advanced Testing Tools" 
          defaultOpen={debugMode}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
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

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Questions Generation Test</h3>
              <p className="text-sm text-gray-600 mb-4">
                Test questions generation with schema enforcement
              </p>
              <a
                href="/api/debug/test-questions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Test Questions
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Image Analysis Test</h3>
              <p className="text-sm text-gray-600 mb-4">
                Test image analysis with schema enforcement
              </p>
              <a
                href="/api/debug/test-simple"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Test Image Analysis
              </a>
            </div>
          </div>
        </CollapsibleDebugSection>
      </div>
    </AdminLayout>
  )
}
