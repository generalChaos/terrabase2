'use client'

import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your Magic Marker application
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Prompt Management */}
          <Link href="/admin/prompts" className="group">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-200">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      Prompt Management
                    </h3>
                    <p className="text-sm text-gray-500">
                      Edit and manage AI prompts
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Analytics */}
          <Link href="/admin/analytics" className="group">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors duration-200">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                      Analytics
                    </h3>
                    <p className="text-sm text-gray-500">
                      View prompt performance metrics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* System Status */}
          <Link href="/admin/status" className="group">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center group-hover:bg-yellow-600 transition-colors duration-200">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-yellow-600 transition-colors duration-200">
                      System Status
                    </h3>
                    <p className="text-sm text-gray-500">
                      Check system health and configuration
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Test Prompts</h3>
              <p className="text-sm text-gray-600 mb-4">
                Test the prompt system and verify database connectivity
              </p>
              <a
                href="/api/test-prompts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Test Prompts
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">System Diagnostics</h3>
              <p className="text-sm text-gray-600 mb-4">
                Check environment variables and system configuration
              </p>
              <a
                href="/api/test-deployment"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Run Diagnostics
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
