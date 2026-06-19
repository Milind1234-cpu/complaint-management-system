import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TicketsPage from './pages/TicketsPage'
import TicketDetailPage from './pages/TicketDetailPage'
import NewTicketPage from './pages/NewTicketPage'
import UsersPage from './pages/UsersPage'
import TeamsPage from './pages/TeamsPage'
import ProductsPage from './pages/ProductsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import Layout from './components/Layout'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/new" element={<NewTicketPage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
