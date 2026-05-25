'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FiHome, 
  FiPlusCircle, 
  FiList, 
  FiArchive, 
  FiUsers, 
  FiSettings,
  FiAlertCircle,
  FiMenu,
  FiX,
  FiChevronRight,
  FiShield,
  FiUserCheck
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import Image from 'next/image'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar({ isOpen, onClose, collapsed, onCollapse }) {
  const pathname = usePathname()
  const { user, isLoading: authLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setMounted(true)
  }, [])

  // Handle escape key to close sidebar on mobile
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && window.innerWidth < 1024) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isClient) {
      if (isOpen && window.innerWidth < 1024) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, isClient])

  // Handle resize to auto-close on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen) {
        onClose()
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, onClose])

  if (!isClient) {
    return <div className="hidden lg:block lg:w-20 flex-shrink-0" aria-hidden="true" />
  }

  if (authLoading) {
    return (
      <div className="hidden lg:block lg:w-64 flex-shrink-0">
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg animate-pulse">
          <div className="h-16 border-b border-gray-200 px-4 flex items-center">
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Navigation definitions (same as before)
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome, description: 'Overview', roles: ['EMPLOYEE', 'MD','SUPER_ADMIN', 'SERVICE_TEAM'] },
    { name: 'New Ticket', href: '/tickets/new', icon: FiPlusCircle, description: 'Create', roles: ['EMPLOYEE', 'SUPER_ADMIN'] },
    { name: 'History', href: '/tickets/history', icon: FiArchive, description: 'History', roles: ['EMPLOYEE', 'ADMIN','MD', 'SUPER_ADMIN'] },
  ]

  const adminNavigation = [
    { name: 'Team Dashboard', href: '/admin', icon: FiUsers, description: 'Team', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'All Tickets', href: '/tickets/ticketlist', icon: FiList, description: 'All tickets', roles: ['ADMIN', 'SUPER_ADMIN'] },
  ]

  const superAdminNavigation = [
    { name: 'User Management', href: '/admin/users', icon: FiUserCheck, description: 'Users', roles: ['SUPER_ADMIN'] },
    { name: 'System Settings', href: '/admin/settings', icon: FiSettings, description: 'Settings', roles: ['SUPER_ADMIN'] },
    { name: 'Audit Logs', href: '/admin/audit', icon: FiShield, description: 'Audit', roles: ['SUPER_ADMIN'] },
    { name: 'Create Categories', href: '/admin/categories', icon: FiShield, description: 'Categories', roles: ['SUPER_ADMIN'] },
    { name: 'Add Services', href: '/admin/item-types', icon: FiShield, description: 'Services', roles: ['SUPER_ADMIN'] },
    { name: 'Reports', href: '/dashboard/reports/detailed', icon: FiList, description: 'Reports', roles: ['MD', 'SUPER_ADMIN'] },
  ]

  const filteredNavigation = [
    ...baseNavigation.filter(item => item.roles.includes(user?.role)),
    ...adminNavigation.filter(item => item.roles.includes(user?.role)),
    ...superAdminNavigation.filter(item => item.roles.includes(user?.role)),
  ]

  const mainNavItems = filteredNavigation.filter(item => !item.href.includes('/admin') || item.href === '/admin')
  const adminNavItems = filteredNavigation.filter(item => item.href.includes('/admin') && item.href !== '/admin')

  const isActive = (href) => {
    try {
      if (!pathname) return false
      if (href === '/dashboard') return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
      return pathname === href || pathname.startsWith(href + '/')
    } catch {
      return false
    }
  }

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) onClose()
  }

  const toggleCollapse = () => {
    onCollapse(!collapsed)
  }

  const getUserInitials = () => {
    try {
      if (user?.name) return user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      if (user?.email) return user.email[0].toUpperCase()
      return 'U'
    } catch {
      return 'U'
    }
  }

  const formatRole = (role) => {
    if (!role) return 'User'
    return role.replace('_', ' ').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={classNames(
          'fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={classNames(
          'fixed inset-y-0 left-0 transform transition-all duration-300 ease-in-out z-40',
          'bg-white shadow-sm',
          'flex flex-col border-r border-gray-200',
          collapsed ? 'w-16' : 'w-56',
          'top-16 h-[calc(100vh-4rem)]',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Sidebar navigation"
        role="complementary"
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between h-12 px-2 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-center w-full">
            {!collapsed && <span className="text-sm font-semibold text-gray-700">TicketFlow</span>}
            <Image
              src="/images/coupon.gif"
              alt="Logo"
              width={22}
              height={22}
              className="object-contain"
            />
          </div>
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-1 rounded text-gray-400 hover:text-gray-500 hover:bg-gray-50 focus:outline-none"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <FiChevronRight 
              className={classNames(
                'h-4 w-4 transition-transform duration-300',
                collapsed ? 'rotate-180' : ''
              )} 
            />
          </button>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded text-gray-400 hover:text-gray-500"
            aria-label="Close sidebar"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-2 mt-2 p-2 bg-red-50 border border-red-200 rounded text-[9px] text-red-700">
            <div className="flex items-center gap-1">
              <FiAlertCircle className="h-3 w-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-2">
          <nav className="space-y-4">
            {mainNavItems.length > 0 && (
              <div>
                {!collapsed && (
                  <h3 className="px-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Main
                  </h3>
                )}
                <ul className="space-y-0.5">
                  {mainNavItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            'group flex items-center rounded-md transition-all duration-200 text-[14px] font-medium',
                            active
                              ? 'bg-pink-50 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                            collapsed ? 'justify-center py-2 px-0' : 'px-2 py-1.5'
                          )}
                          onClick={handleLinkClick}
                          aria-current={active ? 'page' : undefined}
                          title={collapsed ? item.name : undefined}
                        >
                          <Icon
                            className={classNames(
                              'h-4 w-4 flex-shrink-0',
                              active
                                ? 'text-pink-600'
                                : 'text-gray-400 group-hover:text-gray-500',
                              collapsed ? 'mr-0' : 'mr-2'
                            )}
                            aria-hidden="true"
                          />
                          {!collapsed && (
                            <span className="flex-1 truncate">{item.name}</span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {adminNavItems.length > 0 && (
              <div>
                {!collapsed && (
                  <h3 className="px-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Admin
                  </h3>
                )}
                <ul className="space-y-0.5">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            'group flex items-center rounded-md transition-all duration-200 text-[11px] font-medium',
                            active
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                            collapsed ? 'justify-center py-2 px-0' : 'px-2 py-1.5'
                          )}
                          onClick={handleLinkClick}
                          aria-current={active ? 'page' : undefined}
                          title={collapsed ? item.name : undefined}
                        >
                          <Icon
                            className={classNames(
                              'h-4 w-4 flex-shrink-0',
                              active
                                ? 'text-primary-600'
                                : 'text-gray-400 group-hover:text-gray-500',
                              collapsed ? 'mr-0' : 'mr-2'
                            )}
                            aria-hidden="true"
                          />
                          {!collapsed && (
                            <span className="flex-1 truncate">{item.name}</span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </nav>
        </div>

        {/* User info footer */}
        <div className="flex-shrink-0 border-t border-gray-100 p-2">
          <div className={classNames('flex items-center', collapsed ? 'justify-center' : 'space-x-2')}>
            <div className="flex-shrink-0">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-[10px] font-medium">{getUserInitials()}</span>
              </div>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-800 truncate">{user?.name || user?.email}</p>
                <div className="flex items-center mt-0.5">
                  <span className={classNames(
                    'inline-block h-1.5 w-1.5 rounded-full mr-1',
                    user?.role === 'SUPER_ADMIN' ? 'bg-purple-500' : user?.role === 'ADMIN' ? 'bg-primary-500' : 'bg-green-500'
                  )} />
                  <p className="text-[8px] text-gray-500">{formatRole(user?.role)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Version info */}
        {!collapsed && (
          <div className="px-2 py-1 text-[7px] text-gray-300 border-t border-gray-50 text-center">
            v2.0.0
          </div>
        )}
      </aside>
    </>
  )
}