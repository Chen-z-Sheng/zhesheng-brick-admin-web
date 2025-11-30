import request from "@/utils/request";

// 登录
export async function login(data) {
  return request({
    url: "/admin/auth/login",
    method: "post",
    data,
  });
}

// 获取用户信息
export function getUserInfo(userId) {
  return request({
    url: `admin/users/${userId}`,
    method: "get",
  });
}

// 退出登录
export function logout() {
  return request({
    url: "/admin/auth/logout",
    method: "post",
  });
}

// 注册（你后端是 create）
export function register(data) {
  return request({
    url: "/admin/users/create",
    method: "post",
    data,
  });
}

// 刷新 token（可选）
export function refreshToken() {
  return request({
    url: "/admin/auth/refresh",
    method: "post",
  });
}

 // 获取所有用户
export function getAll(params) {
  return request({
    url: 'admin/users',
    method: 'get',
    params
  })
}

// 修改用户信息
export function update(id, data) {
  return request({
    url: `admin/users/${id}`,
    method: 'patch',
    data
  })
}

// 删除用户
export function deleteUser(id) {
  return request({
    url: `admin/users/${id}`,
    method: 'delete',
    id
  })
}