import { FiThumbsUp, FiThumbsDown, FiXCircle } from 'react-icons/fi'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'

export default function MDActionsSection({
  isMD,
  ticket,
  mdDecision,
  setMdDecision,
  mdReview,
  setMdReview,
  handleMDDecision,
  submitting,
}) {
  if (!isMD || ticket.status !== 'PENDING_MD_APPROVAL') return null

  return (
    <div className="p-6 border-b border-gray-200 bg-purple-50">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <FiThumbsUp className="mr-2 text-purple-600" />
        MD Approval Required
      </h3>

      {ticket.reviews?.length > 0 && (
        <div className="mb-4 p-4 bg-white rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Admin Review:</p>
          <p className="text-sm text-gray-600">{ticket.reviews[0]?.content}</p>
        </div>
      )}

      {!mdDecision ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMdDecision('approve')}
            className="p-4 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors"
          >
            <FiThumbsUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Approve</p>
          </button>
          <button
            onClick={() => setMdDecision('reject')}
            className="p-4 bg-white rounded-lg border-2 border-red-200 hover:border-red-400 transition-colors"
          >
            <FiThumbsDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Reject</p>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4">
          <div className="mb-4">
            {mdDecision === 'approve' ? (
              <p className="text-sm text-gray-600">
                Are you sure you want to approve this ticket?
              </p>
            ) : (
              <textarea
                value={mdReview}
                onChange={(e) => setMdReview(e.target.value)}
                placeholder="Please provide reason for rejection..."
                className="input-field w-full"
                rows="3"
              />
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleMDDecision(mdDecision === 'approve')}
              disabled={submitting}
              className={`flex-1 px-4 py-2 rounded-lg text-white ${
                mdDecision === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {submitting ? <LoadingSpinner size="small" /> : 'Confirm'}
            </button>
            <button
              onClick={() => setMdDecision(null)}
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