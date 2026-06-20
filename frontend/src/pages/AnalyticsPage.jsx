import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell, ScatterChart, Scatter,
} from 'recharts'
import {
  getOverview,
  getStaffPerformance,
  getProductWise,
  getTeamPerformance,
  getTicketResolutionTimes,
  exportTicketsCSV,
  exportStaffPerformanceCSV,
  exportProductWiseCSV,
  getSatisfactionOverview,
} from '../api/analytics'

// ── Design tokens (matches tailwind.config.js ink/amber palette) ──────────────
const INK_700   = '#243359'
const INK_400   = '#566e9e'
const INK_200   = '#adb9d4'
const INK_100   = '#d5dce9'
const AMBER_500 = '#f59e0b'
const AMBER_400 = '#fbbf24'
const GREEN_500 = '#22c55e'
const GREEN_400 = '#4ade80'
const SLATE_400 = '#94a3b8'
const RED_400   = '#f87171'

const PIE_COLORS = [INK_700, INK_400, AMBER_500, GREEN_500, SLATE_400, RED_400, INK_200, AMBER_400]

// ── Reusable helpers ──────────────────────────────────────────────────────────

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
      Loading…
    </div>
  )
}

function EmptyState({ msg = 'No data available yet.' }) {
  return (
    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">{msg}</div>
  )
}

// Custom tooltip used across charts
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs shadow-modal">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── Section 1: Stat Cards ─────────────────────────────────────────────────────

function OverviewCards({ data }) {
  if (!data) return <Spinner />
  const cards = [
    { label: 'Total Tickets',    value: data.total_tickets,                   accent: 'border-l-ink-700' },
    { label: 'Open',             value: data.open,                            accent: 'border-l-blue-400' },
    { label: 'In Progress',      value: data.in_progress,                     accent: 'border-l-amber-500' },
    { label: 'Resolved',         value: data.resolved,                        accent: 'border-l-green-500' },
    {
      label: 'Avg Resolution',
      value: data.average_resolution_time_hours != null
        ? `${data.average_resolution_time_hours}h`
        : 'N/A',
      accent: 'border-l-slate-400',
      sub: 'average hours',
    },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`card p-5 border-l-4 ${c.accent}`}>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{c.value ?? '—'}</p>
          <p className="text-sm font-medium text-gray-600 mt-1">{c.label}</p>
          {c.sub && <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>}
        </div>
      ))}
    </div>
  )
}

// ── Section 2: Staff Performance ─────────────────────────────────────────────

