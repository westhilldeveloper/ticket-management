'use client'

import { Fragment, useState, useEffect } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useAuth } from '../../../../context/AuthContext'
import MenuButton from './MenuButton'
import Logo from './Logo'
import ErrorAlert from './ErrorAlert'
import NotificationsButton from './NotificationsButton'
import NotificationsDropdown from './NotificationsDropdown'
import UserMenu from './UserMenu'
import MobileErrorAlert from './MobileErrorAlert'

export default function Navbar({ onMenuClick }) {
  const { user, logout, isLoading: authLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  

  useEffect(() => {
    setIsClient(true)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=50&daily=true', { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

 useEffect(() => {
  if (!user) return
  fetchNotifications()
  const interval = setInterval(fetchNotifications, 30000)
  return () => clearInterval(interval)
}, [user])

  const handleLogout = async () => {
    try {
      setError(null)
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      setError('Failed to log out. Please try again.')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
  }

const markAsRead = async (notificationId) => {
  try {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: [notificationId] }),
      credentials: 'include'
    })
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  } catch (err) {
    console.error('Mark read error:', err)
  }
}

const markAllAsRead = async () => {
  try {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
      credentials: 'include'
    })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  } catch (err) {
    console.error('Mark all error:', err)
  }
}

  // Don't render until after hydration to prevent mismatch
  if (!isClient) {
    return (
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30" aria-label="Main navigation">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="lg:hidden w-10 h-10" />
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-semibold text-gray-900">Ticket Management System</h1>
              </div>
            </div>
            <div className="w-24" />
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
            <MenuButton onMenuClick={onMenuClick} />
            <Logo />
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            <ErrorAlert error={error} />
            <NotificationsButton
              unreadCount={unreadCount}
              onClick={handleNotificationClick}
            />
            <UserMenu user={user} onLogout={handleLogout} authLoading={authLoading} />
          </div>
        </div>
      </div>

      {/* Notifications dropdown - positioned globally */}
      <NotificationsDropdown
        show={showNotifications}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onClose={() => setShowNotifications(false)}
      />

      {/* Mobile error message */}
      <MobileErrorAlert error={error} />
    </nav>
  )
}