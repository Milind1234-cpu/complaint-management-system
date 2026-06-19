import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Ticket } from '../types'
import Badge from '../components/Badge'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Ticket[]>('/tickets').then((r) => {
      setTickets(r.data)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Tickets</h1>
        <Link
          to="/tickets/new"
          className="bg-primary-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          + New Ticket
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/tickets/${t._id}`} className="text-primary-600 hover:underline">
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><Badge value={t.status} /></td>
                  <td className="px-4 py-3"><Badge value={t.priority} /></td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(t.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    No tickets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
