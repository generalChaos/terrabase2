'use client';

import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { notify } from './notify';

/**
 * Custom hook for handling WebSocket errors with toast notifications
 * This ensures all components display errors consistently in the UI
 */
export function useSocketErrors(socket: Socket | null) {
  const errorHandlersRef = useRef<Map<string, (error: unknown) => void>>(new Map());

  useEffect(() => {
    if (!socket) {
      console.log('🔧 useSocketErrors: No socket provided');
      return;
    }
    
    console.log('🔧 useSocketErrors: Setting up error handlers for socket:', socket.id);

    // Handle general socket errors
    const handleError = (error: unknown) => {
      console.error('❌ Socket error:', error);
      
      // Extract error message
      const errorMessage = 
        (error as { error?: string })?.error || 
        (error as { message?: string })?.message || 
        (error as { msg?: string })?.msg || 
        'An unexpected error occurred';
      
      console.log('🔧 Displaying error toast:', errorMessage);
      
      // Display error in UI
      notify.error(errorMessage);
    };

    // Handle connection errors
    const handleConnectError = (error: Error) => {
      console.error('❌ Connection error:', error);
      const errorMessage = `Connection failed: ${error.message || 'Unknown error'}`;
      notify.error(errorMessage);
    };

    // Handle disconnection
    const handleDisconnect = (reason: string) => {
      console.log('🔌 Disconnected:', reason);
      if (reason === 'io server disconnect') {
        notify.error('Disconnected by server');
      }
    };

    // Set up error listeners
    socket.on('error', handleError);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);

    // Cleanup function
    return () => {
      socket.off('error', handleError);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  /**
   * Register a custom error handler for specific error codes
   */
  const registerErrorHandler = (errorCode: string, handler: (error: unknown) => void) => {
    errorHandlersRef.current.set(errorCode, handler);
  };

  /**
   * Unregister a custom error handler
   */
  const unregisterErrorHandler = (errorCode: string) => {
    errorHandlersRef.current.delete(errorCode);
  };

  return {
    registerErrorHandler,
    unregisterErrorHandler,
  };
}
