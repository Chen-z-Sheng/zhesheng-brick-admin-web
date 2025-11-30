import request from '@/utils/request'

export function getForms(params = {}) {
  return request.get('/admin/form', { params }).then(res => res.data)
}
export function getForm(id) {
  return request.get(`/admin/form/${id}`).then(res => res.data)
}
export function createForm(payload) {
  return request.post('/admin/form', payload).then(res => res.data)
}
export function updateForm(id, payload) {
  return request.patch(`/admin/form/${id}`, payload).then(res => res.data)
}
export function deleteForm(id) {
  return request.delete(`/admin/form/${id}`).then(() => true)
}
