'use client'

import { useState } from 'react'
import {
  FiUser,
  FiMessageSquare,
  FiSend,
  FiStar,
  FiThumbsUp,
  FiClock
} from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'

export default function ReviewSection({ ticket, onAddReview }) {
  const [newReview, setNewReview] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newReview.trim()) return

    setSubmitting(true)
    await onAddReview(newReview)
    setNewReview('')
    setSubmitting(false)
  }

  const getReviewTypeIcon = (type) => {
    switch (type) {
      case 'TICKET_CREATION':
        return <FiStar className="h-4 w-4 text-yellow-500" />
      case 'ADMIN_REVIEW':
        return <FiUser className="h-4 w-4 text-blue-500" />
      case 'MD_REVIEW':
        return <FiThumbsUp className="h-4 w-4 text-purple-500" />
      case 'STATUS_UPDATE':
        return <FiClock className="h-4 w-4 text-green-500" />
      default:
        return <FiMessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getReviewTypeColor = (type) => {
    switch (type) {
      case 'TICKET_CREATION':
        return 'bg-yellow-100 text-yellow-800'
      case 'ADMIN_REVIEW':
        return 'bg-blue-100 text-blue-800'
      case 'MD_REVIEW':
        return 'bg-purple-100 text-purple-800'
      case 'STATUS_UPDATE':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FiMessageSquare className="mr-2" />
          Reviews & Comments
        </h3>
      </div>

      {/* Add Review Form */}
      <div className="p-6 border-b border-gray-200">
        <form onSubmit={handleSubmit}>
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Add a review or comment..."
            className="input-field w-full"
            rows="3"
            disabled={submitting}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newReview.trim()}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? (
                'Posting...'
              ) : (
                <>
                  <FiSend className="mr-2" />
                  Post Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      <div className="p-6">
        {ticket.reviews && ticket.reviews.length > 0 ? (
          <div className="space-y-4">
            {ticket.reviews.map((review, index) => (
              <div
                key={review.id || index}
                className="border-l-4 border-primary-200 bg-gray-50 p-4 rounded-r-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      {getReviewTypeIcon(review.reviewType)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {review.createdBy?.name || 'System'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {review.createdBy?.role || 'System'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getReviewTypeColor(review.reviewType)}`}>
                      {review.reviewType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap ml-11">
                  {review.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Be the first to add a comment
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {ticket.reviews && ticket.reviews.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                Total Reviews: <span className="font-medium text-gray-900">{ticket.reviews.length}</span>
              </span>
              <span className="text-gray-600">
                Last Review: <span className="font-medium text-gray-900">
                  {formatDistanceToNow(new Date(ticket.reviews[0].createdAt), { addSuffix: true })}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}