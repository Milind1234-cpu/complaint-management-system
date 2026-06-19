import client from './axiosClient'

export const getUsers = (params) => client.get('/users/', { params })
export const getMe = () => client.get('/users/me')
