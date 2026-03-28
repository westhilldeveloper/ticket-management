import { FiBriefcase, FiCheckCircle, FiThumbsUp, FiExternalLink, FiUserPlus, FiXCircle, FiInfo } from 'react-icons/fi'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import { useState } from 'react'

export default function AdminActionsSection({
  isAdmin,
  ticket,
  selectedAction,
  setSelectedAction,
  adminReview,
  setAdminReview,
  thirdPartyDetails,
  setThirdPartyDetails,
  thirdPartyStatus,
  setThirdPartyStatus,
  serviceTeamMembers,
  selectedServiceUserId,
  setSelectedServiceUserId,
  handleAdminAction,
  submitting,
}) {
  if (!isAdmin) return null

  const isClosed = ticket?.status === 'CLOSED'
  const isOpen = ticket?.status === 'OPEN'
  const [showResolveForm, setShowResolveForm] = useState(false)
const [resolutionComment, setResolutionComment] = useState('')

  // Pending statuses and which action they correspond to
  const pendingStatuses = [
    'PENDING_MD_APPROVAL',
    'PENDING_THIRD_PARTY',
    'PENDING_SERVICE_ACCEPTANCE',
    'SERVICE_IN_PROGRESS'
  ]

  const statusToAction = {
    'PENDING_MD_APPROVAL': 'FORWARD_TO_MD',
    'PENDING_THIRD_PARTY': 'THIRD_PARTY',
    'PENDING_SERVICE_ACCEPTANCE': 'ASSIGN_TO_SERVICE',
    'SERVICE_IN_PROGRESS': 'ASSIGN_TO_SERVICE',
  }

  const isPending = ticket?.status && pendingStatuses.includes(ticket.status)
  const pendingAction = isPending ? statusToAction[ticket.status] : null

  const getHighlightedAction = (status) => {
    switch (status) {
      case 'OPEN':
        return 'CONFIRM'
      case 'PENDING_MD_APPROVAL':
        return 'FORWARD_TO_MD'
      case 'PENDING_THIRD_PARTY':
        return 'THIRD_PARTY'
      case 'PENDING_SERVICE_ACCEPTANCE':
      case 'SERVICE_IN_PROGRESS':
        return 'ASSIGN_TO_SERVICE'
      default:
        return null
    }
  }

  const highlightedAction = ticket ? getHighlightedAction(ticket.status) : null

  const actionButtons = [
    { action: 'CONFIRM', icon: FiCheckCircle, color: 'text-green-600', border: 'border-green-200', hover: 'hover:border-green-400', title: 'Confirm Receipt', desc: 'Acknowledge ticket receipt' },
    { action: 'FORWARD_TO_MD', icon: FiThumbsUp, color: 'text-purple-600', border: 'border-purple-200', hover: 'hover:border-purple-400', title: 'Forward to MD', desc: 'Request MD approval' },
    { action: 'THIRD_PARTY', icon: FiExternalLink, color: 'text-orange-600', border: 'border-orange-200', hover: 'hover:border-orange-400', title: 'Third Party', desc: 'Request external service' },
    { action: 'ASSIGN_TO_SERVICE', icon: FiUserPlus, color: 'text-indigo-600', border: 'border-indigo-200', hover: 'hover:border-indigo-400', title: 'Assign to Service Team', desc: 'Send to internal service team' },
  ]

  // Show third‑party details only when the ticket is pending third party
  const showThirdPartyDetails = ticket?.status === 'PENDING_THIRD_PARTY' && ticket?.thirdPartyDetails

  // Handler for resolving third‑party ticket
  const handleResolveThirdParty = () => {
    if (window.confirm('Mark this ticket as resolved? This will set the status to SERVICE_RESOLVED and unlock further actions.')) {
      handleAdminAction('SERVICE_RESOLVED')
    }
  }

  return (
    <div className="p-6 border-b border-gray-200 bg-blue-50">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <FiBriefcase className="mr-2 text-blue-600" />
        Admin Actions
      </h3>

      {!selectedAction ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {actionButtons.map((btn) => {
              let isDisabled = false
              let disabledReason = ''

              if (isClosed) {
                isDisabled = true
                disabledReason = 'closed'
              } else if (isOpen) {
                // Only confirm is enabled when open
                if (btn.action === 'CONFIRM') {
                  isDisabled = false
                } else {
                  isDisabled = true
                  disabledReason = 'stillOpen'
                }
              } else if (isPending) {
                // If ticket is pending some department, only that department's button is enabled
                if (btn.action === pendingAction) {
                  isDisabled = false
                } else {
                  isDisabled = true
                  disabledReason = 'alreadyPending'
                }
              } else {
                // No restrictions, all enabled (except confirm which is only for OPEN)
                if (btn.action === 'CONFIRM') {
                  isDisabled = true  // Confirm not allowed when not open
                  disabledReason = 'notOpen'
                } else {
                  isDisabled = false
                }
              }

              // Determine if the button should be highlighted (recommended action)
              const isHighlighted = highlightedAction === btn.action && !isDisabled

              // Build styles
              let buttonClass = 'p-4 rounded-lg border-2 transition-colors text-left '

              if (isHighlighted && !isDisabled) {
                buttonClass += 'border-blue-500 bg-green-600 shadow-md '
              } else if (isDisabled) {
                const disabledStyles = {
                  closed: 'border-red-300 bg-red-500 text-red-400 cursor-not-allowed',
                  stillOpen: 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed',
                  alreadyPending: 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed',
                  notOpen: 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed',
                }
                buttonClass += disabledStyles[disabledReason] || 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
              } else {
                buttonClass += `${btn.border} ${btn.hover}`
              }

              // Text/icon colors
              let iconClass = `h-6 w-6 mb-2 `
              let titleClass = 'font-medium '
              let descClass = 'text-xs mt-1 '

              if (isHighlighted && !isDisabled) {
                iconClass += 'text-white'
                titleClass += 'text-white'
                descClass += 'text-white'
              } else if (isDisabled) {
                iconClass += 'text-gray-400'
                titleClass += 'text-gray-400'
                descClass += 'text-gray-400'
              } else {
                iconClass += btn.color
                titleClass += 'text-gray-900'
                descClass += 'text-gray-500'
              }

              return (
                <button
                  key={btn.action}
                  onClick={() => !isDisabled && setSelectedAction(btn.action)}
                  disabled={isDisabled}
                  className={buttonClass}
                >
                  <btn.icon className={iconClass} />
                  <h4 className={titleClass}>{btn.title}</h4>
                  <p className={descClass}>{btn.desc}</p>
                </button>
              )
            })}
          </div>

          {showThirdPartyDetails && (
  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
    <div className="flex items-start space-x-2">
      <FiInfo className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-700 mb-1">
          Third‑Party Details
        </p>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">
          {ticket.thirdPartyDetails}
        </p>
      </div>
      {/* Resolution section */}
    {!showResolveForm ? (
      <button
        onClick={() => setShowResolveForm(true)}
        disabled={submitting}
        className="mt-3 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
      >
        Mark as Resolved
      </button>
    ) : (
      <div className="mt-3 space-y-2">
        <textarea
          value={adminReview}
          onChange={(e) => setAdminReview(e.target.value)}
          placeholder="Add a resolution comment..."
          className="input-field w-full text-sm"
          rows="2"
        />
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (!adminReview.trim()) {
                toast.error('Please add a resolution comment')
                return
              }
              // Call handleAdminAction with SERVICE_RESOLVED and the comment
              handleAdminAction('PENDING_THIRD_PARTY', adminReview)
              setShowResolveForm(false)
              setResolutionComment('')
            }}
            disabled={submitting}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Confirm Resolution
          </button>
          <button
            onClick={() => {
              setShowResolveForm(false)
              setResolutionComment('')
            }}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    )}
    </div>

    
  </div>
)}
        </>
      ) : (
        // Selected action form
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900">
              {selectedAction === 'CONFIRM' && 'Confirm Ticket Receipt'}
              {selectedAction === 'FORWARD_TO_MD' && 'Forward to MD for Approval'}
              {selectedAction === 'THIRD_PARTY' && 'Request Third Party Service'}
              {selectedAction === 'ASSIGN_TO_SERVICE' && 'Assign to Service Team'}
            </h4>
            <button
              onClick={() => setSelectedAction(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiXCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {selectedAction === 'CONFIRM' && (
              <p className="text-sm text-gray-600">
                Are you sure you want to confirm receipt of this ticket?
              </p>
            )}

            {selectedAction === 'FORWARD_TO_MD' && (
              <textarea
                value={adminReview}
                onChange={(e) => setAdminReview(e.target.value)}
                placeholder="Add your review/recommendation for MD..."
                className="input-field w-full"
                rows="3"
              />
            )}

            {selectedAction === 'THIRD_PARTY' && (
              <>
                <select
                  value={thirdPartyStatus}
                  onChange={(e) => setThirdPartyStatus(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="PENDING">Pending</option>
                  <option value="QUOTATION">Quotation Requested</option>
                  <option value="PURCHASE">Purchase Required</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  {/* CLOSED option removed */}
                </select>
                <textarea
                  value={thirdPartyDetails}
                  onChange={(e) => setThirdPartyDetails(e.target.value)}
                  placeholder="Serial No/ Details about third party service"
                  className="input-field w-full"
                  rows="1"
                />
                <textarea
                  value={adminReview}
                  onChange={(e) => setAdminReview(e.target.value)}
                  placeholder="Add your review/comments..."
                  className="input-field w-full"
                  rows="2"
                />
              </>
            )}

            {selectedAction === 'ASSIGN_TO_SERVICE' && (
              <>
                <select
                  value={selectedServiceUserId}
                  onChange={(e) => setSelectedServiceUserId(e.target.value)}
                  className="input-field w-full"
                  required
                >
                  <option value="">Select a service team member</option>
                  {serviceTeamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
                <textarea
                  value={adminReview}
                  onChange={(e) => setAdminReview(e.target.value)}
                  placeholder="Add instructions/review for the service team..."
                  className="input-field w-full"
                  rows="3"
                />
              </>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => handleAdminAction(selectedAction)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? <LoadingSpinner size="small" /> : 'Confirm'}
              </button>
              <button
                onClick={() => setSelectedAction(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}