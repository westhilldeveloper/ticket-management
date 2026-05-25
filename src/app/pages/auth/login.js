import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await login(email, password)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Decorative top accent */}
          <div className="h-1.5 bg-gradient-to-r from-pink-400 to-pink-600"></div>

          <div className="px-8 py-10 sm:px-10">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="relative w-16 h-16">
                <Image
                  src="/images/finLogo.png"
                  alt="Company Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Header text */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
              <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email field – bottom border style */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-9 pr-3 py-2 border-0 border-b-2 border-gray-200 focus:border-pink-400 focus:ring-0 focus:outline-none transition-colors duration-150 text-gray-800 placeholder-gray-400"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password field – bottom border style */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full pl-9 pr-3 py-2 border-0 border-b-2 border-gray-200 focus:border-pink-400 focus:ring-0 focus:outline-none transition-colors duration-150 text-gray-800 placeholder-gray-400"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Forgot password link */}
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-pink-600 hover:text-pink-700 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    Sign in
                    <FiArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Signup link */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Don't have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="font-medium text-pink-600 hover:text-pink-700 transition-colors"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer / Legal hint */}
        <div className="text-center mt-6 text-xs text-gray-400">
          By signing in, you agree to our{' '}
          <a href="/terms" className="underline hover:text-gray-500">Terms</a> and{' '}
          <a href="/privacy" className="underline hover:text-gray-500">Privacy Policy</a>
        </div>
      </div>
    </div>
  )
}