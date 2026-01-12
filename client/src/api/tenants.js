import api from './index'

export function getTenants() {
  return api.get('/tenants')
}

export function getTenant(id) {
  return api.get(`/tenants/${id}`)
}

export function createTenant(data) {
  return api.post('/tenants', data)
}

export function updateTenant(id, data) {
  return api.put(`/tenants/${id}`, data)
}

export function deleteTenant(id) {
  return api.delete(`/tenants/${id}`)
}
