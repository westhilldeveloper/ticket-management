import { formatDistanceToNow } from 'date-fns'

export default function StatusTimeline({ history }) {
  if (!history || history.length === 0) return null

  return (
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Status Timeline</h3>
      <div className="space-y-3">
        {history.map((event, index) => (
          <div key={event.id || index} className="flex items-start">
            <div className="mr-3">
              <div className="h-2 w-2 mt-2 rounded-full bg-primary-500"></div>
            </div>
            <div>
              <p className="text-sm text-gray-900">{event.description}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}