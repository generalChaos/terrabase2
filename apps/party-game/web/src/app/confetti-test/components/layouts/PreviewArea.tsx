import { ReactNode } from 'react';

interface PreviewAreaProps {
  children: ReactNode;
  minHeight?: number;
  className?: string;
}

export function PreviewArea({ children, minHeight = 500, className = "" }: PreviewAreaProps) {
  return (
    <div 
      className={`relative overflow-hidden rounded-lg border border-gray-600 bg-gray-900 ${className}`}
      style={{ minHeight: `${minHeight}px` }}
    >
      {children}
    </div>
  );
}
