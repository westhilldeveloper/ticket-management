import { FiUserPlus, FiCheckCircle, FiXCircle, FiTool, FiRefreshCw } from 'react-icons/fi'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'

export default function ServiceTeamActionsSection({
  isServiceTeam,
  user,                    // ✅ added user prop (required)
  ticket,
  serviceDecision,
  setServiceDecision,
  serviceResponse,
  setServiceResponse,
  selectedAction,
  setSelectedAction,
  handleServiceResponse,
  handleServiceWorkUpdate,
  submitting,
}) {
  if (!isServiceTeam || ticket.assignedToId !== user?.id) return null

  // Helper for compact buttons
  const ActionButton = ({ onClick, icon: Icon, color, text }) => (
    <button
      onClick={onClick}
      className="p-2 bg-white rounded border border-gray-200 hover:border-blue-400 text-left"
    >
      <Icon className={`w-4 h-4 ${color} mb-0.5`} />
      <p className="text-[10px] font-medium text-gray-700">{text}</p>
    </button>
  )

  return (
    <>
      {/* Pending Acceptance */}
      {ticket.status === 'PENDING_SERVICE_ACCEPTANCE' && (
        <div className="p-3 border-b border-gray-100 bg-indigo-50">
          <h3 className="text-xs font-medium text-gray-800 mb-2 flex items-center">
            <FiUserPlus className="mr-1.5 text-indigo-600 w-3.5 h-3.5" />
            Service Team Assignment
          </h3>

          {!serviceDecision ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setServiceDecision('accept')}
                className="p-2 bg-white rounded border border-green-200 hover:border-green-400"
              >
                <FiCheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-gray-700">Accept</p>
              </button>
              <button
                onClick={() => setServiceDecision('reject')}
                className="p-2 bg-white rounded border border-red-200 hover:border-red-400"
              >
                <FiXCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-[10px] font-medium text-gray-700">Reject</p>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded p-2">
              <div className="mb-2">
                {serviceDecision === 'accept' ? (
                  <p className="text-[10px] text-gray-600">Confirm accept this ticket?</p>
                ) : (
                  <textarea
                    value={serviceResponse}
                    onChange={(e) => setServiceResponse(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded"
                    rows="2"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleServiceResponse(serviceDecision)}
                  disabled={submitting}
                  className={`flex-1 px-2 py-1 rounded text-[9px] font-medium text-white ${
                    serviceDecision === 'accept'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {submitting ? <LoadingSpinner size="small" /> : 'Confirm'}
                </button>
                <button
                  onClick={() => setServiceDecision(null)}
                  className="px-2 py-1 border border-gray-300 rounded text-[9px] text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Service In Progress */}
      {ticket.status === 'SERVICE_IN_PROGRESS' && (
        <div className="p-3 border-b border-gray-100 bg-teal-50">
          <h3 className="text-xs font-medium text-gray-800 mb-2 flex items-center">
            <FiTool className="mr-1.5 text-teal-600 w-3.5 h-3.5" />
            Service Work
          </h3>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <ActionButton
              onClick={() => setSelectedAction('PROGRESS')}
              icon={FiRefreshCw}
              color="text-blue-600"
              text="Add Progress Note"
            />
            <ActionButton
              onClick={() => setSelectedAction('RESOLVE')}
              icon={FiCheckCircle}
              color="text-green-600"
              text="Mark Resolved"
            />
          </div>

          {selectedAction && (
            <div className="bg-white rounded p-2">
              <textarea
                value={serviceResponse}
                onChange={(e) => setServiceResponse(e.target.value)}
                placeholder={`Details about ${selectedAction.toLowerCase()}...`}
                className="w-full px-2 py-1 text-[10px] border border-gray-200 rounded mb-2"
                rows="2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleServiceWorkUpdate(selectedAction)}
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
      )}
    </>
  )
}