// 角色、权限相关接口
import request from '@/utils/request'

// 获取所有权限信息
export async function getPermissionAll() {
  return request({
    url: 'sys/permission',
    method: 'get'
  })
}

// 获取角色信息
export async function getPermissionInfo(id) {
  return request({
    url: `sys/permission/${id}`,
    method: 'get'
  })
}

// 添加角色及权限
export async function createRole(data) {
  return request({
    url: 'sys/role',
    method: 'post',
    data
  })
}

// 获取所有角色及权限信息
export async function getRoleAll() {
  return request({
    url: 'sys/role',
    method: 'get'
  })
}

// 获取角色信息
export async function getRoleInfo(id) {
  return request({
    url: `sys/role/${id}`,
    method: 'get'
  })
}

// 修改角色及权限
export async function updateRole(id, data) {
  return request({
    url: `sys/role/${id}`,
    method: 'patch',
    data
  })
}

// 删除角色及权限
export async function deleteRole(id) {
  return request({
    url: `sys/role/${id}`,
    method: 'delete'
  })
}
