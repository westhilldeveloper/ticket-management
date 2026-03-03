import { createContext, useContext, useMemo } from 'react'
import { useHistoryData } from '../hooks/useHistoryData'
import { PAGINATION_DEFAULTS } from '../utils/constants'

const HistoryContext = createContext()

const initialFilters = {
  actionType: 'ALL',
  dateRange: 'ALL',
  search: '',
  userId: 'ALL',
  category: 'ALL'
}

const initialPagination = {
  page: PAGINATION_DEFAULTS.page,
  limit: PAGINATION_DEFAULTS.limit,
  total: 0,
  totalPages: 0
}

export const HistoryProvider = ({ children }) => {
  const historyData = useHistoryData(initialFilters, initialPagination)

  const value = useMemo(() => ({
    ...historyData,
    initialFilters,
    initialPagination
  }), [historyData])

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  )
}

export const useHistory = () => {
  const context = useContext(HistoryContext)
  if (!context) {
    throw new Error('useHistory must be used within HistoryProvider')
  }
  return context
}