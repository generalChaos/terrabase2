import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description: string;
  backHref?: string;
  backText?: string;
  children?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  backHref = "/confetti-test", 
  backText = "← Back to Main",
  children 
}: PageHeaderProps) {
  return (
    <header className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-gray-300 mt-1">{description}</p>
          </div>
          <Link 
            href={backHref}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            {backText}
          </Link>
        </div>
        
        {children && (
          <div className="flex gap-2">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
