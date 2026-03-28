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
    <div className="p-6 border-b border-gray-200 bg-green-50">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <FiTool className="mr-2 text-green-600" />
        Work on Ticket
      </h3>

      {!selectedAction ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => setSelectedAction('WORK')}
            className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-400 text-left"
          >
            <FiRefreshCw className="h-5 w-5 text-blue-600 mb-1" />
            <p className="text-sm font-medium">Start Working</p>
          </button>
          <button
            onClick={() => setSelectedAction('PURCHASE')}
            className="p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-400 text-left"
          >
            <FiShoppingCart className="h-5 w-5 text-orange-600 mb-1" />
            <p className="text-sm font-medium">Purchase Required</p>
          </button>
          <button
            onClick={() => setSelectedAction('RESOLVE')}
            className="p-3 bg-white rounded-lg border border-gray-200 hover:border-green-400 text-left"
          >
            <FiCheckCircle className="h-5 w-5 text-green-600 mb-1" />
            <p className="text-sm font-medium">Mark Resolved</p>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder={`Add details about ${selectedAction.toLowerCase()}...`}
            className="input-field w-full mb-3"
            rows="2"
          />
          <div className="flex space-x-3">
            <button
              onClick={() => handleWorkUpdate(selectedAction)}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {submitting ? <LoadingSpinner size="small" /> : 'Update'}
            </button>
            <button
              onClick={() => setSelectedAction(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}