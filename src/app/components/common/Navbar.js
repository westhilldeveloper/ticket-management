'use client'

import { Fragment, useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, Transition } from '@headlessui/react'
import { 
  FiMenu, 
  FiBell, 
  FiUser, 
  FiLogOut, 
  FiSettings, 
  FiChevronDown,
  FiAlertCircle,
  FiCircle // Alternative for user circle
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Navbar({ onMenuClick }) {
  const { user, logout, isLoading: authLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [error, setError] = useState(null)

  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Mock notifications fetch - replace with actual API call
  useEffect(() => {
    if (isClient && user) {
      // Simulate fetching notifications
      const mockNotifications = [
        { id: 1, message: 'New ticket assigned', read: false, time: '5m ago' },
        { id: 2, message: 'Ticket #1234 updated', read: true, time: '1h ago' },
        { id: 3, message: 'Meeting reminder', read: false, time: '2h ago' },
      ]
      setNotifications(mockNotifications)
    }
  }, [isClient, user])

  const handleLogout = async () => {
    try {
      setError(null)
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      setError('Failed to log out. Please try again.')
      
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
  }

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // Don't render until after hydration to prevent mismatch
  if (!isClient) {
    return (
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30" aria-label="Main navigation">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="lg:hidden w-10 h-10" /> {/* Placeholder for menu button */}
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  Ticket Management System
                </h1>
              </div>
            </div>
            <div className="w-24" /> {/* Placeholder for right side */}
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30" aria-label="Main navigation">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left section */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              aria-label="Toggle sidebar"
              aria-expanded="false"
            >
              <FiMenu className="h-5 w-5" aria-hidden="true" />
            </button>
            
            <div className="ml-4 lg:ml-0">
              <Link href="/dashboard" className="block">
                <h1 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                  TicketFlow
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Enterprise Support</p>
              </Link>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {/* Error message */}
            {error && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-sm" role="alert">
                <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="relative p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              >
                <FiBell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-primary-600 ring-2 ring-white" />
                )}
              </button>

              {/* Notifications dropdown */}
              <Transition
                show={showNotifications}
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                    </div>
                    
                    {notifications.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => markAsRead(notification.id)}
                            className={classNames(
                              'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors',
                              !notification.read ? 'bg-primary-50' : ''
                            )}
                          >
                            <p className="text-sm text-gray-800">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-gray-500">No notifications</p>
                      </div>
                    )}
                    
                    <div className="px-4 py-2 border-t border-gray-100">
                      <Link
                        href="/notifications"
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            {/* User menu */}
            <Menu as="div" className="relative">
              <Menu.Button 
                className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                aria-label="User menu"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <FiUser className="h-4 w-4 text-white" aria-hidden="true" />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role || 'Employee'}
                  </p>
                </div>
                <FiChevronDown className="hidden md:block h-4 w-4 text-gray-400" aria-hidden="true" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                      <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{user?.role}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                    </div>

                    <Menu.Item>
                      {({ active, close }) => (
                        <Link
                          href="/profile"
                          className={classNames(
                            active ? 'bg-gray-50 text-gray-900' : 'text-gray-700',
                            'flex items-center px-4 py-2 text-sm transition-colors'
                          )}
                          onClick={close}
                        >
                          <FiCircle className="mr-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                          Your Profile
                        </Link>
                      )}
                    </Menu.Item>

                    <Menu.Item>
                      {({ active, close }) => (
                        <Link
                          href="/settings"
                          className={classNames(
                            active ? 'bg-gray-50 text-gray-900' : 'text-gray-700',
                            'flex items-center px-4 py-2 text-sm transition-colors'
                          )}
                          onClick={close}
                        >
                          <FiSettings className="mr-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                          Settings
                        </Link>
                      )}
                    </Menu.Item>

                    <div className="border-t border-gray-100 my-1"></div>

                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={classNames(
                            active ? 'bg-gray-50 text-red-600' : 'text-gray-700',
                            'flex items-center w-full text-left px-4 py-2 text-sm transition-colors'
                          )}
                          disabled={authLoading}
                        >
                          <FiLogOut className="mr-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                          {authLoading ? 'Signing out...' : 'Sign out'}
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

      {/* Mobile error message */}
      {error && (
        <div className="md:hidden bg-red-50 border-t border-red-100 px-4 py-2" role="alert">
          <div className="flex items-center space-x-2 text-sm text-red-700">
            <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </nav>
  )
}