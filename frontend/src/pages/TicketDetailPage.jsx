import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTicket, updateStatus, addComment, reassignTicket, rateTicket } from '../api/tickets'
import { getUsers } from '../api/users'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/tickets/StatusBadge'
import ActivityTimeline from '../components/tickets/ActivityTimeline'
import Badge from '../components/ui/Badge'
import { format } from 'date-fns'
import StarRating from '../components/ui/StarRating'

const STATUSES = ['open', 'in_progress', 'resolved', 'closed']

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isCustomer, isAdmin, user } = useAuth()

  const [ticket, setTicket]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [staffList, setStaffList]   = useState([])
  const [comment, setComment]       = useState('')
  const [commenting, setCommenting] = useState(false)
  const [newStatus, setNewStatus]   = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [updating, setUpdating]     = useState(false)
  const [reassignTo, setReassignTo] = useState('')
  const [reassigning, setReassigning] = useState(false)

  const [ratingValue, setRatingValue]       = useState(0)
  const [ratingComment, setRatingComment]   = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [ratingError, setRatingError]       = useState(null)

  const load = useCallback(() => {
    getTicket(id).then((r) => {
      setTicket(r.data)
      setNewStatus(r.data.status)
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (isAdmin) {
      getUsers({ role: 'staff' }).then((r) => setStaffList(r.data)).catch(() => {})
    }
  }, [isAdmin])

  const handleStatusUpdate = async (e) => {
    e.preventDefault()
    if (!newStatus || newStatus === ticket.status) return
    setUpdating(true)
    try {
      await updateStatus(id, newStatus, statusNote || undefined)
      setStatusNote('')
      load()
    } finally {
      setUpdating(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setCommenting(true)
    try {
      await addComment(id, comment.trim())
      setComment('')
      load()
    } finally {
      setCommenting(false)
    }
  }

  const handleReassign = async (e) => {
    e.preventDefault()
    if (!reassignTo) return
    setReassigning(true)
    try {
      await reassignTicket(id, reassignTo)
      setReassignTo('')
      load()
    } finally {
      setReassigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">Loading ticket…</div>
    )
  }

  if (!ticket) {
    return (
      <div className="card p-8 text-center text-gray-400">Ticket not found.</div>
    )
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back
      </button>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">{ticket.title}</h1>
            <p className="text-xs text-gray-400 mt-1">
              #{ticket._id.slice(-8).toUpperCase()} &middot; Opened {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge value={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 pt-4 border-t border-gray-100 text-sm">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide block mb-0.5">Product</span>
            <span className="font-medium">{ticket.product_name ?? '—'}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide block mb-0.5">Assigned To</span>
            <span className="font-medium">{ticket.assigned_to_name ?? 'Unassigned'}</span>
          </div>
          {ticket.resolved_at && (
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide block mb-0.5">Resolved At</span>
              <span className="font-medium">{format(new Date(ticket.resolved_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status update — staff and admin */}
      {!isCustomer && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h2>
          <form onSubmit={handleStatusUpdate} className="space-y-3">
            <div className="flex gap-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="input-field max-w-[180px]"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Optional note…"
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={updating || newStatus === ticket.status}
                className="btn-primary shrink-0"
              >
                {updating ? 'Saving…' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reassign — admin only */}
      {isAdmin && staffList.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Reassign Ticket</h2>
          <form onSubmit={handleReassign} className="flex gap-3">
            <select
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="">Select staff member…</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s._id === ticket.assigned_to ? '(current)' : ''}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={reassigning || !reassignTo}
              className="btn-secondary shrink-0"
            >
              {reassigning ? 'Reassigning…' : 'Reassign'}
            </button>
          </form>
        </div>
      )}

      {/* Activity timeline */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Activity ({ticket.activity_log?.length ?? 0})
        </h2>
        <ActivityTimeline log={ticket.activity_log ?? []} />
      </div>

      {/* Add comment */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Comment</h2>
        <form onSubmit={handleComment} className="space-y-3">
          <textarea
            rows={3}
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment…"
            className="input-field resize-none"
          />
          <button
            type="submit"
            disabled={commenting || !comment.trim()}
            className="btn-primary"
          >
            {commenting ? 'Posting…' : 'Post Comment'}
          </button>
        </form>
      </div>

      {/* ── Rating section ── */}
      {/* Interactive rating form — shown when: customer, creator, resolved/closed, not yet rated */}
      {isCustomer &&
        user?._id === ticket.created_by &&
        ['resolved', 'closed'].includes(ticket.status) &&
        ticket.satisfaction_rating == null && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Rate this ticket</h2>
          {ratingError && (
            <p className="text-sm text-red-600 mb-3">{ratingError}</p>
          )}
          <div className="space-y-3">
            <StarRating
              value={ratingValue}
              onChange={setRatingValue}
              size="lg"
            />
            <textarea
              rows={3}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Optional comment… (max 1000 characters)"
              maxLength={1000}
              className="input-field resize-none"
            />
            <button
              type="button"
              disabled={submittingRating || ratingValue === 0}
              className="btn-primary"
              onClick={async () => {
                if (ratingValue === 0) return
                setSubmittingRating(true)
                setRatingError(null)
                try {
                  await rateTicket(id, {
                    rating: ratingValue,
                    comment: ratingComment.trim() || undefined,
                  })
                  setRatingValue(0)
                  setRatingComment('')
                  load()
                } catch (err) {
                  setRatingError(
                    err?.response?.data?.detail ?? 'Failed to submit rating. Please try again.'
                  )
                } finally {
                  setSubmittingRating(false)
                }
              }}
            >
              {submittingRating ? 'Submitting…' : 'Submit Rating'}
            </button>
          </div>
        </div>
      )}

      {/* Read-only rating display — shown when already rated and is the creator customer */}
      {isCustomer &&
        user?._id === ticket.created_by &&
        ticket.satisfaction_rating != null && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Rating</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <StarRating value={ticket.satisfaction_rating} readOnly size="md" />
              <span className="text-sm text-gray-600">
                You rated: <span className="font-semibold">{ticket.satisfaction_rating}/5</span>
              </span>
            </div>
            {ticket.satisfaction_comment && (
              <p className="text-sm text-gray-500 italic">"{ticket.satisfaction_comment}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
