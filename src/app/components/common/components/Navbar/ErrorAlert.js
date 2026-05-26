'use client'

import { FiAlertCircle } from 'react-icons/fi'

export default function ErrorAlert({ error }) {
  if (!error) return null

  return (
    <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-sm" role="alert">
      <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  )
}