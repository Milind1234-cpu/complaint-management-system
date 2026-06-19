import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import clsx from 'clsx'

const navItems = [
  { to: '/',          label: 'Dashboard',  roles: ['customer','agent','manager','admin'] },
  { to: '/tickets',   label: 'Tickets',    roles: ['customer','agent','manager','admin'] },
  { to: '/products',  label: 'Products',   roles: ['manager','admin'] },
  { to: '/teams',     label: 'Teams',      roles: ['manager','admin'] },
  { to: '/users',     label: 'Users',      roles: ['manager','admin'] },
  { to: '/analytics', label: 'Analytics',  roles: ['manager','admin'] },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-primary-700 text-white flex flex-col">
        <div className="px-4 py-5 text-lg font-bold border-b border-primary-600">
          CMS
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems
            .filter((item) => item.roles.includes(user?.role ?? ''))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-primary-100 hover:bg-primary-600',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="px-4 py-4 border-t border-primary-600 text-sm">
          <p className="truncate font-medium">{user?.full_name}</p>
          <p className="text-primary-300 capitalize">{user?.role}</p>
          <button
            onClick={handleLogout}
            className="mt-2 text-primary-200 hover:text-white underline text-xs"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
