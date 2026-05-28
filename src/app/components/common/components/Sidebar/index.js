'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { 
  FiHome, FiPlusCircle, FiArchive, FiUsers, FiSettings,
  FiShield, FiUserCheck, FiList, FiTrash2
} from 'react-icons/fi'
import { useAuth } from '../../../../context/AuthContext'
import MobileOverlay from './MobileOverlay'
import SidebarHeader from './SidebarHeader'
import ErrorAlert from './ErrorAlert'
import NavigationSection from './NavigationSection'
import UserInfoFooter from './UserInfoFooter'
import VersionInfo from './VersionInfo'
import LoadingSkeleton from './LoadingSkeleton'

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
    return <LoadingSkeleton />
  }

  if (!user) return null

  // Navigation definitions
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome, description: 'Overview', roles: ['EMPLOYEE', 'MD','SUPER_ADMIN', 'SERVICE_TEAM'] },
    { name: 'New Ticket', href: '/tickets/new', icon: FiPlusCircle, description: 'Create', roles: ['EMPLOYEE', 'SUPER_ADMIN'] },
    { name: 'History', href: '/tickets/history', icon: FiArchive, description: 'History', roles: ['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN'] },
  ]

  const adminNavigation = [
    { name: 'Team Dashboard', href: '/admin', icon: FiUsers, description: 'Team', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'All Tickets', href: '/tickets/ticketlist', icon: FiList, description: 'All tickets', roles: ['ADMIN', 'SUPER_ADMIN'] },
  ]

  const superAdminNavigation = [
    { name: 'User Management', href: '/admin/users', icon: FiUserCheck, description: 'Users', roles: ['SUPER_ADMIN'] },
  
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: FiShield, description: 'Audit', roles: ['SUPER_ADMIN'] },
    { name: 'Create Categories', href: '/admin/categories', icon: FiShield, description: 'Categories', roles: ['SUPER_ADMIN'] },
    { name: 'Add Services', href: '/admin/item-types', icon: FiShield, description: 'Services', roles: ['SUPER_ADMIN'] },
    { name: 'Reports', href: '/dashboard/reports/detailed', icon: FiList, description: 'Reports', roles: ['MD', 'SUPER_ADMIN'] },
    { name: 'Tickets', href: '/admin/ticket-cleanup', icon: FiTrash2, description: 'Tickets', roles: [ 'SUPER_ADMIN'] },
      { name: 'System Settings', href: '/admin/settings', icon: FiSettings, description: 'Settings', roles: ['SUPER_ADMIN'] },
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
      <MobileOverlay isOpen={isOpen} onClose={onClose} />
      
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
        <SidebarHeader 
          collapsed={collapsed} 
          onToggleCollapse={toggleCollapse} 
          onClose={onClose} 
        />
        
        {error && <ErrorAlert error={error} />}
        
        <div className="flex-1 overflow-y-auto py-3 px-2">
          <nav className="space-y-4">
            {mainNavItems.length > 0 && (
              <NavigationSection
                title="Main"
                items={mainNavItems}
                collapsed={collapsed}
                isActive={isActive}
                onLinkClick={handleLinkClick}
              />
            )}
            
            {adminNavItems.length > 0 && (
              <NavigationSection
                title="Admin"
                items={adminNavItems}
                collapsed={collapsed}
                isActive={isActive}
                onLinkClick={handleLinkClick}
              />
            )}
          </nav>
        </div>
        
        <UserInfoFooter 
          collapsed={collapsed}
          user={user}
          getUserInitials={getUserInitials}
          formatRole={formatRole}
        />
        
        <VersionInfo collapsed={collapsed} />
      </aside>
    </>
  )
}