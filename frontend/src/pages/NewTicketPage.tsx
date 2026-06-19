import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Product } from '../types'

interface FormValues {
  title: string
  description: string
  product_id: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export default function NewTicketPage() {
  const [products, setProducts] = useState<Product[]>([])
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    defaultValues: { priority: 'medium' },
  })
  const navigate = useNavigate()

  useEffect(() => {
    api.get<Product[]>('/products').then((r) => setProducts(r.data))
  }, [])

  const onSubmit = async (data: FormValues) => {
    try {
      const { data: ticket } = await api.post('/tickets', data)
      navigate(`/tickets/${ticket._id}`)
    } catch {
      setError('root', { message: 'Failed to create ticket' })
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-6">New Ticket</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('title', { required: 'Required', minLength: { value: 5, message: 'Min 5 chars' } })}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('description', { required: 'Required', minLength: { value: 10, message: 'Min 10 chars' } })}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Product</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('product_id', { required: 'Required' })}
          >
            <option value="">Select product…</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          {errors.product_id && <p className="text-red-500 text-xs mt-1">{errors.product_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('priority')}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {errors.root && <p className="text-red-500 text-sm">{errors.root.message}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}
