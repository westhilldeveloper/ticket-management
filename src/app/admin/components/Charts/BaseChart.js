'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
)

export default function BaseChart({ type, data, options }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    // Clean up function
    const cleanup = () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }

    // Create chart only if canvas exists
    if (canvasRef.current) {
      // Destroy existing chart before creating new one
      cleanup()

      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        try {
          // Import Chart dynamically to ensure it's available
          import('chart.js/auto').then((ChartJS) => {
            if (canvasRef.current) {
              chartRef.current = new ChartJS.default(ctx, {
                type,
                data,
                options: {
                  ...options,
                  maintainAspectRatio: false,
                  responsive: true
                }
              })
            }
          })
        } catch (error) {
          console.error('Error creating chart:', error)
        }
      }
    }

    // Cleanup on unmount or data change
    return cleanup
  }, [type, data, options])

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '100%', height: '100%' }}
    />
  )
}