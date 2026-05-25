import { formatDistanceToNow } from 'date-fns'

export default function StatusTimeline({ history }) {
  if (!history || history.length === 0) return null

  return (
    <div className="p-3 border-b border-gray-100">
      <h3 className="text-xs font-medium text-gray-800 mb-2">Status Timeline</h3>
      <div className="space-y-1.5">
        {history.map((event, index) => (
          <div key={event.id || index} className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <div className="h-1.5 w-1.5 mt-1.5 rounded-full bg-primary-500"></div>
            </div>
            <div>
              <p className="text-[10px] text-gray-700">{event.description}</p>
              <p className="text-[8px] text-gray-400">
                {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}