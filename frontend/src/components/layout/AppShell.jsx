import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const PAGE_TITLES = {
  '/':              'Dashboard',
  '/tickets':       'Tickets',
  '/tickets/new':   'New Ticket',
  '/products':      'Products',
  '/analytics':     'Analytics',
}

function getTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/tickets/')) return 'Ticket Detail'
  return 'Complaint Management'
}

export default function AppShell() {
  const { pathname } = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={getTitle(pathname)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