function StaffSection({ data }) {
  const [sortKey, setSortKey] = useState('total_assigned')
  const [sortDir, setSortDir] = useState('desc')

  const sorted = useMemo(() => {
    if (!data?.length) return []
    return [...data].sort((a, b) => {
      const av = a[sortKey] ?? 0
      const bv = b[sortKey] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [data, sortKey, sortDir])

  const toggleSort = (key) => {
    if (key === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const chartData = sorted.map((s) => ({
    name: s.staff_name ?? s.staff_id?.slice(-6) ?? '?',
    Assigned:  s.total_assigned,
    Completed: s.completed,
    Pending:   s.pending,
  }))

  if (!data) return <Spinner />
  if (!data.length) return <EmptyState msg="No tickets have been assigned yet." />

  const barHeight = Math.max(240, chartData.length * 52)

  return (
    <div className="space-y-5">
      {/* Horizontal bar chart */}
      <div className="card p-5">
        <ResponsiveContainer width="100%" height={barHeight}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 24, bottom: 5, left: 8 }}
            barGap={3}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={INK_100} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Assigned"  fill={INK_700}   radius={[0,4,4,0]} />
            <Bar dataKey="Completed" fill={GREEN_500}  radius={[0,4,4,0]} />
            <Bar dataKey="Pending"   fill={AMBER_500}  radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sortable table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Staff Member</th>
              {['total_assigned', 'completed', 'pending', 'average_resolution_time_hours'].map((k) => (
                <th
                  key={k}
                  className="px-4 py-3 text-right cursor-pointer select-none hover:text-gray-800 transition-colors"
                  onClick={() => toggleSort(k)}
                >
                  {k === 'total_assigned'               ? 'Assigned' :
                   k === 'completed'                    ? 'Completed' :
                   k === 'pending'                      ? 'Pending' :
                                                          'Avg Hours'}
                  {sortKey === k ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((s) => (
              <tr key={s.staff_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {s.staff_name ?? <span className="text-gray-400 font-mono text-xs">{s.staff_id}</span>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{s.total_assigned}</td>
                <td className="px-4 py-3 text-right tabular-nums text-green-600">{s.completed}</td>
                <td className="px-4 py-3 text-right tabular-nums text-amber-600">{s.pending}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                  {s.average_resolution_time_hours != null ? `${s.average_resolution_time_hours}h` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Section 3: Product-wise ───────────────────────────────────────────────────

const RADIAN = Math.PI / 180
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.05) return null
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5
  const x  = cx + r * Math.cos(-midAngle * RADIAN)
  const y  = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function ProductSection({ data }) {
  const [activeIndex, setActiveIndex] = useState(null)

  if (!data) return <Spinner />
  if (!data.length) return <EmptyState msg="No tickets submitted yet." />

  const pieData = data.map((p) => ({
    name: p.product_name ?? p.product_id,
    value: p.total_complaints,
  }))

  return (
    <div className="space-y-5">
      <div className="card p-5 flex flex-col lg:flex-row items-center gap-6">
        {/* Donut chart */}
        <div className="shrink-0">
          <ResponsiveContainer width={260} height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={110}
                dataKey="value"
                labelLine={false}
                label={PieLabel}
                onMouseEnter={(_, i) => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {pieData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                    opacity={activeIndex == null || activeIndex === i ? 1 : 0.55}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]
                  return (
                    <div className="card px-3 py-2 text-xs shadow-modal">
                      <p className="font-semibold text-gray-800">{d.name}</p>
                      <p className="text-gray-600">{d.value} complaint{d.value !== 1 ? 's' : ''}</p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 min-w-0">
          {pieData.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="truncate text-gray-700">{d.name}</span>
              <span className="ml-auto pl-4 tabular-nums font-medium text-gray-900">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
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
            {data.map((p) => (
              <tr key={p.product_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{p.product_name ?? p.product_id}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{p.total_complaints}</td>
                <td className="px-4 py-3 text-right tabular-nums text-blue-600">{p.open}</td>
                <td className="px-4 py-3 text-right tabular-nums text-amber-600">{p.in_progress}</td>
                <td className="px-4 py-3 text-right tabular-nums text-green-600">{p.resolved}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-500">{p.closed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Section 4: Team Performance ───────────────────────────────────────────────

function TeamSection({ data }) {
  if (!data) return <Spinner />
  if (!data.length) return <EmptyState msg="No team data available yet." />

  const chartData = data.map((t) => ({
    name: t.team_name ?? t.team_id?.slice(-6) ?? '?',
    'Total Tickets': t.total_tickets,
    Resolved:        t.resolved,
    Pending:         t.pending,
  }))

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 24, bottom: 5, left: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={INK_100} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Total Tickets" fill={INK_700}  radius={[4,4,0,0]} />
            <Bar dataKey="Resolved"      fill={GREEN_500} radius={[4,4,0,0]} />
            <Bar dataKey="Pending"       fill={AMBER_500} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Resolved</th>
              <th className="px-4 py-3 text-right">Pending</th>
              <th className="px-4 py-3 text-right">Avg Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((t) => (
              <tr key={t.team_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{t.team_name ?? t.team_id}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">{t.total_tickets}</td>
                <td className="px-4 py-3 text-right tabular-nums text-green-600">{t.resolved}</td>
                <td className="px-4 py-3 text-right tabular-nums text-amber-600">{t.pending}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                  {t.average_resolution_time_hours != null ? `${t.average_resolution_time_hours}h` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Section 5: Resolution Time Trend ─────────────────────────────────────────

function ResolutionSection({ data }) {
  if (!data) return <Spinner />
  if (!data.length) return <EmptyState msg="No resolved tickets yet — resolve some tickets to see the trend." />

  // Sort oldest→newest for the line chart
  const sorted = [...data].sort(
    (a, b) => new Date(a.resolved_at) - new Date(b.resolved_at)
  )

  const chartData = sorted.map((t) => ({
    date:  format(parseISO(t.resolved_at), 'MMM d'),
    hours: t.resolution_time_hours,
    title: t.title,
  }))

  // 10 most recent for the table
  const recent = [...data]
    .sort((a, b) => new Date(b.resolved_at) - new Date(a.resolved_at))
    .slice(0, 10)

  return (
    <div className="space-y-5">
      {/* Scatter / line chart */}
      <div className="card p-5">
        <p className="text-xs text-gray-400 mb-3">Each point is one resolved ticket. Downward trend = faster resolution.</p>
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 5, right: 24, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={INK_100} />
            <XAxis
              dataKey="date"
              type="category"
              tick={{ fontSize: 11 }}
              label={{ value: 'Resolved date', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              dataKey="hours"
              type="number"
              tick={{ fontSize: 11 }}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#9ca3af' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload
                return (
                  <div className="card px-3 py-2 text-xs shadow-modal max-w-xs">
                    <p className="font-semibold text-gray-800 truncate">{d.title}</p>
                    <p className="text-gray-600">{d.date} — <span className="font-medium">{d.hours}h</span></p>
                  </div>
                )
              }}
            />
            <Scatter
              data={chartData}
              fill={INK_700}
              opacity={0.75}
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Recent resolved table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs text-gray-500 font-medium uppercase tracking-wider">
          10 Most Recently Resolved
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Resolved By</th>
              <th className="px-4 py-3 text-right">Hours</th>
              <th className="px-4 py-3 text-right">Resolved At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recent.map((t) => (
              <tr key={t.ticket_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                  <span className="line-clamp-1 block">{t.title}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{t.product_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{t.assigned_to_name ?? '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-ink-700">
                  {t.resolution_time_hours != null ? `${t.resolution_time_hours}h` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-400 tabular-nums">
                  {format(parseISO(t.resolved_at), 'MMM d, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Section 6: Customer Satisfaction ─────────────────────────────────────────

function SatisfactionSection({ data }) {
  if (!data) return <Spinner />
  if (data.total_ratings === 0) return <EmptyState msg="No ratings yet — customers can rate resolved tickets." />

  const distData = [1, 2, 3, 4, 5].map((star) => ({
    name: `${star}★`,
    count: data.rating_distribution?.[String(star)] ?? 0,
  }))

  const staffSorted = [...(data.per_staff_satisfaction ?? [])].sort(
    (a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0)
  )

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 border-l-4 border-l-amber-500">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {data.average_rating != null ? `${data.average_rating} ★` : 'N/A'}
          </p>
          <p className="text-sm font-medium text-gray-600 mt-1">Average Rating</p>
          <p className="text-xs text-gray-400 mt-0.5">out of 5</p>
        </div>
        <div className="card p-5 border-l-4 border-l-ink-700">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{data.total_ratings}</p>
          <p className="text-sm font-medium text-gray-600 mt-1">Total Ratings</p>
          <p className="text-xs text-gray-400 mt-0.5">ratings collected</p>
        </div>
      </div>

      {/* Rating distribution bar chart */}
      <div className="card p-5">
        <p className="text-xs text-gray-400 mb-3">Distribution of ratings across all reviewed tickets</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={distData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#d5dce9" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="count" name="Ratings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-staff satisfaction table */}
      {staffSorted.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Staff Member</th>
                <th className="px-4 py-3 text-right">Avg Rating</th>
                <th className="px-4 py-3 text-right">Total Ratings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staffSorted.map((s) => (
                <tr key={s.staff_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.staff_name ?? s.staff_id}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-amber-600">
                    {s.average_rating != null ? `${s.average_rating} ★` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                    {s.total_ratings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [overview,          setOverview]          = useState(null)
  const [staffData,         setStaffData]         = useState(null)
  const [productData,       setProductData]       = useState(null)
  const [teamData,          setTeamData]          = useState(null)
  const [resolutionData,    setResolutionData]    = useState(null)
  const [satisfactionData,  setSatisfactionData]  = useState(null)
  const [error,             setError]             = useState(null)

  useEffect(() => {
    Promise.allSettled([
      getOverview(),
      getStaffPerformance(),
      getProductWise(),
      getTeamPerformance(),
      getTicketResolutionTimes(),
      getSatisfactionOverview(),
    ]).then(([ov, sp, pw, tp, rt, sat]) => {
      if (ov.status === 'fulfilled') setOverview(ov.value.data)
      else setError('Failed to load overview data.')

      if (sp.status === 'fulfilled') setStaffData(sp.value.data)
      if (pw.status === 'fulfilled') setProductData(pw.value.data)
      if (tp.status === 'fulfilled') setTeamData(tp.value.data)
      if (rt.status === 'fulfilled') setResolutionData(rt.value.data)
      if (sat.status === 'fulfilled') setSatisfactionData(sat.value.data)
    })
  }, [])

  return (
    <div className="space-y-10 pb-10">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">System-wide performance metrics — admin view</p>
      </div>

      <div className="flex justify-end">
        <button
          className="btn-secondary"
          onClick={() => exportTicketsCSV().catch(console.error)}
        >
          Export All Tickets (CSV)
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── 1. Overview stat cards ── */}
      <section>
        <SectionHeader
          title="Overview"
          sub="Current snapshot across all tickets in the system"
        />
        <OverviewCards data={overview} />
      </section>

      {/* ── 2. Staff performance ── */}
      <section>
        <div className="flex items-start justify-between">
          <SectionHeader
            title="Staff Performance"
            sub="Click a column header in the table to sort"
          />
          <button
            className="btn-secondary shrink-0"
            onClick={() => exportStaffPerformanceCSV().catch(console.error)}
          >
            Export Staff Data (CSV)
          </button>
        </div>
        <StaffSection data={staffData} />
      </section>

      {/* ── 3. Product-wise ── */}
      <section>
        <div className="flex items-start justify-between">
          <SectionHeader
            title="Product Analysis"
            sub="Complaint volume and status breakdown by product"
          />
          <button
            className="btn-secondary shrink-0"
            onClick={() => exportProductWiseCSV().catch(console.error)}
          >
            Export Product Data (CSV)
          </button>
        </div>
        <ProductSection data={productData} />
      </section>

      {/* ── 4. Team performance ── */}
      <section>
        <SectionHeader
          title="Team Performance"
          sub="Aggregated metrics per handling team"
        />
        <TeamSection data={teamData} />
      </section>

      {/* ── 5. Resolution time trend ── */}
      <section>
        <SectionHeader
          title="Resolution Time Trend"
          sub="How quickly are tickets being resolved? Lower = faster."
        />
        <ResolutionSection data={resolutionData} />
      </section>

      {/* ── 6. Customer Satisfaction ── */}
      <section>
        <SectionHeader
          title="Customer Satisfaction"
          sub="Ratings submitted by customers on resolved tickets"
        />
        <SatisfactionSection data={satisfactionData} />
      </section>
    </div>
  )
}
