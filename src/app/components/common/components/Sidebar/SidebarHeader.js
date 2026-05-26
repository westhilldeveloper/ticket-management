'use client'

import { FiChevronRight, FiX } from 'react-icons/fi'
import Image from 'next/image'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function SidebarHeader({ collapsed, onToggleCollapse, onClose }) {
  return (
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
        onClick={onToggleCollapse}
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
  )
}