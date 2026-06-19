import client from './axiosClient'

export const getProducts = (activeOnly = false) =>
  client.get('/products/', { params: activeOnly ? { active_only: true } : {} })
export const createProduct = (data) => client.post('/products/', data)
export const updateProduct = (id, data) => client.patch(`/products/${id}`, data)
