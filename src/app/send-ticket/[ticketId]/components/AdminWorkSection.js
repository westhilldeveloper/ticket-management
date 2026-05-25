import { FiTool, FiRefreshCw, FiShoppingCart, FiCheckCircle } from 'react-icons/fi'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'

export default function AdminWorkSection({
  isAdmin,
  ticket,
  selectedAction,
  setSelectedAction,
  review,
  setReview,
  handleWorkUpdate,
  submitting,
}) {
  if (!isAdmin || ticket.status !== 'APPROVED_BY_MD') return null

  return (
    <div className="p-3 border-b border-gray-100 bg-green-50">
      <h3 className="text-xs font-medium text-gray-800 mb-2 flex items-center">
        <FiTool className="mr-1.5 text-green-600 w-3.5 h-3.5" />
        Work on Ticket
      </h3>

      {!selectedAction ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <button
            onClick={() => setSelectedAction('WORK')}
            className="p-2 bg-white rounded border border-gray-200 hover:border-blue-400 text-left"
          >
            <FiRefreshCw className="w-4 h-4 text-blue-600 mb-0.5" />
            <p className="text-[10px] font-medium">Start Working</p>
          </button>
          <button
            onClick={() => setSelectedAction('PURCHASE')}
            className="p-2 bg-white rounded border border-gray-200 hover:border-orange-400 text-left"
          >
            <FiShoppingCart className="w-4 h-4 text-orange-600 mb-0.5" />
            <p className="text-[10px] font-medium">Purchase Required</p>
          </button>
          <button
            onClick={() => setSelectedAction('RESOLVE')}
            className="p-2 bg-white rounded border border-gray-200 hover:border-green-400 text-left"
          >
            <FiCheckCircle className="w-4 h-4 text-green-600 mb-0.5" />
            <p className="text-[10px] font-medium">Mark Resolved</p>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded p-2">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder={`Add details about ${selectedAction.toLowerCase()}...`}
            className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded mb-2"
            rows="2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleWorkUpdate(selectedAction)}
              disabled={submitting}
              className="flex-1 px-2 py-1 bg-primary-600 text-white rounded text-[9px] font-medium hover:bg-primary-700"
            >
              {submitting ? <LoadingSpinner size="small" /> : 'Update'}
            </button>
            <button
              onClick={() => setSelectedAction(null)}
              className="px-2 py-1 border border-gray-300 rounded text-[9px] text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}