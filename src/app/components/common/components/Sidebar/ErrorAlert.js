'use client'

import { FiAlertCircle } from 'react-icons/fi'

export default function ErrorAlert({ error }) {
  return (
    <div className="mx-2 mt-2 p-2 bg-red-50 border border-red-200 rounded text-[9px] text-red-700">
      <div className="flex items-center gap-1">
        <FiAlertCircle className="h-3 w-3 flex-shrink-0" />
        <span>{error}</span>
      </div>
    </div>
  )
}