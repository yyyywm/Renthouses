import api from './index'

export function getRents() {
  return api.get('/rents')
}

export function getRent(id) {
  return api.get(`/rents/${id}`)
}

export function createRent(data) {
  return api.post('/rents', data)
}

export function updateRent(id, data) {
  return api.put(`/rents/${id}`, data)
}

export function deleteRent(id) {
  return api.delete(`/rents/${id}`)
}
