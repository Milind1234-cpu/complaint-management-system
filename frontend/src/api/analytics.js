import client from './axiosClient'

export const getOverview = () => client.get('/analytics/overview')
export const getStaffPerformance = () => client.get('/analytics/staff-performance')
export const getProductWise = () => client.get('/analytics/product-wise')
export const getTeamPerformance = () => client.get('/analytics/team-performance')
export const getTicketResolutionTimes = () => client.get('/analytics/ticket-resolution-times')
