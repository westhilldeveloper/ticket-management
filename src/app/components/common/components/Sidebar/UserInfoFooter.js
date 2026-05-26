'use client'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function UserInfoFooter({ collapsed, user, getUserInitials, formatRole }) {
  return (
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
  )
}