'use client'

import { Bar } from 'react-chartjs-2'
import { FiBarChart2 } from 'react-icons/fi'
import { CHART_COLORS } from '../../utils/chartConfig'

export default function PriorityChart({ stats }) {
  // Provide default values to prevent undefined errors
  const ticketsByPriority = stats?.ticketsByPriority || {}
  
  const data = {
    labels: ['Low', 'Medium', 'High', 'Critical'],
    datasets: [
      {
        label: 'Tickets by Priority',
        data: [
          ticketsByPriority.LOW || 0,
          ticketsByPriority.MEDIUM || 0,
          ticketsByPriority.HIGH || 0,
          ticketsByPriority.CRITICAL || 0
        ],
        backgroundColor: [
          CHART_COLORS.primary,
          CHART_COLORS.secondary,
          CHART_COLORS.warning,
          CHART_COLORS.danger
        ],
        borderRadius: 6,
        barPercentage: 0.6
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
          color: '#6B7280'
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-md font-semibold text-gray-900">Tickets by Priority</h2>
        <FiBarChart2 className="text-gray-400" />
      </div>
      <div className="h-24">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}