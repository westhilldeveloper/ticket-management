'use client'

import Link from 'next/link'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function NavItem({ item, collapsed, isActive, onClick }) {
  const Icon = item.icon

  return (
    <li>
      <Link
        href={item.href}
        className={classNames(
          'group flex items-center rounded-md transition-all duration-200 text-[14px] font-medium',
          isActive
            ? 'bg-pink-50 text-primary-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          collapsed ? 'justify-center py-2 px-0' : 'px-2 py-1.5'
        )}
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        title={collapsed ? item.name : undefined}
      >
        <Icon
          className={classNames(
            'h-4 w-4 flex-shrink-0',
            isActive
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
}