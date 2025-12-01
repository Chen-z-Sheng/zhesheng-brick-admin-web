import request from '@/utils/request'

export function getFormTemplates(params = {}) {
  return request.get('/admin/form-template', { params }).then(res => res.data)
}
export function getFormTemplate(id) {
  return request.get(`/admin/form-template/${id}`).then(res => res.data)
}
export function createFormTemplate(payload) {
  return request.post('/admin/form-template', payload).then(res => res.data)
}
export function updateFormTemplate(id, payload) {
  return request.patch(`/admin/form-template/${id}`, payload).then(res => res.data)
}
export function deleteFormTemplate(id) {
  return request.delete(`/admin/form-template/${id}`).then(() => true)
}
