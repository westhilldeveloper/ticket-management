'use client'

import { FiBell } from 'react-icons/fi'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function NotificationsButton({ unreadCount, onClick, isOpen }) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={classNames(
          "relative p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2",
          isOpen 
            ? "bg-gray-100 text-gray-700" 
            : "text-gray-500 hover:text-gray-600 hover:bg-gray-100"
        )}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <FiBell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-[10px] font-medium text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}