import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { useToast } from '@/app/context/ToastContext'
import { 
  ErrorTypes, 
  CACHE_TTL, 
  REQUEST_TIMEOUT,
  RETRY_DELAYS 
} from '../utils/constants'
import { buildQueryParams } from '../utils/helpers'

export const useHistoryData = (initialFilters, initialPagination) => {
  const { user } = useAuth()
  const toast = useToast()
  const router = useRouter()
  
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState({ type: null, message: null, details: null })
  const [retryCount, setRetryCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [filters, setFilters] = useState(initialFilters)
  const [pagination, setPagination] = useState(initialPagination)
  const [cache, setCache] = useState({})

  const isAdmin = user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role)

  const fetchData = useCallback(async (isRetry = false, loadMore = false, customFilters = filters) => {
    const cacheKey = JSON.stringify({ 
      page: loadMore ? pagination.page + 1 : pagination.page, 
      filters: customFilters,
      userId: user?.id
    })
    
    // Check cache
    if (cache[cacheKey] && !isRetry && !loadMore && 
        Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      setHistory(cache[cacheKey].data)
      setPagination(cache[cacheKey].pagination)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
      if (loadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      
      setError({ type: null, message: null, details: null })

      if (!user) {
        throw { type: ErrorTypes.AUTH, message: 'Authentication required' }
      }

      const params = buildQueryParams(customFilters, pagination, isAdmin, customFilters.search)

      const response = await fetch(`/api/tickets/history?${params.toString()}`, {
        credentials: 'include',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        switch (response.status) {
          case 401:
            throw { type: ErrorTypes.AUTH, message: 'Session expired' }
          case 403:
            throw { type: ErrorTypes.PERMISSION, message: 'Access denied' }
          case 429:
            throw { type: ErrorTypes.SERVER, message: 'Too many requests' }
          case 500:
          case 502:
          case 503:
          case 504:
            throw { type: ErrorTypes.SERVER, message: 'Server error' }
          default:
            throw { type: ErrorTypes.UNKNOWN, message: 'Failed to fetch' }
        }
      }

      const data = await response.json()
      
      const newHistory = Array.isArray(data.history) ? data.history : []
      
      if (loadMore) {
        setHistory(prev => [...prev, ...newHistory])
        setHasMore(newHistory.length === pagination.limit)
      } else {
        setHistory(newHistory)
        setHasMore(newHistory.length === pagination.limit)
      }

      const newPagination = {
        ...pagination,
        total: data.pagination?.total || data.total || 0,
        totalPages: data.pagination?.totalPages || data.totalPages || 1
      }

      if (!loadMore) {
        setPagination(newPagination)
      } else {
        setPagination(prev => ({ ...prev, page: prev.page + 1 }))
      }

      // Update cache
      setCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: newHistory,
          pagination: newPagination,
          timestamp: Date.now()
        }
      }))

      setError({ type: null, message: null, details: null })
      
      if (isRetry) {
        toast.success('Loaded successfully', { duration: 2000 })
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        setError({ type: ErrorTypes.NETWORK, message: 'Request timeout' })
      } 
      else if (err.type) {
        setError({ type: err.type, message: err.message, details: err.details })
        
        if (err.type === ErrorTypes.AUTH) {
          toast.error('Authentication required')
          setTimeout(() => router.push('/login'), 2000)
        }
      } else {
        setError({ type: ErrorTypes.UNKNOWN, message: 'Unexpected error' })
      }
    } finally {
      if (loadMore) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
      clearTimeout(timeoutId)
    }
  }, [pagination.page, pagination.limit, filters, isAdmin, user, router, toast, cache])

  const retry = useCallback(() => {
    const newRetryCount = retryCount + 1
    setRetryCount(newRetryCount)
    
    const delay = RETRY_DELAYS[Math.min(newRetryCount - 1, RETRY_DELAYS.length - 1)]
    
    toast.info(`Retrying... (${newRetryCount})`, { duration: 2000 })
    
    setTimeout(() => {
      fetchData(true)
    }, delay)
  }, [retryCount, fetchData, toast])

  const updateFilters = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
    setHasMore(true)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
    setHasMore(true)
    toast.info('Filters cleared', { duration: 2000 })
  }, [initialFilters, toast])

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchData(false, true)
    }
  }, [hasMore, loadingMore, loading, fetchData])

  return {
    history,
    loading,
    loadingMore,
    error,
    hasMore,
    filters,
    pagination,
    setPagination,
    updateFilters,
    clearFilters,
    retry,
    loadMore,
    fetchData,
    isAdmin
  }
}