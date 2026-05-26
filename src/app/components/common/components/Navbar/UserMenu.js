'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import Link from 'next/link'
import { FiUser, FiChevronDown, FiCircle, FiLogOut } from 'react-icons/fi'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function UserMenu({ user, onLogout, authLoading }) {
  if (!user) return null

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="flex items-center space-x-3 p-1.5 rounded-lg bg-gray-200 hover:bg-gray-100 focus:outline-none transition-colors"
        aria-label="User menu"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-sm">
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
          <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-500">
            {` ${user?.role} ` || ' '}
            {` (${user?.department})` || 'Employee'}
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
        <Menu.Items className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {/* Mobile user info header */}
            <div className="px-4 py-3 border-b border-gray-100 md:hidden">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{user?.role}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
            </div>

            <Menu.Item>
              {({ active, close }) => (
                <Link
                  href="/dashboard/profile"
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

            <div className="border-t border-gray-100 my-1"></div>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onLogout}
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
  )
}