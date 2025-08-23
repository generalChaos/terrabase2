'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { notify } from '@/lib/notify';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Log the error and show toast, but don't show fallback UI
    console.error('🚨 Error Boundary caught an error:', error);
    return { hasError: false, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    
    // Display error in UI via toast only
    const errorMessage = error.message || 'An unexpected error occurred';
    notify.error(`Error: ${errorMessage}`);
    
    // You could also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-md w-full text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-slate-300 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors and trigger Error Boundary
export function useErrorHandler() {
  return (error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    // For event handlers, we need to manually trigger the Error Boundary
    // by updating state or calling a callback
    console.error('🚨 Error caught by useErrorHandler:', errorObj);
    notify.error(`Error: ${errorObj.message}`);
    throw errorObj;
  };
}

// Hook to manually trigger Error Boundary from event handlers
export function useErrorBoundary() {
  return {
    throwError: (error: Error | string) => {
      const errorObj = typeof error === 'string' ? new Error(error) : error;
      // Just show toast for now, don't trigger fallback UI
      console.error('🚨 Error caught by useErrorBoundary:', errorObj);
      notify.error(`Error: ${errorObj.message}`);
    }
  };
}
