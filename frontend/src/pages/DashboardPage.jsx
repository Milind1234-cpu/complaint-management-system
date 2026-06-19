import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTickets } from '../api/tickets'
import { getOverview, getStaffPerformance, getProductWise } from '../api/analytics'
import { format } from 'date-fns'
import StatusBadge from '../components/tickets/StatusBadge'
import Badge from '../components/ui/Badge'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'

function StatCard({ label, value, color, sub }) {
  return (
    <div className={`card p-5 ${color}`}>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-600 mt-1 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────
function AdminDashboard() {
  const [overview, setOverview]       = useState(null)
  const [staffPerf, setStaffPerf]     = useState([])
  const [productData, setProductData] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([getOverview(), getStaffPerformance(), getProductWise()])
      .then(([ov, sp, pw]) => {
        setOverview(ov.data)
        setStaffPerf(sp.data)
        setProductData(pw.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 py-8 text-center">Loading dashboard…</div>

  const staffChartData = staffPerf.map((s) => ({
    name: s.staff_name ?? 'Unknown',
    assigned: s.total_assigned,
    completed: s.completed,
    pending: s.pending,
  }))

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total" value={overview?.total_tickets} color="" />
        <StatCard label="Open" value={overview?.open} color="border-l-4 border-l-blue-400" />
        <StatCard label="In Progress" value={overview?.in_progress} color="border-l-4 border-l-amber-400" />
        <StatCard label="Resolved" value={overview?.resolved} color="border-l-4 border-l-green-400" />
        <StatCard
          label="Avg Resolution"
          value={overview?.average_resolution_time_hours != null
            ? `${overview.average_resolution_time_hours}h`
            : 'N/A'}
          color=""
          sub="average hours"
        />
      </div>

      {/* Staff performance chart */}
      {staffChartData.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Staff Performance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={staffChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="assigned"  name="Assigned"  fill="#3b82f6" radius={[3,3,0,0]} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[3,3,0,0]} />
              <Bar dataKey="pending"   name="Pending"   fill="#f59e0b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Product-wise table */}
      {productData.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Product Breakdown</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Open</th>
                <th className="px-4 py-3 text-right">In Progress</th>
                <th className="px-4 py-3 text-right">Resolved</th>
                <th className="px-4 py-3 text-right">Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productData.map((p) => (
                <tr key={p.product_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.product_name ?? p.product_id}</td>
                  <td className="px-4 py-3 text-right font-semibold">{p.total_complaints}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{p.open}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{p.in_progress}</td>
                  <td className="px-4 py-3 text-right text-green-600">{p.resolved}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{p.closed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Staff Dashboard ──────────────────────────────────────────────────────────
function StaffDashboard() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTickets().then((r) => setTickets(r.data)).finally(() => setLoading(false))
  }, [])

  const open     = tickets.filter((t) => t.status === 'open').length
  const progress = tickets.filter((t) => t.status === 'in_progress').length
  const resolved = tickets.filter((t) => t.status === 'resolved').length
  const active   = tickets.filter((t) => ['open','in_progress'].includes(t.status))

  if (loading) return <div className="text-gray-400 py-8 text-center">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Open" value={open} color="border-l-4 border-l-blue-400" />
        <StatCard label="In Progress" value={progress} color="border-l-4 border-l-amber-400" />
        <StatCard label="Resolved" value={resolved} color="border-l-4 border-l-green-400" />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Active Tickets</h2>
          <Link to="/tickets" className="text-xs text-blue-600 hover:underline">View all →</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {active.slice(0, 10).map((t) => (
            <div key={t._id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <Link to={`/tickets/${t._id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1">
                  {t.title}
                </Link>
                <p className="text-xs text-gray-400">{t.product_name ?? '—'}</p>
              </div>
              <StatusBadge status={t.status} />
              <Badge value={t.priority} />
            </div>
          ))}
          {active.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No active tickets</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Customer Dashboard ───────────────────────────────────────────────────────
function CustomerDashboard() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTickets().then((r) => setTickets(r.data)).finally(() => setLoading(false))
  }, [])

  const open     = tickets.filter((t) => t.status === 'open').length
  const progress = tickets.filter((t) => t.status === 'in_progress').length
  const resolved = tickets.filter((t) => t.status === 'resolved').length
  const recent   = tickets.slice(0, 8)

  if (loading) return <div className="text-gray-400 py-8 text-center">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Open" value={open} color="border-l-4 border-l-blue-400" />
        <StatCard label="In Progress" value={progress} color="border-l-4 border-l-amber-400" />
        <StatCard label="Resolved" value={resolved} color="border-l-4 border-l-green-400" />
      </div>

      {tickets.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 mb-4">You haven't submitted any tickets yet.</p>
          <Link to="/tickets/new" className="btn-primary">Submit your first ticket</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Recent Tickets</h2>
            <Link to="/tickets/new" className="btn-primary text-xs px-3 py-1.5">+ New Ticket</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/tickets/${t._id}`} className="text-blue-600 hover:underline line-clamp-1 block max-w-xs">
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3"><Badge value={t.priority} /></td>
                  <td className="px-4 py-3 text-gray-400">{format(new Date(t.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, isAdmin, isStaff } = useAuth()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isAdmin ? "Here's your system overview." : "Here's what's on your plate."}
        </p>
      </div>
      {isAdmin ? <AdminDashboard /> : isStaff ? <StaffDashboard /> : <CustomerDashboard />}
    </div>
  )
}
