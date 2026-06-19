import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import api from '../lib/api'
import { Team } from '../types'

interface FormValues { name: string; description: string }

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>()

  const load = () => api.get<Team[]>('/teams').then((r) => setTeams(r.data))
  useEffect(() => { load() }, [])

  const onCreate = async (data: FormValues) => {
    await api.post('/teams', data)
    reset()
    load()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold">Teams</h1>

      <form onSubmit={handleSubmit(onCreate)} className="bg-white rounded-xl border p-5 flex gap-3">
        <input
          placeholder="Team name"
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          {...register('name', { required: true })}
        />
        <input
          placeholder="Description (optional)"
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          {...register('description')}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-60"
        >
          Add
        </button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Members</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teams.map((t) => (
              <tr key={t._id}>
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-gray-600">{t.description ?? '—'}</td>
                <td className="px-4 py-3">{t.member_ids.length}</td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No teams yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
