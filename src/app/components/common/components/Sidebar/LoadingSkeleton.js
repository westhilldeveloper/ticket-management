'use client'

export default function LoadingSkeleton() {
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