// src/api/formTemplate.js
const BASE = '/api';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include', // 如果需要带 cookie；不需要可去掉
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.status === 204 ? null : res.json();
}

/** 获取模板列表 */
export function getTemplates(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/templates${q ? `?${q}` : ''}`);
}

/** 获取模板详情 */
export function getTemplateDetail(id) {
  return request(`/templates/${id}`);
}

/** 新建模板 */
export function createTemplate(payload) {
  // payload: { name, teamName, description?, rule_json, option_json }
  return request('/templates', { method: 'POST', body: payload });
}

/** 更新模板 */
export function updateTemplate(id, payload) {
  // payload: { name?, teamName?, description?, rule_json?, option_json?, versionNo? }
  return request(`/templates/${id}`, { method: 'PUT', body: payload });
}

/** 删除模板 */
export function deleteTemplate(id) {
  return request(`/templates/${id}`, { method: 'DELETE' });
}

/** 复制模板（如果后端有这个接口的话，可选） */
export function duplicateTemplate(id) {
  return request(`/templates/${id}/duplicate`, { method: 'POST' });
}

/** 渲染/预览（如果单独提供了 render 接口的话，可选） */
export function getTemplateRender(id, params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/templates/${id}/render${q ? `?${q}` : ''}`);
}
