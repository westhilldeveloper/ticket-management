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
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <FiMessageSquare className="mr-2" />
        Messages & Reviews
      </h3>

      {/* Add Message Form */}
      {user && (
        <div className="mb-6">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Add a message..."
            className="input-field w-full"
            rows="2"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => handleAdminAction('MESSAGE')}
              disabled={submitting || !review.trim()}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="small" /> : (
                <>
                  <FiSend className="mr-2" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews?.map((reviewItem, index) => (
          <div key={reviewItem.id || index} className="border-l-4 border-primary-200 bg-gray-50 p-4 rounded-r-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <FiUser className="h-4 w-4 text-primary-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {reviewItem.createdBy?.name || 'System'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {reviewItem.createdBy?.role || 'System'} • {formatDistanceToNow(new Date(reviewItem.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                {reviewItem.reviewType.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {reviewItem.content}
            </p>
          </div>
        ))}

        {(!reviews || reviews.length === 0) && (
          <p className="text-center text-gray-500 py-4">
            No messages yet
          </p>
        )}
      </div>
    </div>
  )
}