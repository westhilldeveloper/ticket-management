import Link from 'next/link'
import { FiXCircle, FiEye } from 'react-icons/fi'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'

export default function LoadingError({ loading, error, showLogin }) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          {showLogin ? (
            <FiEye className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          ) : (
            <FiXCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {showLogin ? 'Access Denied' : error}
          </h2>
          <p className="text-gray-600 mb-6">
            {showLogin
              ? "You don't have permission to view this ticket."
              : error === 'Ticket not found'
              ? "The ticket you're looking for doesn't exist or has expired."
              : 'An error occurred while loading the ticket.'}
          </p>
          {showLogin ? (
            <Link
              href="/auth/login"
              className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Login to Continue
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Go to Homepage
            </Link>
          )}
        </div>
      </div>
    )
  }

  return null
}