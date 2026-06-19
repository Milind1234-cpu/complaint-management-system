import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'customer' | 'agent' | 'manager' | 'admin'

interface User {
  _id: string
  full_name: string
  email: string
  role: Role
  team_id: string | null
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'auth' },
  ),
)
