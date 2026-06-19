import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface FormValues {
  email: string
  password: string
}

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>()
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const onSubmit = async (data: FormValues) => {
    try {
      // OAuth2 form-data login
      const params = new URLSearchParams()
      params.append('username', data.email)
      params.append('password', data.password)

      const { data: tokenData } = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      const { data: me } = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      setAuth(tokenData.access_token, me)
      navigate('/')
    } catch {
      setError('root', { message: 'Invalid email or password' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">Sign in</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {...register('password', { required: 'Required' })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          {errors.root && <p className="text-red-500 text-sm">{errors.root.message}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-500 text-center">
          No account? <Link to="/register" className="text-primary-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
