'use client'

import { Doughnut } from 'react-chartjs-2'
import { FiPieChart } from 'react-icons/fi'
import { STATUS_COLORS } from '../../utils/chartConfig'

export default function StatusChart({ stats }) {
  // Provide default values to prevent undefined errors
  const ticketsByStatus = stats?.ticketsByStatus || {}
  
  // Filter out zero values and prepare data
  const statusLabels = []
  const statusData = []
  const statusColors = []
  
  // Safely iterate over the object
  Object.entries(ticketsByStatus).forEach(([key, value]) => {
    if (value > 0) {
      statusLabels.push(key.replace(/_/g, ' '))
      statusData.push(value)
      statusColors.push(STATUS_COLORS[key] || '#6B7280')
    }
  })

  const data = {
    labels: statusLabels,
    datasets: [
      {
        data: statusData,
        backgroundColor: statusColors,
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          color: '#374151',
          font: {
            size: 9
          }
        }
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111827',
        bodyColor: '#6B7280',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%'
  }

  // Show empty state if no data
  if (statusData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-md font-semibold text-gray-900">Tickets by Status</h2>
          <FiPieChart className="text-gray-400" />
        </div>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Tickets by Status</h2>
        <FiPieChart className="text-gray-400" />
      </div>
      <div className="h-24">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  )
}