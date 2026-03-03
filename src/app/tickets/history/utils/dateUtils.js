import { format, formatDistanceToNow, isValid } from 'date-fns'

// Safe date parsing
export const safeParseDate = (dateString) => {
  if (!dateString) return null
  try {
    const date = new Date(dateString)
    return isValid(date) ? date : null
  } catch {
    return null
  }
}

// Format date with multiple formats
export const formatDate = (dateString, isClient = true) => {
  if (!dateString || !isClient) {
    return {
      relative: '...',
      full: '...',
      date: '...',
      time: '',
      short: '...',
      day: '...',
      iso: '...'
    }
  }
  
  try {
    const date = safeParseDate(dateString)
    if (!date) {
      return {
        relative: 'Invalid',
        full: 'Invalid',
        date: 'Invalid',
        time: '',
        short: 'Invalid',
        day: 'Invalid',
        iso: 'Invalid'
      }
    }
    
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      full: format(date, 'PPpp'),
      date: format(date, 'PPP'),
      time: format(date, 'p'),
      short: format(date, 'dd/MM/yy HH:mm'),
      day: format(date, 'EEE dd MMM'),
      iso: date.toISOString()
    }
  } catch {
    return {
      relative: 'Invalid',
      full: 'Invalid',
      date: 'Invalid',
      time: '',
      short: 'Invalid',
      day: 'Invalid',
      iso: 'Invalid'
    }
  }
}

// Format most active day
export const formatMostActiveDay = (dateString) => {
  if (!dateString) return '—'
  const date = safeParseDate(dateString)
  return date ? format(date, 'dd MMM') : '—'
}