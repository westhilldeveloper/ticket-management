'use client'

import { Pie } from 'react-chartjs-2'
import { FiPieChart } from 'react-icons/fi'
import { CHART_COLORS } from '../../utils/chartConfig'

export default function CategoryChart({ data: chartData }) {
  // If no data or empty labels, show empty state
  const hasData = chartData?.datasets?.[0]?.data?.some(value => value > 0) || false

  if (!hasData || !chartData?.labels?.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-md font-semibold text-gray-900">Tickets by Category</h2>
          <FiPieChart className="text-gray-400" />
        </div>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No data available
        </div>
      </div>
    )
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
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-md font-semibold text-gray-900">Tickets by Category</h2>
        <FiPieChart className="text-gray-400" />
      </div>
      <div className="h-64">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  )
}