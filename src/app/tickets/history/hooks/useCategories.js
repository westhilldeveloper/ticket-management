import { useState, useEffect } from 'react'

const DEFAULT_CATEGORIES = ['HR', 'IT', 'TECHNICAL', 'GENERAL']

export const useCategories = () => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/tickets/categories', {
          credentials: 'include' // Important: include cookies
        })
        
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || DEFAULT_CATEGORIES)
        } else {
          // Use defaults on error
          setCategories(DEFAULT_CATEGORIES)
        }
      } catch (err) {
        console.warn('Using default categories:', err)
        setCategories(DEFAULT_CATEGORIES)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading }
}