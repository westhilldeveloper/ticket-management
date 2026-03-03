'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export default function LoginSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/auth/login')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Success!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {message === 'verified' && 'Your email has been verified successfully!'}
          {message === 'reset' && 'Your password has been reset successfully!'}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          You will be redirected to the login page in a few seconds...
        </p>
        <div className="mt-6">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Click here if you're not redirected
          </Link>
        </div>
      </div>
    </div>
  )
}