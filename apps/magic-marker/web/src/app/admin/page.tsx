'use client'

import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { 
  FileText, 
  BarChart3, 
  TestTube, 
  MessageCircle, 
  Settings,
  Database,
  Zap,
  Bug
} from 'lucide-react'

export default function AdminDashboard() {
  return (
    <AdminLayout 
      title="Admin Dashboard" 
      description="Manage your Magic Marker application"
    >

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Prompt Definitions */}
          <Link href="/admin/prompt-definitions" className="group">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-200">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
                      Prompt Definitions
                    </h3>
                    <p className="text-sm text-gray-500">
                      Manage new structured prompt system
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Processing & Analytics */}
          <Link href="/admin/steps" className="group">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors duration-200">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                      Processing & Analytics
                    </h3>
                    <p className="text-sm text-gray-500">
                      View processing steps and performance metrics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>


          {/* Conversations */}
          <Link href="/admin/analysis-flows" className="group">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-cyan-500 rounded-lg flex items-center justify-center group-hover:bg-cyan-600 transition-colors duration-200">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-cyan-600 transition-colors duration-200">
                      Analysis Flows
                    </h3>
                    <p className="text-sm text-gray-500">
                      View image analysis flows and conversations
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
                    <div className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center group-hover:bg-yellow-600 transition-colors duration-200">
                      <Settings className="w-8 h-8 text-white" />
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
                href="/api/debug/prompts"
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
