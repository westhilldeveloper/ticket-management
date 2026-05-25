import { FiMessageSquare, FiSend, FiUser } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'

export default function ReviewsSection({
  user,
  review,
  setReview,
  handleAdminAction,
  submitting,
  reviews,
}) {
  return (
    <div className="p-3">
      <h3 className="text-xs font-medium text-gray-800 mb-2 flex items-center">
        <FiMessageSquare className="mr-1.5 w-3.5 h-3.5" />
        Messages & Reviews
      </h3>

      {/* Add Message Form */}
      {user && (
        <div className="mb-3">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Add a message..."
            className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded focus:outline-none focus:border-primary-300"
            rows="6"
          />
          <div className="mt-1 flex justify-end">
            <button
              onClick={() => handleAdminAction('MESSAGE')}
              disabled={submitting || !review.trim()}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-[9px] font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="small" /> : (
                <>
                  <FiSend className="w-3 h-3" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-2">
        {reviews?.map((reviewItem, index) => (
          <div key={reviewItem.id || index} className="border-l-2 border-primary-200 bg-gray-50 p-2 rounded-r">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <FiUser className="h-3 w-3 text-primary-600" />
                </div>
                <div className="ml-2">
                  <p className="text-[10px] font-medium text-gray-800">
                    {reviewItem.createdBy?.name || 'System'}
                  </p>
                  <p className="text-[8px] text-gray-500">
                    {reviewItem.createdBy?.role || 'System'} • {formatDistanceToNow(new Date(reviewItem.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <span className="text-[8px] px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                {reviewItem.reviewType.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[10px] text-gray-700 whitespace-pre-wrap">
              {reviewItem.content}
            </p>
          </div>
        ))}

        {(!reviews || reviews.length === 0) && (
          <p className="text-center text-[9px] text-gray-400 py-2">
            No messages yet
          </p>
        )}
      </div>
    </div>
  )
}