import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../lib/api'
import { Ticket } from '../types'
import Badge from '../components/Badge'
import { useAuthStore } from '../store/authStore'

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ body: string }>()

  const load = () => api.get<Ticket>(`/tickets/${id}`).then((r) => setTicket(r.data))

  useEffect(() => { load() }, [id])

  const postComment = async (data: { body: string }) => {
    await api.post(`/tickets/${id}/comments`, data)
    reset()
    load()
  }

  const updateStatus = async (status: string) => {
    await api.patch(`/tickets/${id}`, { status })
    load()
  }

  if (!ticket) return <p className="text-gray-400">Loading…</p>

  const canUpdate = user?.role !== 'customer'

  return (
    <div className="max-w-2xl space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:underline">← Back</button>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-lg font-bold">{ticket.title}</h1>
          <div className="flex gap-2 shrink-0">
            <Badge value={ticket.status} />
            <Badge value={ticket.priority} />
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
        <p className="mt-4 text-xs text-gray-400">
          Opened {new Date(ticket.created_at).toLocaleString()}
        </p>

        {canUpdate && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {(['open','in_progress','resolved','closed'] as const).map((s) => (
              <button
                key={s}
                disabled={ticket.status === s}
                onClick={() => updateStatus(s)}
                className="text-xs border rounded-full px-3 py-1 hover:bg-gray-100 disabled:opacity-40 capitalize"
              >
                {s.replace('_',' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Comments ({ticket.comments.length})</h2>
        <div className="space-y-4">
          {ticket.comments.map((c, i) => (
            <div key={i} className="border-l-2 border-gray-200 pl-3">
              <p className="text-sm">{c.body}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit(postComment)} className="mt-5 space-y-2">
          <textarea
            rows={3}
            placeholder="Add a comment…"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('body', { required: true })}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Posting…' : 'Post Comment'}
          </button>
        </form>
      </div>
    </div>
  )
}
