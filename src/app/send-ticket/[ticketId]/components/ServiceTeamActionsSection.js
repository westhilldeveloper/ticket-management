import { FiUserPlus, FiCheckCircle, FiXCircle, FiTool, FiRefreshCw } from 'react-icons/fi'
import LoadingSpinner from '@/app/components/common/LoadingSpinner'

export default function ServiceTeamActionsSection({
  isServiceTeam,
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

  return (
    <>
      {/* Pending Acceptance */}
      {ticket.status === 'PENDING_SERVICE_ACCEPTANCE' && (
        <div className="p-6 border-b border-gray-200 bg-indigo-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiUserPlus className="mr-2 text-indigo-600" />
            Service Team Assignment
          </h3>

          {!serviceDecision ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setServiceDecision('accept')}
                className="p-4 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors"
              >
                <FiCheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Accept</p>
              </button>
              <button
                onClick={() => setServiceDecision('reject')}
                className="p-4 bg-white rounded-lg border-2 border-red-200 hover:border-red-400 transition-colors"
              >
                <FiXCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Reject</p>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4">
              <div className="mb-4">
                {serviceDecision === 'accept' ? (
                  <p className="text-sm text-gray-600">
                    Are you sure you want to accept this ticket?
                  </p>
                ) : (
                  <textarea
                    value={serviceResponse}
                    onChange={(e) => setServiceResponse(e.target.value)}
                    placeholder="Please provide reason for rejection..."
                    className="input-field w-full"
                    rows="3"
                  />
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleServiceResponse(serviceDecision)}
                  disabled={submitting}
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${
                    serviceDecision === 'accept'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {submitting ? <LoadingSpinner size="small" /> : 'Confirm'}
                </button>
                <button
                  onClick={() => setServiceDecision(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
        <div className="p-6 border-b border-gray-200 bg-teal-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiTool className="mr-2 text-teal-600" />
            Service Work
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setSelectedAction('PROGRESS')}
              className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-400 text-left"
            >
              <FiRefreshCw className="h-5 w-5 text-blue-600 mb-1" />
              <p className="text-sm font-medium">Add Progress Note</p>
            </button>
            <button
              onClick={() => setSelectedAction('RESOLVE')}
              className="p-3 bg-white rounded-lg border border-gray-200 hover:border-green-400 text-left"
            >
              <FiCheckCircle className="h-5 w-5 text-green-600 mb-1" />
              <p className="text-sm font-medium">Mark Resolved</p>
            </button>
          </div>

          {selectedAction && (
            <div className="bg-white rounded-lg p-4">
              <textarea
                value={serviceResponse}
                onChange={(e) => setServiceResponse(e.target.value)}
                placeholder={`Add details about ${selectedAction.toLowerCase()}...`}
                className="input-field w-full mb-3"
                rows="2"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => handleServiceWorkUpdate(selectedAction)}
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
      )}
    </>
  )
}