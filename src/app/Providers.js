// src/app/Providers.js
'use client';

import { SessionProvider } from 'next-auth/react';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SessionProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthProvider>
        </SessionProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}