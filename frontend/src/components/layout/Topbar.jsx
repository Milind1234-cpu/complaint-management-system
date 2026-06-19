import { useAuth } from '../../context/AuthContext'
import Badge from '../ui/Badge'

export default function Topbar({ title }) {
  const { user } = useAuth()

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      {user && (
        <div className="flex items-center gap-3">
          <Badge value={user.role} />
          <span className="text-sm font-medium text-gray-700">{user.name}</span>
        </div>
      )}
    </header>
  )
}
