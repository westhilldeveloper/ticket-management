'use client'

export default function VersionInfo({ collapsed }) {
  if (collapsed) return null

  return (
    <div className="px-2 py-1 text-[7px] text-gray-300 border-t border-gray-50 text-center">
      v2.0.0
    </div>
  )
}