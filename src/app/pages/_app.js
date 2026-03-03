import '@/styles/globals.css'
import { AuthProvider } from '../context/AuthContext'
import { SocketProvider } from '../context/SocketContext'
import { ToastProvider } from '../context/ToastContext'
import ErrorBoundary from '../components/common/ErrorBoundary'

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <Component {...pageProps} />
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}