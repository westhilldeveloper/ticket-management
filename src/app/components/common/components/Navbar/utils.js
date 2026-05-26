export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export function getNotificationIcon(type) {
  // Map notification types to icons (adjust according to your actual types)
  const icons = {
    TICKET_CREATED: '🎫',
    TICKET_UPDATED: '✏️',
    STATUS_CHANGED: '🔄',
    ASSIGNED: '👤',
    COMMENT_ADDED: '💬',
    default: '🔔'
  };
  return icons[type] || icons.default;
}