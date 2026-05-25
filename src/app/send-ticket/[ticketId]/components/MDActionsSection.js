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
    <div className="p-3 border-b border-gray-100 bg-purple-50">
      <h3 className="text-xs font-medium text-gray-800 mb-2 flex items-center">
        <FiThumbsUp className="mr-1.5 text-purple-600 w-3.5 h-3.5" />
        MD Approval Required
      </h3>

      {ticket.reviews?.length > 0 && (
        <div className="mb-2 p-2 bg-white rounded">
          <p className="text-[10px] font-medium text-gray-700 mb-0.5">Admin Review:</p>
          <p className="text-[10px] text-gray-600">{ticket.reviews[0]?.content}</p>
        </div>
      )}

      {!mdDecision ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMdDecision('approve')}
            className="p-2 bg-white rounded border border-green-200 hover:border-green-400 transition-colors"
          >
            <FiThumbsUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-[10px] font-medium text-gray-700">Approve</p>
          </button>
          <button
            onClick={() => setMdDecision('reject')}
            className="p-2 bg-white rounded border border-red-200 hover:border-red-400 transition-colors"
          >
            <FiThumbsDown className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-[10px] font-medium text-gray-700">Reject</p>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded p-2">
          <div className="mb-2">
            {mdDecision === 'approve' ? (
              <p className="text-[10px] text-gray-600">Confirm approval of this ticket?</p>
            ) : (
              <textarea
                value={mdReview}
                onChange={(e) => setMdReview(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"
                rows="2"
              />
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleMDDecision(mdDecision === 'approve')}
              disabled={submitting}
              className={`flex-1 px-2 py-1 rounded text-[9px] font-medium text-white ${
                mdDecision === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {submitting ? <LoadingSpinner size="small" /> : 'Confirm'}
            </button>
            <button
              onClick={() => setMdDecision(null)}
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