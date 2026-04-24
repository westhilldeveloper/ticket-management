'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  FiPaperclip,
  FiDownload,
  FiExternalLink,
  FiUser,
  FiTag,
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
} from 'react-icons/fi';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/app/context/ToastContext';
import RedirectTicketModal from '@/app/components/RedirectTicketModal';

// Helper for status badge styling
const getStatusBadge = (status) => {
  const styles = {
    OPEN: 'bg-blue-100 text-blue-800',
    PENDING_MD_APPROVAL: 'bg-yellow-100 text-yellow-800',
    PENDING_THIRD_PARTY: 'bg-purple-100 text-purple-800',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
    APPROVED_BY_MD: 'bg-green-100 text-green-800',
    REJECTED_BY_MD: 'bg-red-100 text-red-800',
    REJECTED_BY_SERVICE: 'bg-red-100 text-red-800',
    PENDING_SERVICE_ACCEPTANCE: 'bg-orange-100 text-orange-800',
    SERVICE_IN_PROGRESS: 'bg-cyan-100 text-cyan-800',
    SERVICE_RESOLVED: 'bg-teal-100 text-teal-800',
    RESOLVED: 'bg-emerald-100 text-emerald-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };
  return styles[status] || 'bg-gray-100 text-gray-800';
};

const getPriorityBadge = (priority) => {
  const styles = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    CRITICAL: 'bg-red-100 text-red-700',
  };
  return styles[priority] || 'bg-gray-100 text-gray-600';
};

export default function TicketDetails({ ticket }) {
  const { user } = useAuth();
  const toast = useToast();
  const [ticketData, setTicketData] = useState(ticket);
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    setTicketData(ticket);
  }, [ticket]);

  const handleRedirectSuccess = (updatedTicket) => {
    setTicketData(updatedTicket);
  };

  const handleOpenModal = () => {
    if (!ticketData?.id) {
      toast.error('Cannot redirect: ticket ID missing');
      return;
    }
    setShowRedirectModal(true);
  };

  // Format date helper
  const formatDate = (date) => {
    if (!date) return '—';
    return format(new Date(date), 'dd MMM yyyy, HH:mm');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with title and status */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {ticketData.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Ticket #{ticketData.ticketNumber}
            </p>
          </div>
          <div className="flex gap-2">
            {/* <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium ${getStatusBadge(
                ticketData.status
              )}`}
            >
              {ticketData.status?.replace(/_/g, ' ')}
            </span> */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium ${getPriorityBadge(
                ticketData.priority
              )}`}
            >
              {ticketData.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Main info grid */}
      <div className="p-6 space-y-6">
        {/* Two-column info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem
            icon={<FiTag className="text-gray-400" />}
            label="Category"
            value={ticketData.mainCategory || '—'}
          />
          <InfoItem
            icon={<FiTag className="text-gray-400" />}
            label="Request / Service"
            value={ticketData.requestServiceType || '—'}
          />
          <InfoItem
            icon={<FiTag className="text-gray-400" />}
            label="Item / Service Type"
            value={ticketData.itemType || '—'}
          />
          <InfoItem
            icon={<FiUser className="text-gray-400" />}
            label="Created By"
            value={ticketData.createdBy?.name || '—'}
          />
          <InfoItem
            icon={<FiUser className="text-gray-400" />}
            label="Assigned To"
            value={ticketData.assignedTo?.name || 'Unassigned'}
          />
          <InfoItem
            icon={<FiCalendar className="text-gray-400" />}
            label="Created At"
            value={formatDate(ticketData.createdAt)}
          />
          <InfoItem
            icon={<FiClock className="text-gray-400" />}
            label="Last Updated"
            value={formatDistanceToNow(new Date(ticketData.updatedAt), {
              addSuffix: true,
            })}
          />
          <InfoItem
            icon={<FiInfo className="text-gray-400" />}
            label="Branch"
            value={ticketData.category || '—'}
          />
          <InfoItem
            icon={<FiInfo className="text-gray-400" />}
            label="Serial Number"
            value={ticketData.serialNumber || '—'}
          />
        </div>

        {/* Description section */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
            {ticketData.description || 'No description provided.'}
          </p>
        </div>

        {/* MD Approval / Third party details (if applicable) */}
        {(ticketData.mdApproval && ticketData.mdApproval !== 'PENDING') ||
        ticketData.thirdParty ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ticketData.mdApproval && ticketData.mdApproval !== 'PENDING' && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  {ticketData.mdApproval === 'APPROVED' ? (
                    <FiCheckCircle className="text-green-600" />
                  ) : (
                    <FiXCircle className="text-red-600" />
                  )}
                  <h3 className="text-sm font-semibold text-gray-700">
                    MD Approval: {ticketData.mdApproval}
                  </h3>
                </div>
                {ticketData.mdApprovalComment && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Comment:</strong> {ticketData.mdApprovalComment}
                  </p>
                )}
                {ticketData.mdRejectReason && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Reject reason:</strong> {ticketData.mdRejectReason}
                  </p>
                )}
                {ticketData.mdApprovedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Approved: {formatDate(ticketData.mdApprovedAt)}
                  </p>
                )}
                {ticketData.mdRejectedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Rejected: {formatDate(ticketData.mdRejectedAt)}
                  </p>
                )}
              </div>
            )}
            {ticketData.thirdParty && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Third Party Information
                </h3>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> {ticketData.thirdPartyStatus || '—'}
                </p>
                {ticketData.thirdPartyDetails && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Details:</strong> {ticketData.thirdPartyDetails}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Attachments */}
        {ticketData.attachment && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FiPaperclip className="mr-2" />
              Attachments
            </h3>
            <div className="space-y-2">
              {/* Split only if comma-separated; otherwise treat as single URL */}
              {(ticketData.attachment.includes(',')
                ? ticketData.attachment.split(',')
                : [ticketData.attachment]
              ).map((url, index) => (
                <a
                  key={index}
                  href={url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-center">
                    <FiDownload className="mr-2 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      Attachment {index + 1}
                    </span>
                  </div>
                  <FiExternalLink className="text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {canEdit && (
        <div className="px-6 pb-6">
          <button
            onClick={handleOpenModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm text-sm font-medium"
          >
            <FiExternalLink className="w-4 h-4" />
            Redirect to Department
          </button>
        </div>
      )}

      {/* Modal */}
      <RedirectTicketModal
        isOpen={showRedirectModal}
        onClose={() => setShowRedirectModal(false)}
        ticketId={ticketData.id}
        onRedirect={handleRedirectSuccess}
      />
    </div>
  );
}

// Helper component for consistent info rows
function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );
}