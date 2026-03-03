'use client'

import { Line } from 'react-chartjs-2'
import { FiTrendingUp } from 'react-icons/fi'
import { CHART_COLORS } from '../../utils/chartConfig'

export default function TrendChart({ stats, timeRange }) {
  // Generate trend data based on time range
  const getTrendData = () => {
    const days = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30
    const labels = []
    const data = []
    
    for (let i = days - 1; i >= 0; i--) {
      if (timeRange === 'day') {
        const hour = new Date()
        hour.setHours(hour.getHours() - i)
        labels.push(hour.getHours() + ':00')
      } else if (timeRange === 'week') {
        const date = new Date()
        date.setDate(date.getDate() - i)
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }))
      } else {
        const date = new Date()
        date.setDate(date.getDate() - i)
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      }
      
      // You can replace this with real data from your API
      // For now, generate random data for demonstration
      data.push(Math.floor(Math.random() * 15) + 5)
    }
    
    return { labels, data }
  }

  const trendData = getTrendData()

  const data = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Tickets Created',
        data: trendData.data,
        borderColor: CHART_COLORS.primary,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: CHART_COLORS.primary,
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      font: {
            size: 9
          },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'white',
        titleColor: '#111827',
        bodyColor: '#6B7280',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            return `Tickets: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          stepSize: 1,
          color: '#6B7280'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6B7280',
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Ticket Trend</h2>
        <div className="flex items-center space-x-2">
          <FiTrendingUp className="text-gray-400" />
          <span className="text-sm text-gray-600">
            Last {timeRange === 'day' ? '24 hours' : timeRange === 'week' ? '7 days' : '30 days'}
          </span>
        </div>
      </div>
      <div className="h-24">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}