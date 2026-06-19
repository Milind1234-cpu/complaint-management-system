import { useEffect, useState } from 'react'
import api from '../lib/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface Summary {
  total_tickets: number
  open: number
  in_progress: number
  resolved: number
  closed: number
}

interface GroupedItem { _id: string; count: number }

const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6',
  in_progress: '#f59e0b',
  resolved: '#10b981',
  closed: '#6b7280',
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [byProduct, setByProduct] = useState<GroupedItem[]>([])
  const [byPriority, setByPriority] = useState<GroupedItem[]>([])

  useEffect(() => {
    api.get<Summary>('/analytics/summary').then((r) => setSummary(r.data))
    api.get<GroupedItem[]>('/analytics/by-product').then((r) => setByProduct(r.data))
    api.get<GroupedItem[]>('/analytics/by-priority').then((r) => setByPriority(r.data))
  }, [])

  const statusData = summary
    ? [
        { name: 'Open',        value: summary.open,        key: 'open' },
        { name: 'In Progress', value: summary.in_progress, key: 'in_progress' },
        { name: 'Resolved',    value: summary.resolved,    key: 'resolved' },
        { name: 'Closed',      value: summary.closed,      key: 'closed' },
      ]
    : []

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Analytics</h1>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total',       value: summary.total_tickets, color: 'bg-white' },
            { label: 'Open',        value: summary.open,          color: 'bg-blue-50' },
            { label: 'In Progress', value: summary.in_progress,   color: 'bg-yellow-50' },
            { label: 'Resolved',    value: summary.resolved,      color: 'bg-green-50' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-5 ${s.color}`}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status bar chart */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Tickets by Status</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={statusData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {statusData.map((entry) => (
                <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* By priority */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Tickets by Priority</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byPriority} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* By product table */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Tickets by Product</h2>
        <table className="w-full text-sm">
          <thead className="text-gray-500 text-xs uppercase tracking-wide bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Product ID</th>
              <th className="px-4 py-3 text-left">Ticket Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {byProduct.map((item) => (
              <tr key={item._id}>
                <td className="px-4 py-3 font-mono text-xs">{item._id}</td>
                <td className="px-4 py-3">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
