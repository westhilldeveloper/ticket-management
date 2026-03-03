import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export const Pagination = ({ pagination, onPageChange }) => {
  if (pagination.totalPages <= 1) return null

  return (
    <div className="px-2.5 py-1.5 bg-gray-50 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <p className="text-[7px] text-gray-500">
          {((pagination.page - 1) * pagination.limit) + 1}-
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </p>
        <div className="flex items-center space-x-0.5">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white rounded disabled:opacity-40"
          >
            <FiChevronLeft className="h-3 w-3" />
          </button>
          <span className="text-[7px] text-gray-600 px-1">
            {pagination.page}/{pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white rounded disabled:opacity-40"
          >
            <FiChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}