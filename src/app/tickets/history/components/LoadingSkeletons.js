import React from 'react'

export const TimelineSkeleton = () => (
  <div className="bg-white rounded border border-gray-200 p-3 space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex space-x-2">
        <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-2 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-2 bg-gray-200 rounded w-1/4 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
)

export const GridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded border border-gray-200 p-2 space-y-2">
        <div className="flex justify-between">
          <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-2 w-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-2 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="flex gap-1">
          <div className="h-2 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-2 w-8 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex justify-between pt-1.5 border-t border-gray-100">
          <div className="h-2 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-2 w-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    ))}
  </div>
)

export const StatsSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-gray-50 rounded p-1.5">
        <div className="h-2 w-8 bg-gray-200 rounded animate-pulse mb-1" />
        <div className="h-3 w-6 bg-gray-200 rounded animate-pulse" />
      </div>
    ))}
  </div>
)

// Add default export if needed
export default {
  TimelineSkeleton,
  GridSkeleton,
  StatsSkeleton
}