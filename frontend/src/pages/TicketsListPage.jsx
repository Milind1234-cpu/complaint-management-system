import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getTickets } from '../api/tickets'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/tickets/StatusBadge'
import Badge from '../components/ui/Badge'
import { format } from 'date-fns'

const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed']

export default function TicketsListPage() {
  const { isCustomer } = useAuth()
  const [tickets, setTickets]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch]           = useState('')

  useEffect(() => {
    setLoading(true)
    const params = statusFilter ? { status: statusFilter } : {}
    getTickets(params)
      .then((r) => setTickets(r.data))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const filtered = useMemo(() => {
    if (!search.trim()) return tickets
    const q = search.toLowerCase()
    return tickets.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      (t.product_name ?? '').toLowerCase().includes(q)
    )
  }, [tickets, search])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Tickets</h1>
        <Link to="/tickets/new" className="btn-primary">
          + New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by title or product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field max-w-[180px]"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-8 text-center text-gray-400">Loading tickets…</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Product</th>
                {!isCustomer && <th className="px-4 py-3 text-left">Assigned To</th>}
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium max-w-xs">
                    <Link
                      to={`/tickets/${t._id}`}
                      className="text-blue-600 hover:underline line-clamp-1"
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={t.priority} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.product_name ?? '—'}</td>
                  {!isCustomer && (
                    <td className="px-4 py-3 text-gray-600">{t.assigned_to_name ?? 'Unassigned'}</td>
                  )}
                  <td className="px-4 py-3 text-gray-400">
                    {format(new Date(t.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    {search ? 'No tickets match your search.' : 'No tickets found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
