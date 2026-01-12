import api from './index'

export function getProperties() {
  return api.get('/properties')
}

export function getProperty(id) {
  return api.get(`/properties/${id}`)
}

export function createProperty(data) {
  return api.post('/properties', data)
}

export function updateProperty(id, data) {
  return api.put(`/properties/${id}`, data)
}

export function deleteProperty(id) {
  return api.delete(`/properties/${id}`)
}
