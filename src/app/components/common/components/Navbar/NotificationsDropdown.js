'use client'

import { Fragment, useState, useEffect } from 'react'
import { Transition } from '@headlessui/react'
import Link from 'next/link'
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { formatRelativeTime, getNotificationIcon } from './utils'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function NotificationsDropdown({ 
  show, 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onClose,
  loading 
}) {
  const [markingAll, setMarkingAll] = useState(false)

  const handleMarkAll = async () => {
    setMarkingAll(true)
    await onMarkAllAsRead()
    setMarkingAll(false)
  }

  return (
    <Transition show={show} as={Fragment}>
      <div className="absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
        <div className="py-2">
          {/* Header with mark all */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Today's Notifications</h3>
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAll}
                disabled={markingAll}
                className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1 disabled:opacity-50"
              >
                <FiCheckCircle className="h-3.5 w-3.5" />
                {markingAll ? 'Marking...' : 'Mark all as read'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-6 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    onMarkAsRead(notification.id)
                    // Navigate to ticket if present
                    if (notification.ticket?.id) {
                      window.location.href = `/tickets/${notification.ticket.id}`
                    }
                    onClose()
                  }}
                  className={classNames(
                    'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0',
                    !notification.read ? 'bg-pink-50' : ''
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 break-words">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                        {notification.ticket?.ticketNumber && (
                          <span className="text-xs text-gray-400">
                            #{notification.ticket.ticketNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-pink-500 mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <FiAlertCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No notifications today</p>
              <p className="text-xs text-gray-400 mt-1">Check back later for updates</p>
            </div>
          )}
        </div>
      </div>
    </Transition>
  )
}