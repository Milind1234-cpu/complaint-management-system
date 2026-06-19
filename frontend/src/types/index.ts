export type Role = 'customer' | 'agent' | 'manager' | 'admin'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface User {
  _id: string
  full_name: string
  email: string
  role: Role
  team_id: string | null
  is_active: boolean
}

export interface Team {
  _id: string
  name: string
  description: string | null
  member_ids: string[]
}

export interface Product {
  _id: string
  name: string
  description: string | null
  team_id: string | null
}

export interface Comment {
  author_id: string
  body: string
  created_at: string
}

export interface Ticket {
  _id: string
  title: string
  description: string
  product_id: string
  priority: TicketPriority
  status: TicketStatus
  customer_id: string
  assigned_to: string | null
  team_id: string | null
  comments: Comment[]
  created_at: string
  updated_at: string
}
