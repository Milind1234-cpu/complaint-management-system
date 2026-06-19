import client from './axiosClient'

export const getTickets = (params) => client.get('/tickets/', { params })
export const getTicket = (id) => client.get(`/tickets/${id}`)
export const createTicket = (data) => client.post('/tickets/', data)
export const updateStatus = (id, status, comment) =>
  client.patch(`/tickets/${id}/status`, { status, comment })
export const reassignTicket = (id, assigned_to) =>
  client.patch(`/tickets/${id}/reassign`, { assigned_to })
export const addComment = (id, comment) =>
  client.post(`/tickets/${id}/comments`, { comment })
