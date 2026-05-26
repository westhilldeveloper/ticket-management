'use client'

import { FiMenu } from 'react-icons/fi'

export default function MenuButton({ onMenuClick }) {
  return (
    <button
      onClick={onMenuClick}
      className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors"
      aria-label="Toggle sidebar"
      aria-expanded="false"
    >
      <FiMenu className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}