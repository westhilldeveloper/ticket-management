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

// Helper for status badge styling (compact)
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

  const formatDate = (date) => {
    if (!date) return '—';
    return format(new Date(date), 'dd MMM yyyy, HH:mm');
  };

  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div className="flex-1">
            <h2 className="text-xs font-bold text-gray-800">{ticketData.title}</h2>
            <p className="text-[9px] text-gray-400 mt-0.5">#{ticketData.ticketNumber}</p>
          </div>
          <div className="flex gap-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium ${getPriorityBadge(ticketData.priority)}`}>
              {ticketData.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Main info */}
      <div className="p-2 space-y-2">
        {/* Info grid - compact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
          <InfoItemCompact icon={<FiTag className="w-3 h-3 text-gray-400" />} label="Category" value={ticketData.mainCategory || '—'} />
          <InfoItemCompact icon={<FiTag className="w-3 h-3 text-gray-400" />} label="Req/Service" value={ticketData.requestServiceType || '—'} />
          <InfoItemCompact icon={<FiTag className="w-3 h-3 text-gray-400" />} label="Item/Service" value={ticketData.itemType || '—'} />
          <InfoItemCompact icon={<FiUser className="w-3 h-3 text-gray-400" />} label="Created By" value={ticketData.createdBy?.name || '—'} />
          <InfoItemCompact icon={<FiUser className="w-3 h-3 text-gray-400" />} label="Assigned To" value={ticketData.assignedTo?.name || 'Unassigned'} />
          <InfoItemCompact icon={<FiCalendar className="w-3 h-3 text-gray-400" />} label="Created At" value={formatDate(ticketData.createdAt)} />
          <InfoItemCompact icon={<FiClock className="w-3 h-3 text-gray-400" />} label="Last Updated" value={formatDistanceToNow(new Date(ticketData.updatedAt), { addSuffix: true })} />
          <InfoItemCompact icon={<FiInfo className="w-3 h-3 text-gray-400" />} label="Branch" value={ticketData.category || '—'} />
          <InfoItemCompact icon={<FiInfo className="w-3 h-3 text-gray-400" />} label="Serial No" value={ticketData.serialNumber || '—'} />
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded p-1.5 border border-gray-100">
          <h3 className="text-[9px] font-semibold text-gray-600 mb-0.5">Description</h3>
          <p className="text-[9px] text-gray-700 whitespace-pre-wrap leading-tight">
            {ticketData.description || 'No description provided.'}
          </p>
        </div>

        {/* MD Approval / Third Party */}
        {(ticketData.mdApproval && ticketData.mdApproval !== 'PENDING') || ticketData.thirdParty ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {ticketData.mdApproval && ticketData.mdApproval !== 'PENDING' && (
              <div className="bg-gray-50 rounded p-1.5 border border-gray-100">
                <div className="flex items-center gap-1 mb-0.5">
                  {ticketData.mdApproval === 'APPROVED' ? <FiCheckCircle className="w-3 h-3 text-green-600" /> : <FiXCircle className="w-3 h-3 text-red-600" />}
                  <h3 className="text-[9px] font-semibold text-gray-700">MD: {ticketData.mdApproval}</h3>
                </div>
                {ticketData.mdApprovalComment && <p className="text-[8px] text-gray-600"><strong>Comment:</strong> {ticketData.mdApprovalComment}</p>}
                {ticketData.mdRejectReason && <p className="text-[8px] text-gray-600"><strong>Reject:</strong> {ticketData.mdRejectReason}</p>}
                {ticketData.mdApprovedAt && <p className="text-[7px] text-gray-400 mt-0.5">Approved: {formatDate(ticketData.mdApprovedAt)}</p>}
                {ticketData.mdRejectedAt && <p className="text-[7px] text-gray-400">Rejected: {formatDate(ticketData.mdRejectedAt)}</p>}
              </div>
            )}
            {ticketData.thirdParty && (
              <div className="bg-gray-50 rounded p-1.5 border border-gray-100">
                <h3 className="text-[9px] font-semibold text-gray-700 mb-0.5">Third Party</h3>
                <p className="text-[8px] text-gray-600"><strong>Status:</strong> {ticketData.thirdPartyStatus || '—'}</p>
                {ticketData.thirdPartyDetails && <p className="text-[8px] text-gray-600 mt-0.5"><strong>Details:</strong> {ticketData.thirdPartyDetails}</p>}
              </div>
            )}
          </div>
        ) : null}

        {/* Attachments */}
        {ticketData.attachment && (
          <div className="border-t border-gray-100 pt-1.5 mt-0.5">
            <h3 className="text-[9px] font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <FiPaperclip className="w-3 h-3" /> Attachments
            </h3>
            <div className="space-y-1">
              {(ticketData.attachment.includes(',') ? ticketData.attachment.split(',') : [ticketData.attachment]).map((url, idx) => (
                <a key={idx} href={url.trim()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-1.5 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-1">
                    <FiDownload className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-[8px] text-gray-600">Attachment {idx+1}</span>
                  </div>
                  <FiExternalLink className="w-2.5 h-2.5 text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Redirect button */}
      {canEdit && (
        <div className="px-2  pb-2  flex justify-end">
          <button
            onClick={handleOpenModal}
            className="w-[20%] flex items-center justify-center gap-1 px-2 py-1 border border-green-300 rounded text-[9px] font-medium text-yellow-600 bg-white hover:bg-gray-50"
          >
            <FiExternalLink className="w-3 h-3" />
            Redirect to Department
          </button>
        </div>
      )}

      <RedirectTicketModal isOpen={showRedirectModal} onClose={() => setShowRedirectModal(false)} ticketId={ticketData.id} onRedirect={handleRedirectSuccess} />
    </div>
  );
}

// Compact info row component
function InfoItemCompact({ icon, label, value }) {
  return (
    <div className="flex items-start gap-1">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-[8px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-[9px] font-medium text-gray-800 break-words">{value}</p>
      </div>
    </div>
  );
}