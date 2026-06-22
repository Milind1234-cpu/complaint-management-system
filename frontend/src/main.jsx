import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import toast, { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { WebSocketProvider } from './context/WebSocketContext'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 4xx — backend errors aren't transient
      retry: (failureCount, error) => {
        const status = error?.response?.status
        if (status >= 400 && status < 500) return false
        return failureCount < 2
      },
      staleTime: 30_000,      // cached data stays fresh for 30s
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        // Surface unhandled mutation errors as toasts
        const msg = error?.response?.data?.detail
        if (typeof msg === 'string') toast.error(msg)
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WebSocketProvider>
            <App />

            {/* Toast notifications — top-right, auto-dismiss 4s */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  fontSize: '0.875rem',
                  maxWidth: '380px',
                  borderRadius: '0.75rem',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                },
                success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />

            {/* React Query devtools — only in dev, tree-shaken in prod */}
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          </WebSocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
