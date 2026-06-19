import client from './axiosClient'

export const getTeams = () => client.get('/teams/')
export const createTeam = (data) => client.post('/teams/', data)
