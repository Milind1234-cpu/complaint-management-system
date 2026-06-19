import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'

interface FormValues {
  full_name: string
  email: string
  password: string
}

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>()
  const navigate = useNavigate()

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post('/auth/register', { ...data, role: 'customer' })
      navigate('/login')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError('root', { message: msg ?? 'Registration failed' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">Create account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('full_name', { required: 'Required', minLength: { value: 2, message: 'Too short' } })}
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('email', { required: 'Required' })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          {errors.root && <p className="text-red-500 text-sm">{errors.root.message}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-500 text-center">
          Have an account? <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
