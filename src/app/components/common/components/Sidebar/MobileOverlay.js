'use client'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function MobileOverlay({ isOpen, onClose }) {
  return (
    <div
      className={classNames(
        'fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
      aria-hidden="true"
    />
  )
}