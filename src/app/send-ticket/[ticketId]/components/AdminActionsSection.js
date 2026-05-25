import { FiBriefcase, FiCheckCircle, FiThumbsUp, FiExternalLink, FiUserPlus, FiXCircle, FiInfo } from 'react-icons/fi'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'
import { useState } from 'react'
import toast from 'react-hot-toast'

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
      case 'OPEN': return 'CONFIRM'
      case 'PENDING_MD_APPROVAL': return 'FORWARD_TO_MD'
      case 'PENDING_THIRD_PARTY': return 'THIRD_PARTY'
      case 'PENDING_SERVICE_ACCEPTANCE':
      case 'SERVICE_IN_PROGRESS': return 'ASSIGN_TO_SERVICE'
      default: return null
    }
  }

  const highlightedAction = ticket ? getHighlightedAction(ticket.status) : null

  const actionButtons = [
    { action: 'CONFIRM', icon: FiCheckCircle, color: 'text-green-600', border: 'border-green-200', hover: 'hover:border-green-400', title: 'Confirm Receipt', desc: 'Acknowledge ticket receipt' },
    { action: 'FORWARD_TO_MD', icon: FiThumbsUp, color: 'text-purple-600', border: 'border-purple-200', hover: 'hover:border-purple-400', title: 'Forward to MD', desc: 'Request MD approval' },
    { action: 'THIRD_PARTY', icon: FiExternalLink, color: 'text-orange-600', border: 'border-orange-200', hover: 'hover:border-orange-400', title: 'Third Party', desc: 'Request external service' },
    { action: 'ASSIGN_TO_SERVICE', icon: FiUserPlus, color: 'text-indigo-600', border: 'border-indigo-200', hover: 'hover:border-indigo-400', title: 'Assign to Service Team', desc: 'Send to internal service team' },
  ]

  const showThirdPartyDetails = ticket?.status === 'PENDING_THIRD_PARTY' && ticket?.thirdPartyDetails

  return (
    <div className="p-3 border-b border-gray-100 bg-blue-50">
      <h3 className="text-xs font-medium text-gray-800 mb-2 flex items-center">
        <FiBriefcase className="mr-1.5 text-blue-600 w-3.5 h-3.5" />
        Admin Actions
      </h3>

      {!selectedAction ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {actionButtons.map((btn) => {
              let isDisabled = false
              let disabledReason = ''

              if (isClosed) {
                isDisabled = true
                disabledReason = 'closed'
              } else if (isOpen) {
                if (btn.action === 'CONFIRM') {
                  isDisabled = false
                } else {
                  isDisabled = true
                  disabledReason = 'stillOpen'
                }
              } else if (isPending) {
                if (btn.action === pendingAction) {
                  isDisabled = false
                } else {
                  isDisabled = true
                  disabledReason = 'alreadyPending'
                }
              } else {
                if (btn.action === 'CONFIRM') {
                  isDisabled = true
                  disabledReason = 'notOpen'
                } else {
                  isDisabled = false
                }
              }

              const isHighlighted = highlightedAction === btn.action && !isDisabled

              let buttonClass = 'p-2 rounded border transition-colors text-left '
              if (isHighlighted && !isDisabled) {
                buttonClass += 'border-blue-500 bg-green-600 shadow-sm '
              } else if (isDisabled) {
                const disabledStyles = {
                  closed: 'border-red-300 bg-red-50 text-red-300 cursor-not-allowed',
                  stillOpen: 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed',
                  alreadyPending: 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed',
                  notOpen: 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed',
                }
                buttonClass += disabledStyles[disabledReason] || 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
              } else {
                buttonClass += `${btn.border} ${btn.hover}`
              }

              let iconClass = `w-4 h-4 mb-1 `
              let titleClass = 'text-[10px] font-medium '
              let descClass = 'text-[9px] mt-0.5 '

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
                titleClass += 'text-gray-800'
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
            <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-start gap-1.5">
                <FiInfo className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[9px] font-medium text-gray-700 mb-0.5">Third‑Party Details</p>
                  <p className="text-[10px] text-gray-600 whitespace-pre-wrap">{ticket.thirdPartyDetails}</p>
                </div>
                {!showResolveForm ? (
                  <button
                    onClick={() => setShowResolveForm(true)}
                    disabled={submitting}
                    className="text-[9px] bg-green-600 text-white px-2 py-0.5 rounded hover:bg-green-700"
                  >
                    Resolve
                  </button>
                ) : (
                  <div className="mt-1 space-y-1">
                    <textarea
                      value={adminReview}
                      onChange={(e) => setAdminReview(e.target.value)}
                      placeholder="Resolution comment..."
                      className="w-full px-1.5 py-1 text-[9px] border border-gray-200 rounded"
                      rows="2"
                    />
                    <div className="flex gap-1">
  <button
    onClick={() => {
      if (!adminReview.trim()) {
        toast.error('Please add a resolution comment')
        return
      }
      handleAdminAction('PENDING_THIRD_PARTY', adminReview)
      setShowResolveForm(false)
      setResolutionComment('')
    }}
    disabled={submitting}
    className="flex-1 px-2 py-0.5 bg-green-600 text-white rounded text-[8px] flex items-center justify-center"
  >
    Confirm
  </button>
  <button
    onClick={() => {
      setShowResolveForm(false)
      setResolutionComment('')
    }}
    className="flex-1 px-2 py-0.5 border border-gray-300 rounded text-[8px] flex items-center justify-center"
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
        <div className="bg-white rounded p-2 mt-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[10px] font-medium text-gray-800">
              {selectedAction === 'CONFIRM' && 'Confirm Ticket Receipt'}
              {selectedAction === 'FORWARD_TO_MD' && 'Forward to MD for Approval'}
              {selectedAction === 'THIRD_PARTY' && 'Request Third Party Service'}
              {selectedAction === 'ASSIGN_TO_SERVICE' && 'Assign to Service Team'}
            </h4>
            <button onClick={() => setSelectedAction(null)} className="text-gray-400 hover:text-gray-600">
              <FiXCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {selectedAction === 'CONFIRM' && (
              <p className="text-[10px] text-gray-600">Confirm receipt of this ticket?</p>
            )}

            {selectedAction === 'FORWARD_TO_MD' && (
              <textarea
                value={adminReview}
                onChange={(e) => setAdminReview(e.target.value)}
                placeholder="Add review/recommendation for MD..."
                className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"
                rows="2"
              />
            )}

            {selectedAction === 'THIRD_PARTY' && (
              <>
                <select
                  value={thirdPartyStatus}
                  onChange={(e) => setThirdPartyStatus(e.target.value)}
                  className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"
                >
                  <option value="PENDING">Pending</option>
                  <option value="QUOTATION">Quotation Requested</option>
                  <option value="PURCHASE">Purchase Required</option>
                  <option value="IN_PROGRESS">In Progress</option>
                </select>
                <textarea
                  value={thirdPartyDetails}
                  onChange={(e) => setThirdPartyDetails(e.target.value)}
                  placeholder="Serial No / Details"
                  className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"
                  rows="1"
                />
                <textarea
                  value={adminReview}
                  onChange={(e) => setAdminReview(e.target.value)}
                  placeholder="Comments..."
                  className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"
                  rows="2"
                />
              </>
            )}

            {selectedAction === 'ASSIGN_TO_SERVICE' && (
              <>
                <select
                  value={selectedServiceUserId}
                  onChange={(e) => setSelectedServiceUserId(e.target.value)}
                  className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"
                >
                  <option value="">Select service team member</option>
                  {serviceTeamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
                <textarea
                  value={adminReview}
                  onChange={(e) => setAdminReview(e.target.value)}
                  placeholder="Instructions for service team..."
                  className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"
                  rows="2"
                />
              </>
            )}

            <div className="flex gap-2 pt-1">
  <button
    onClick={() => handleAdminAction(selectedAction)}
    disabled={submitting}
    className="flex-1 px-2 py-1 bg-primary-600 text-white rounded text-[9px] font-medium hover:bg-primary-700 flex items-center justify-center"
  >
    {submitting ? <LoadingSpinner size="small" /> : 'Confirm'}
  </button>
  <button
    onClick={() => setSelectedAction(null)}
    className="flex-1 px-2 py-1 border border-gray-300 rounded text-[9px] text-gray-600 hover:bg-gray-50 flex items-center justify-center"
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