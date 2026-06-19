import { useState, useEffect } from 'react'
import { getProducts, createProduct, updateProduct } from '../api/products'
import { getTeams } from '../api/teams'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import { format } from 'date-fns'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [teams, setTeams]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm] = useState({ name: '', description: '', team_id: '' })

  const load = () => {
    Promise.all([getProducts(), getTeams()])
      .then(([pr, tr]) => {
        setProducts(pr.data)
        setTeams(tr.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createProduct(form)
      setForm({ name: '', description: '', team_id: '' })
      setShowModal(false)
      load()
    } catch (err) {
      const detail = err?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to create product')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (product) => {
    await updateProduct(product._id, { is_active: !product.is_active })
    load()
  }

  const teamName = (teamId) => {
    const t = teams.find((t) => t._id === teamId)
    return t ? t.name : teamId ?? '—'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Products</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Add Product
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-8 text-center text-gray-400">Loading…</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{p.description ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{teamName(p.team_id)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {format(new Date(p.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`text-xs font-medium ${p.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'} transition-colors`}
                    >
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No products yet. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setError('') }} title="Add Product">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              required
              minLength={2}
              value={form.name}
              onChange={set('name')}
              className="input-field"
              placeholder="e.g. Smart TV X200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={set('description')}
              className="input-field resize-none"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Handling Team <span className="text-red-500">*</span></label>
            <select
              required
              value={form.team_id}
              onChange={set('team_id')}
              className="input-field"
            >
              <option value="">Select a team…</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Creating…' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
