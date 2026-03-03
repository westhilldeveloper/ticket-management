import { ACTION_ICONS, ROLE_BADGES, CATEGORY_BADGES } from './constants'

// Get action info with fallback
export const getActionInfo = (action) => {
  return ACTION_ICONS[action] || { 
    icon: FiActivity, 
    color: 'text-gray-600', 
    bg: 'bg-gray-50',
    label: action || 'Action'
  }
}

// Get role badge with fallback
export const getRoleBadge = (role) => {
  return ROLE_BADGES[role] || ROLE_BADGES.EMPLOYEE
}

// Get category badge with fallback
export const getCategoryBadge = (category) => {
  return CATEGORY_BADGES[category] || { 
    bg: 'bg-gray-50', 
    text: 'text-gray-700', 
    label: category || 'Other' 
  }
}

// Format action description
export const formatAction = (historyItem) => {
  if (!historyItem) return 'Unknown action'
  
  const { action, changes, ticket, oldValue, newValue } = historyItem
  const ticketRef = ticket?.ticketNumber || ticket?.id?.slice(0, 8) || 'Unknown'
  
  switch (action) {
    case 'CREATE':
      return `Created #${ticketRef}`
    case 'UPDATE':
      if (changes && typeof changes === 'object') {
        const changedFields = Object.keys(changes).slice(0, 3).join(', ')
        const remaining = Object.keys(changes).length - 3
        return remaining > 0 
          ? `Updated ${changedFields} +${remaining}`
          : `Updated ${changedFields}`
      }
      return 'Updated ticket'
    case 'STATUS_CHANGE':
      return `Status: ${oldValue || '?'} → ${newValue || '?'}`
    case 'COMMENT':
      return `Added comment`
    case 'ASSIGN':
      return `Assigned to ${changes?.assignee || 'someone'}`
    case 'RESOLVE':
      return `Resolved`
    case 'CLOSE':
      return `Closed`
    default:
      return action ? action.replace(/_/g, ' ').toLowerCase() : 'Action'
  }
}

// Calculate stats from history
export const calculateStats = (history, isAdmin = false) => {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      totalActions: 0,
      uniqueTickets: 0,
      mostActiveDay: null,
      actionBreakdown: {},
      userStats: {},
      categoryBreakdown: {}
    }
  }

  const actionBreakdown = history.reduce((acc, item) => {
    if (item?.action) {
      acc[item.action] = (acc[item.action] || 0) + 1
    }
    return acc
  }, {})
  
  const uniqueTickets = new Set(
    history.map(h => h.ticket?.id).filter(Boolean)
  ).size
  
  const userStats = isAdmin ? history.reduce((acc, item) => {
    if (item?.createdBy?.id) {
      const userId = item.createdBy.id
      if (!acc[userId]) {
        acc[userId] = {
          name: item.createdBy.name || 'Unknown',
          role: item.createdBy.role || 'EMPLOYEE',
          count: 0,
          actions: {}
        }
      }
      acc[userId].count++
      if (item.action) {
        acc[userId].actions[item.action] = (acc[userId].actions[item.action] || 0) + 1
      }
    }
    return acc
  }, {}) : {}
  
  const categoryBreakdown = history.reduce((acc, item) => {
    if (item?.ticket?.category) {
      acc[item.ticket.category] = (acc[item.ticket.category] || 0) + 1
    }
    return acc
  }, {})
  
  // Calculate most active day
  const dayCount = history.reduce((acc, item) => {
    if (item?.createdAt) {
      try {
        const date = new Date(item.createdAt)
        if (isValid(date)) {
          const day = format(date, 'yyyy-MM-dd')
          acc[day] = (acc[day] || 0) + 1
        }
      } catch {
        // Skip invalid dates
      }
    }
    return acc
  }, {})
  
  const mostActiveEntry = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]
  
  return {
    totalActions: history.length,
    uniqueTickets,
    mostActiveDay: mostActiveEntry ? mostActiveEntry[0] : null,
    actionBreakdown,
    userStats,
    categoryBreakdown
  }
}

// Build query params
export const buildQueryParams = (filters, pagination, isAdmin, debouncedSearch) => {
  const params = new URLSearchParams({
    page: pagination.page.toString(),
    limit: pagination.limit.toString(),
  })

  if (filters.actionType && filters.actionType !== 'ALL') {
    params.append('action', filters.actionType)
  }

  if (filters.dateRange && filters.dateRange !== 'ALL') {
    params.append('dateRange', filters.dateRange)
  }

  if (debouncedSearch?.trim()) {
    params.append('search', debouncedSearch.trim())
  }

  if (isAdmin && filters.userId && filters.userId !== 'ALL') {
    params.append('userId', filters.userId)
  }

  if (filters.category && filters.category !== 'ALL') {
    params.append('category', filters.category)
  }

  return params
}