import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

const actionConfig = {
  created:        { dot: 'bg-blue-500',   label: 'Created' },
  status_changed: { dot: 'bg-amber-500',  label: 'Status changed' },
  assigned:       { dot: 'bg-purple-500', label: 'Assigned' },
  reassigned:     { dot: 'bg-orange-500', label: 'Reassigned' },
  comment_added:  { dot: 'bg-green-500',  label: 'Comment added' },
  unassigned:     { dot: 'bg-gray-400',   label: 'Unassigned' },
}

export default function ActivityTimeline({ log = [] }) {
  if (!log.length) {
    return <p className="text-sm text-gray-400">No activity yet.</p>
  }

  return (
    <ol className="relative border-l border-gray-200 space-y-6 ml-2">
      {[...log].reverse().map((entry, i) => {
        const cfg = actionConfig[entry.action] ?? { dot: 'bg-gray-400', label: entry.action }
        return (
          <li key={i} className="ml-5">
            {/* dot */}
            <span
              className={clsx(
                'absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white',
                cfg.dot,
              )}
            />
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {cfg.label}
              </span>
              <span className="text-xs text-gray-400">
                by {entry.actor_name}
              </span>
            </div>
            <p className="text-sm text-gray-600">{entry.detail}</p>
            <time className="text-xs text-gray-400 mt-0.5 block">
              {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
            </time>
          </li>
        )
      })}
    </ol>
  )
}
