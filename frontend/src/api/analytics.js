import client from './axiosClient'

export const getOverview = () => client.get('/analytics/overview')
export const getStaffPerformance = () => client.get('/analytics/staff-performance')
export const getProductWise = () => client.get('/analytics/product-wise')
export const getTeamPerformance = () => client.get('/analytics/team-performance')
export const getTicketResolutionTimes = () => client.get('/analytics/ticket-resolution-times')

function _triggerDownload(blob, fallbackName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fallbackName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const exportTicketsCSV = () =>
  client.get('/analytics/export/tickets-csv', { responseType: 'blob' })
    .then(res => _triggerDownload(res.data, 'tickets_export.csv'))

export const exportStaffPerformanceCSV = () =>
  client.get('/analytics/export/staff-performance-csv', { responseType: 'blob' })
    .then(res => _triggerDownload(res.data, 'staff_performance.csv'))

export const exportProductWiseCSV = () =>
  client.get('/analytics/export/product-wise-csv', { responseType: 'blob' })
    .then(res => _triggerDownload(res.data, 'product_wise.csv'))
