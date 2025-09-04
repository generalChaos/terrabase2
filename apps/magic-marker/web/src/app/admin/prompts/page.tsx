'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'

export default function PromptManagementPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to new prompt definitions page
    router.replace('/admin/prompt-definitions')
  }, [router])

  return (
    <AdminLayout 
      title="Redirecting..." 
      description="Redirecting to new prompt definitions system"
    >
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to new prompt system...</p>
          <p className="mt-2 text-sm text-gray-500">
            If you are not redirected automatically, 
            <a href="/admin/prompt-definitions" className="text-blue-600 hover:text-blue-500 ml-1">
              click here
            </a>
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}