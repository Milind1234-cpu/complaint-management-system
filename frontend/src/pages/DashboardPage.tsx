import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Ticket } from '../types'
import Badge from '../components/Badge'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [tickets, setTickets] = useState<Ticket[]>([])

  useEffect(() => {
    api.get<Ticket[]>('/tickets').then((r) => setTickets(r.data))
  }, [])

  const open      = tickets.filter((t) => t.status === 'open').length
  const progress  = tickets.filter((t) => t.status === 'in_progress').length
  const resolved  = tickets.filter((t) => t.status === 'resolved').length

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Welcome, {user?.full_name}</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Open',        value: open,     color: 'bg-blue-50 border-blue-200' },
          { label: 'In Progress', value: progress, color: 'bg-yellow-50 border-yellow-200' },
          { label: 'Resolved',    value: resolved, color: 'bg-green-50 border-green-200' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-5 ${stat.color}`}>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Recent Tickets</h2>
        <Link to="/tickets/new" className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700">
          + New Ticket
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.slice(0, 10).map((t) => (
              <tr key={t._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/tickets/${t._id}`} className="text-primary-600 hover:underline">
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-3"><Badge value={t.status} /></td>
                <td className="px-4 py-3"><Badge value={t.priority} /></td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(t.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">No tickets yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
