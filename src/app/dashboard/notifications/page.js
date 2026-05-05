'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from '@/app/context/ToastContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import {
  FiBell,
  FiCheckCircle,
  FiMessageCircle,
  FiAlertCircle,
  FiClock,
  FiTrash2,
  FiCheck,
  FiInbox,
} from 'react-icons/fi';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'TICKET_CREATED':
      return <FiCheckCircle className="text-green-500" />;
    case 'TICKET_UPDATED':
      return <FiMessageCircle className="text-blue-500" />;
    case 'TICKET_ASSIGNED':
      return <FiClock className="text-orange-500" />;
    case 'MD_APPROVAL_REQUIRED':
      return <FiAlertCircle className="text-purple-500" />;
    case 'MD_APPROVED':
      return <FiCheckCircle className="text-green-500" />;
    case 'MD_REJECTED':
      return <FiAlertCircle className="text-red-500" />;
    default:
      return <FiBell className="text-gray-500" />;
  }
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=100', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const markAsRead = async (notificationIds) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          notificationIds.includes(n.id) ? { ...n, read: true, readAt: new Date() } : n
        )
      );
      setUnreadCount(prev => prev - notificationIds.length);
      toast.success('Marked as read');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <FiBell className="text-gray-600" size={20} />
              <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {markingAll ? <LoadingSpinner size="small" /> : <><FiCheck className="mr-1" /> Mark all as read</>}
              </button>
            )}
          </div>

          {/* Notifications list */}
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <FiInbox className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 transition-colors ${!notif.read ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {notif.title}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      {notif.ticket && (
                        <Link
                          href={`/tickets/${notif.ticket.id}`}
                          className="inline-block mt-2 text-xs text-primary-600 hover:text-primary-700"
                        >
                          View ticket →
                        </Link>
                      )}
                    </div>
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead([notif.id])}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                        title="Mark as read"
                      >
                        <FiCheck size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}