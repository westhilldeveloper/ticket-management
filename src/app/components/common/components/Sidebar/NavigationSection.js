'use client'

import NavItem from './NavItem'

export default function NavigationSection({ title, items, collapsed, isActive, onLinkClick }) {
  if (items.length === 0) return null

  return (
    <div>
      {!collapsed && (
        <h3 className="px-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {title}
        </h3>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            collapsed={collapsed}
            isActive={isActive(item.href)}
            onClick={onLinkClick}
          />
        ))}
      </ul>
    </div>
  )
}