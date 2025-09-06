import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  FileText, 
  TestTube, 
  MessageCircle, 
  BarChart3, 
  Settings 
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', label: 'Home', href: '/admin', icon: Home },
    { name: 'Prompt Definitions', label: 'Prompts', href: '/admin/prompt-definitions', icon: FileText },
    { name: 'Prompt Tester', label: 'Test', href: '/admin/prompt-tester', icon: TestTube },
    { name: 'Analysis Flows', label: 'Flows', href: '/admin/analysis-flows', icon: MessageCircle },
    { name: 'Processing & Analytics', label: 'Analytics', href: '/admin/steps', icon: BarChart3 },
    { name: 'Status', label: 'Status', href: '/admin/status', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  href="/"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium mr-4"
                >
                  ← Back to App
                </Link>
                <Link href="/admin" className="text-xl font-bold text-gray-900">
                  Magic Marker Admin
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  const IconComponent = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex flex-col items-center px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                      title={item.name}
                    >
                      <IconComponent className="h-5 w-5 mb-1" />
                      <span className="text-xs">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-gray-600">{description}</p>
          )}
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  )
}
