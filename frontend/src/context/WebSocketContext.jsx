/**
 * WebSocketContext.jsx
 *
 * Manages a single persistent WebSocket connection per logged-in user.
 * - Opens ws://<host>/ws/<user_id>?token=<jwt> when user is authenticated
 * - Closes cleanly on logout
 * - Reconnects with exponential backoff (1s → 2s → 4s → 8s → … → 30s max)
 * - Shows toast notifications for incoming events (react-hot-toast)
 * - Dispatches a 'ws-ticket-update' CustomEvent on every message so React
 *   Query listeners can invalidate caches without coupling to this context
 *
 * If the WebSocket fails entirely the app works 100% normally — WS is
 * enhancement-only, never required for core functionality.
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'

const WebSocketContext = createContext(null)

// Determine the WebSocket base URL from the current page origin
function getWsBase() {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  // In dev, Vite proxies /api → localhost:8000, but WebSockets need the
  // backend URL directly (the Vite proxy does NOT support WebSocket upgrading
  // by default without explicit config). Fall back to the Vite dev-server
  // host with port 8000.
  const host = window.location.hostname
  const port = import.meta.env.VITE_API_BASE_URL
    ? '' // production — WS URL is same host as API
    : ':8000'
  const wsBase = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/^https?/, proto.replace(':', ''))
    : `${proto}//${host}${port}`
  return wsBase
}

const TOAST_LABELS = {
  ticket_assigned:       'New ticket assigned to you',
  ticket_created:        'New complaint submitted',
  ticket_status_updated: (msg) => msg || 'Ticket status updated',
  ticket_reassigned:     'Ticket reassigned',
  comment_added:         'New comment on your ticket',
  ticket_rated:          'Ticket received a new rating',
}

const MAX_BACKOFF_MS = 30_000

export function WebSocketProvider({ children }) {
  const { user, token } = useAuth()
  const wsRef           = useRef(null)
  const reconnectTimer  = useRef(null)
  const backoffMs       = useRef(1000)
  const isMounted       = useRef(true)
  const [isConnected, setIsConnected]   = useState(false)
  const [lastMessage, setLastMessage]   = useState(null)

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!user?._id || !token) return
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return

    const wsBase = getWsBase()
    const url    = `${wsBase}/ws/${user._id}?token=${encodeURIComponent(token)}`

    let ws
    try {
      ws = new WebSocket(url)
    } catch {
      // WebSocket construction failed (e.g. bad URL in test env) — schedule retry
      reconnectTimer.current = setTimeout(() => { if (isMounted.current) connect() }, backoffMs.current)
      return
    }

    wsRef.current = ws

    ws.onopen = () => {
      if (!isMounted.current) return
      setIsConnected(true)
      backoffMs.current = 1000  // reset backoff on successful connection
    }

    ws.onmessage = (event) => {
      if (!isMounted.current) return
      let msg
      try {
        msg = JSON.parse(event.data)
      } catch {
        return  // ignore non-JSON frames
      }

      setLastMessage(msg)

      // Show toast notification
      try {
        const label = TOAST_LABELS[msg.event]
        if (label) {
          const text = typeof label === 'function' ? label(msg.message) : (msg.message || label)
          toast(text, { icon: '🔔' })
        }
      } catch {
        // Toast errors must not propagate
      }

      // Dispatch browser CustomEvent so React Query listeners can invalidate
      try {
        window.dispatchEvent(new CustomEvent('ws-ticket-update', { detail: msg }))
      } catch {
        // CustomEvent errors must not propagate
      }
    }

    ws.onerror = () => {
      // onerror is always followed by onclose — handle reconnect there
    }

    ws.onclose = () => {
      if (!isMounted.current) return
      setIsConnected(false)
      wsRef.current = null

      // Only reconnect if user is still logged in
      if (user?._id && token) {
        clearReconnectTimer()
        reconnectTimer.current = setTimeout(() => {
          if (isMounted.current) {
            backoffMs.current = Math.min(backoffMs.current * 2, MAX_BACKOFF_MS)
            connect()
          }
        }, backoffMs.current)
      }
    }
  }, [user, token, clearReconnectTimer])

  // Connect when user logs in; disconnect when user logs out
  useEffect(() => {
    isMounted.current = true
    if (user?._id && token) {
      connect()
    } else {
      // Logged out — close any open connection and cancel reconnect
      clearReconnectTimer()
      if (wsRef.current) {
        wsRef.current.onclose = null  // prevent reconnect loop on manual close
        wsRef.current.close(1000, 'logout')
        wsRef.current = null
      }
      setIsConnected(false)
      backoffMs.current = 1000
    }

    return () => {
      isMounted.current = false
      clearReconnectTimer()
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close(1000, 'unmount')
        wsRef.current = null
      }
    }
  }, [user, token, connect, clearReconnectTimer])

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext)
  if (!ctx) throw new Error('useWebSocket must be used inside WebSocketProvider')
  return ctx
}
