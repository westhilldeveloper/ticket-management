'use client'

import { FiAlertCircle } from 'react-icons/fi'

export default function MobileErrorAlert({ error }) {
  if (!error) return null

  return (
    <div className="md:hidden bg-red-50 border-t border-red-100 px-4 py-2" role="alert">
      <div className="flex items-center space-x-2 text-sm text-red-700">
        <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    </div>
  )
}