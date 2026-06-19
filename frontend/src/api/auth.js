import client from './axiosClient'

export const login = (email, password) => {
  const params = new URLSearchParams({ username: email, password })
  return client.post('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export const register = (data) => client.post('/auth/register', data)
