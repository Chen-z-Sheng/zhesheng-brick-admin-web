import request from '@/utils/request'

export function getSchemes(params = {}) {
  return request.get('/admin/form-schemes', { params }).then(res => res.data)
}
export function getScheme(id) {
  return request.get(`/admin/form-schemes/${id}`).then(res => res.data)
}
export function createScheme(payload) {
  return request.post('/admin/form-schemes', payload).then(res => res.data)
}
export function updateScheme(id, payload) {
  return request.patch(`/admin/form-schemes/${id}`, payload).then(res => res.data)
}
export function deleteScheme(id) {
  return request.delete(`/admin/form-schemes/${id}`).then(() => true)
}