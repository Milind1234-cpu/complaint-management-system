import { useEffect, useState } from 'react'
import api from '../lib/api'
import { User } from '../types'
import Badge from '../components/Badge'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    api.get<User[]>('/users').then((r) => setUsers(r.data))
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold mb-5">Users</h1>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3"><Badge value={u.role} /></td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${u.is_active ? 'text-green-600' : 'text-red-500'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
