import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import Badge from '../ui/Badge'
import StatusBadge from './StatusBadge'

export default function TicketCard({ ticket }) {
  const { _id, title, status, priority, product_name, assigned_to_name, created_at } = ticket

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to={`/tickets/${_id}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
          >
            {title}
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">
            {product_name ?? 'No product'} &middot; Assigned to{' '}
            <span className="font-medium">{assigned_to_name ?? 'Unassigned'}</span>
          </p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Badge value={priority} />
        <span className="text-xs text-gray-400 ml-auto">
          {format(new Date(created_at), 'MMM d, yyyy')}
        </span>
      </div>
    </div>
  )
}
